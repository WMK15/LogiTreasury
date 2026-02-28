// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interfaces/IERC20.sol";

/**
 * @title SettlementRouter
 * @notice Multi-chain settlement router with Arc Bridge Kit integration
 * @dev Routes payments across chains with optimal path selection
 * 
 * Arc Bridge Kit Integration:
 * 1. Receive cross-chain transfer request
 * 2. Calculate optimal route (gas, speed, liquidity)
 * 3. Lock source funds
 * 4. Initiate bridge transfer
 * 5. Track settlement status
 * 6. Confirm destination receipt
 * 
 * Supported Chains:
 * - Arc Testnet (5042002)
 * - Ethereum Mainnet (1)
 * - Arbitrum (42161)
 * - Polygon (137)
 * - Base (8453)
 */
contract SettlementRouter {
    // ============ Enums ============
    
    enum SettlementStatus {
        PENDING,
        INITIATED,
        BRIDGING,
        CONFIRMING,
        COMPLETED,
        FAILED,
        REFUNDED
    }
    
    enum RouteType {
        DIRECT,           // Direct bridge transfer
        SPLIT,            // Split across multiple bridges
        STAGED            // Multi-hop via intermediate chain
    }

    // ============ Structs ============
    
    struct ChainConfig {
        uint256 chainId;
        string name;
        address bridgeEndpoint;
        uint256 minTransfer;
        uint256 maxTransfer;
        uint256 estimatedTime;    // Seconds
        uint256 baseFee;          // In basis points
        bool isActive;
    }
    
    struct Settlement {
        bytes32 settlementId;
        address sender;
        address recipient;
        uint256 sourceChain;
        uint256 destChain;
        address token;
        uint256 amount;
        uint256 fee;
        uint256 initiatedAt;
        uint256 completedAt;
        SettlementStatus status;
        RouteType routeType;
        string memo;
        bytes32 bridgeTxId;
    }
    
    struct BatchSettlement {
        bytes32 batchId;
        address sender;
        uint256 destChain;
        address token;
        address[] recipients;
        uint256[] amounts;
        uint256 totalAmount;
        uint256 totalFee;
        uint256 initiatedAt;
        uint256 completedAt;
        SettlementStatus status;
    }
    
    struct RouteQuote {
        uint256 destChain;
        RouteType routeType;
        uint256 estimatedFee;
        uint256 estimatedTime;
        uint256 inputAmount;
        uint256 outputAmount;
        uint256 validUntil;
    }

    // ============ State Variables ============
    
    IERC20 public immutable usdc;
    IERC20 public immutable eurc;
    
    address public owner;
    address public treasuryManager;
    mapping(address => bool) public operators;
    
    // Chain configurations
    mapping(uint256 => ChainConfig) public chainConfigs;
    uint256[] public supportedChains;
    
    // Settlements
    uint256 public settlementCount;
    mapping(bytes32 => Settlement) public settlements;
    mapping(address => bytes32[]) public userSettlements;
    
    // Batch settlements
    uint256 public batchCount;
    mapping(bytes32 => BatchSettlement) public batchSettlements;
    
    // Bridge tracking
    mapping(bytes32 => bytes32) public bridgeToSettlement;  // Bridge tx -> Settlement
    
    // Statistics
    uint256 public totalSettled;
    uint256 public totalFees;
    mapping(uint256 => uint256) public chainVolume;

    // ============ Events ============
    
    event SettlementInitiated(
        bytes32 indexed settlementId,
        address indexed sender,
        address indexed recipient,
        uint256 destChain,
        uint256 amount,
        uint256 fee
    );
    
    event SettlementBridging(
        bytes32 indexed settlementId,
        bytes32 bridgeTxId
    );
    
    event SettlementCompleted(
        bytes32 indexed settlementId,
        uint256 timestamp
    );
    
    event SettlementFailed(
        bytes32 indexed settlementId,
        string reason
    );
    
    event BatchInitiated(
        bytes32 indexed batchId,
        address indexed sender,
        uint256 destChain,
        uint256 recipientCount,
        uint256 totalAmount
    );
    
    event BatchCompleted(
        bytes32 indexed batchId,
        uint256 timestamp
    );
    
    event ChainConfigUpdated(
        uint256 indexed chainId,
        bool isActive
    );
    
    event RouteQuoted(
        bytes32 indexed quoteId,
        uint256 destChain,
        uint256 amount,
        uint256 fee,
        uint256 estimatedTime
    );

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Router: not owner");
        _;
    }
    
    modifier onlyOperator() {
        require(
            operators[msg.sender] || msg.sender == owner || msg.sender == treasuryManager,
            "Router: not operator"
        );
        _;
    }
    
    modifier validChain(uint256 chainId) {
        require(chainConfigs[chainId].isActive, "Router: chain not supported");
        _;
    }

    // ============ Constructor ============
    
    constructor(address _usdc, address _eurc) {
        require(_usdc != address(0), "Invalid USDC");
        require(_eurc != address(0), "Invalid EURC");
        
        usdc = IERC20(_usdc);
        eurc = IERC20(_eurc);
        
        owner = msg.sender;
        operators[msg.sender] = true;
        
        // Initialize supported chains
        _initializeChains();
    }

    // ============ Settlement Functions ============
    
    /**
     * @notice Initiate a cross-chain settlement
     * @param recipient Recipient address on destination chain
     * @param destChain Destination chain ID
     * @param token Token address (USDC or EURC)
     * @param amount Amount to transfer
     * @param memo Payment reference
     * @return settlementId Unique settlement identifier
     */
    function initiateSettlement(
        address recipient,
        uint256 destChain,
        address token,
        uint256 amount,
        string calldata memo
    ) external onlyOperator validChain(destChain) returns (bytes32 settlementId) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(
            token == address(usdc) || token == address(eurc),
            "Unsupported token"
        );
        
        ChainConfig memory config = chainConfigs[destChain];
        require(amount >= config.minTransfer, "Below minimum");
        require(amount <= config.maxTransfer, "Above maximum");
        
        // Calculate fee
        uint256 fee = (amount * config.baseFee) / 10000;
        
        // Transfer tokens from sender
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Generate settlement ID
        settlementId = keccak256(abi.encodePacked(
            settlementCount++,
            msg.sender,
            recipient,
            destChain,
            amount,
            block.timestamp
        ));
        
        settlements[settlementId] = Settlement({
            settlementId: settlementId,
            sender: msg.sender,
            recipient: recipient,
            sourceChain: block.chainid,
            destChain: destChain,
            token: token,
            amount: amount,
            fee: fee,
            initiatedAt: block.timestamp,
            completedAt: 0,
            status: SettlementStatus.INITIATED,
            routeType: RouteType.DIRECT,
            memo: memo,
            bridgeTxId: bytes32(0)
        });
        
        userSettlements[msg.sender].push(settlementId);
        
        emit SettlementInitiated(
            settlementId,
            msg.sender,
            recipient,
            destChain,
            amount,
            fee
        );
        
        // Initiate bridge transfer
        _initiateBridge(settlementId);
        
        return settlementId;
    }
    
    /**
     * @notice Initiate batch settlement (mass payout)
     * @param destChain Destination chain ID
     * @param token Token address
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts
     * @return batchId Unique batch identifier
     */
    function initiateBatchSettlement(
        uint256 destChain,
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOperator validChain(destChain) returns (bytes32 batchId) {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length > 0, "Empty batch");
        require(recipients.length <= 100, "Batch too large");
        
        uint256 totalAmount = 0;
        for (uint i = 0; i < amounts.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Invalid amount");
            totalAmount += amounts[i];
        }
        
        ChainConfig memory config = chainConfigs[destChain];
        uint256 totalFee = (totalAmount * config.baseFee) / 10000;
        
        // Transfer total amount
        IERC20(token).transferFrom(msg.sender, address(this), totalAmount);
        
        // Generate batch ID
        batchId = keccak256(abi.encodePacked(
            "BATCH",
            batchCount++,
            msg.sender,
            destChain,
            totalAmount,
            block.timestamp
        ));
        
        batchSettlements[batchId] = BatchSettlement({
            batchId: batchId,
            sender: msg.sender,
            destChain: destChain,
            token: token,
            recipients: recipients,
            amounts: amounts,
            totalAmount: totalAmount,
            totalFee: totalFee,
            initiatedAt: block.timestamp,
            completedAt: 0,
            status: SettlementStatus.INITIATED
        });
        
        emit BatchInitiated(
            batchId,
            msg.sender,
            destChain,
            recipients.length,
            totalAmount
        );
        
        // Process batch
        _processBatch(batchId);
        
        return batchId;
    }
    
    /**
     * @notice Update settlement status (bridge callback)
     * @param settlementId Settlement to update
     * @param status New status
     * @param bridgeTxId Bridge transaction ID
     */
    function updateSettlementStatus(
        bytes32 settlementId,
        SettlementStatus status,
        bytes32 bridgeTxId
    ) external onlyOperator {
        Settlement storage settlement = settlements[settlementId];
        require(settlement.sender != address(0), "Settlement not found");
        
        settlement.status = status;
        
        if (bridgeTxId != bytes32(0)) {
            settlement.bridgeTxId = bridgeTxId;
            bridgeToSettlement[bridgeTxId] = settlementId;
            emit SettlementBridging(settlementId, bridgeTxId);
        }
        
        if (status == SettlementStatus.COMPLETED) {
            settlement.completedAt = block.timestamp;
            totalSettled += settlement.amount;
            totalFees += settlement.fee;
            chainVolume[settlement.destChain] += settlement.amount;
            emit SettlementCompleted(settlementId, block.timestamp);
        }
    }
    
    /**
     * @notice Mark settlement as failed and refund
     * @param settlementId Settlement to refund
     * @param reason Failure reason
     */
    function failSettlement(bytes32 settlementId, string calldata reason) 
        external 
        onlyOperator 
    {
        Settlement storage settlement = settlements[settlementId];
        require(settlement.sender != address(0), "Settlement not found");
        require(
            settlement.status != SettlementStatus.COMPLETED &&
            settlement.status != SettlementStatus.REFUNDED,
            "Cannot fail"
        );
        
        settlement.status = SettlementStatus.FAILED;
        
        // Refund sender
        IERC20(settlement.token).transfer(settlement.sender, settlement.amount);
        
        settlement.status = SettlementStatus.REFUNDED;
        
        emit SettlementFailed(settlementId, reason);
    }

    // ============ Quote Functions ============
    
    /**
     * @notice Get a route quote for cross-chain transfer
     * @param destChain Destination chain
     * @param amount Amount to transfer
     * @return quote Route quote details
     */
    function getRouteQuote(uint256 destChain, uint256 amount) 
        external 
        view 
        validChain(destChain) 
        returns (RouteQuote memory quote) 
    {
        ChainConfig memory config = chainConfigs[destChain];
        
        uint256 fee = (amount * config.baseFee) / 10000;
        
        return RouteQuote({
            destChain: destChain,
            routeType: RouteType.DIRECT,
            estimatedFee: fee,
            estimatedTime: config.estimatedTime,
            inputAmount: amount,
            outputAmount: amount - fee,
            validUntil: block.timestamp + 5 minutes
        });
    }
    
    /**
     * @notice Get optimal route across all supported chains
     * @param destChain Destination chain
     * @param amount Amount to transfer
     * @return bestRoute Optimal route details
     */
    function getOptimalRoute(uint256 destChain, uint256 amount)
        external
        view
        returns (RouteQuote memory bestRoute)
    {
        // For now, return direct route
        // In production, would analyze liquidity, gas costs, speed
        ChainConfig memory config = chainConfigs[destChain];
        
        uint256 fee = (amount * config.baseFee) / 10000;
        
        return RouteQuote({
            destChain: destChain,
            routeType: RouteType.DIRECT,
            estimatedFee: fee,
            estimatedTime: config.estimatedTime,
            inputAmount: amount,
            outputAmount: amount - fee,
            validUntil: block.timestamp + 5 minutes
        });
    }

    // ============ View Functions ============
    
    /**
     * @notice Get settlement details
     */
    function getSettlement(bytes32 settlementId) 
        external 
        view 
        returns (Settlement memory) 
    {
        return settlements[settlementId];
    }
    
    /**
     * @notice Get user's settlements
     */
    function getUserSettlements(address user) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return userSettlements[user];
    }
    
    /**
     * @notice Get batch settlement details
     */
    function getBatchSettlement(bytes32 batchId) 
        external 
        view 
        returns (BatchSettlement memory) 
    {
        return batchSettlements[batchId];
    }
    
    /**
     * @notice Get supported chains
     */
    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChains;
    }
    
    /**
     * @notice Get chain configuration
     */
    function getChainConfig(uint256 chainId) 
        external 
        view 
        returns (ChainConfig memory) 
    {
        return chainConfigs[chainId];
    }
    
    /**
     * @notice Check if chain is supported
     */
    function isChainSupported(uint256 chainId) external view returns (bool) {
        return chainConfigs[chainId].isActive;
    }
    
    /**
     * @notice Get total volume by chain
     */
    function getChainVolume(uint256 chainId) external view returns (uint256) {
        return chainVolume[chainId];
    }

    // ============ Admin Functions ============
    
    function setOperator(address operator, bool status) external onlyOwner {
        operators[operator] = status;
    }
    
    function setTreasuryManager(address _treasury) external onlyOwner {
        treasuryManager = _treasury;
    }
    
    function updateChainConfig(
        uint256 chainId,
        string calldata name,
        address bridgeEndpoint,
        uint256 minTransfer,
        uint256 maxTransfer,
        uint256 estimatedTime,
        uint256 baseFee,
        bool isActive
    ) external onlyOwner {
        chainConfigs[chainId] = ChainConfig({
            chainId: chainId,
            name: name,
            bridgeEndpoint: bridgeEndpoint,
            minTransfer: minTransfer,
            maxTransfer: maxTransfer,
            estimatedTime: estimatedTime,
            baseFee: baseFee,
            isActive: isActive
        });
        
        // Add to supported chains if new
        bool exists = false;
        for (uint i = 0; i < supportedChains.length; i++) {
            if (supportedChains[i] == chainId) {
                exists = true;
                break;
            }
        }
        if (!exists && isActive) {
            supportedChains.push(chainId);
        }
        
        emit ChainConfigUpdated(chainId, isActive);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    // ============ Internal Functions ============
    
    function _initializeChains() internal {
        // Arc Testnet
        chainConfigs[5042002] = ChainConfig({
            chainId: 5042002,
            name: "Arc Testnet",
            bridgeEndpoint: address(0),  // Set during deployment
            minTransfer: 10 * 1e6,       // 10 USDC
            maxTransfer: 10_000_000 * 1e6, // 10M USDC
            estimatedTime: 30,           // 30 seconds
            baseFee: 10,                 // 0.1%
            isActive: true
        });
        supportedChains.push(5042002);
        
        // Ethereum Mainnet
        chainConfigs[1] = ChainConfig({
            chainId: 1,
            name: "Ethereum",
            bridgeEndpoint: address(0),
            minTransfer: 100 * 1e6,
            maxTransfer: 50_000_000 * 1e6,
            estimatedTime: 900,          // 15 minutes
            baseFee: 25,                 // 0.25%
            isActive: true
        });
        supportedChains.push(1);
        
        // Arbitrum
        chainConfigs[42161] = ChainConfig({
            chainId: 42161,
            name: "Arbitrum",
            bridgeEndpoint: address(0),
            minTransfer: 10 * 1e6,
            maxTransfer: 25_000_000 * 1e6,
            estimatedTime: 60,
            baseFee: 15,
            isActive: true
        });
        supportedChains.push(42161);
        
        // Polygon
        chainConfigs[137] = ChainConfig({
            chainId: 137,
            name: "Polygon",
            bridgeEndpoint: address(0),
            minTransfer: 10 * 1e6,
            maxTransfer: 25_000_000 * 1e6,
            estimatedTime: 120,
            baseFee: 15,
            isActive: true
        });
        supportedChains.push(137);
        
        // Base
        chainConfigs[8453] = ChainConfig({
            chainId: 8453,
            name: "Base",
            bridgeEndpoint: address(0),
            minTransfer: 10 * 1e6,
            maxTransfer: 25_000_000 * 1e6,
            estimatedTime: 60,
            baseFee: 15,
            isActive: true
        });
        supportedChains.push(8453);
    }
    
    function _initiateBridge(bytes32 settlementId) internal {
        Settlement storage settlement = settlements[settlementId];
        
        // In production, this would call the Arc Bridge Kit
        // For now, simulate bridging status
        settlement.status = SettlementStatus.BRIDGING;
        
        // Generate mock bridge tx ID
        bytes32 bridgeTxId = keccak256(abi.encodePacked(
            "BRIDGE",
            settlementId,
            block.timestamp
        ));
        
        settlement.bridgeTxId = bridgeTxId;
        bridgeToSettlement[bridgeTxId] = settlementId;
        
        emit SettlementBridging(settlementId, bridgeTxId);
    }
    
    function _processBatch(bytes32 batchId) internal {
        BatchSettlement storage batch = batchSettlements[batchId];
        
        // In production, this would:
        // 1. Create individual settlements or
        // 2. Use batch bridge transfer
        
        batch.status = SettlementStatus.BRIDGING;
    }
}
