// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";
import "../interfaces/IStableFX.sol";

/**
 * @title Settlement
 * @notice USDC <-> EURC settlement for European logistics operations
 * @dev Integrates with Circle's StableFX for FX swaps
 */
contract Settlement {
    // ============ Structs ============
    
    struct SettlementRecord {
        address initiator;
        address sourceToken;
        address targetToken;
        uint256 sourceAmount;
        uint256 targetAmount;
        uint256 rate;
        uint256 timestamp;
        string memo;
    }

    // ============ State ============
    
    IERC20 public immutable usdc;
    IERC20 public immutable eurc;
    IStableFX public immutable stableFx;
    
    address public owner;
    mapping(address => bool) public operators;
    
    /// @notice Settlement records
    SettlementRecord[] public settlements;
    
    /// @notice User settlement history
    mapping(address => uint256[]) public userSettlements;
    
    /// @notice Total volume settled (in USDC terms)
    uint256 public totalVolumeUsdc;
    uint256 public totalVolumeEurc;

    // ============ Events ============
    
    event SettlementExecuted(
        uint256 indexed settlementId,
        address indexed initiator,
        address sourceToken,
        address targetToken,
        uint256 sourceAmount,
        uint256 targetAmount,
        uint256 rate
    );
    
    event BatchSettlementExecuted(
        uint256 indexed batchId,
        uint256 count,
        uint256 totalSourceAmount,
        uint256 totalTargetAmount
    );

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyOperator() {
        require(operators[msg.sender] || msg.sender == owner, "Not operator");
        _;
    }

    // ============ Constructor ============
    
    constructor(address _usdc, address _eurc, address _stableFx) {
        require(_usdc != address(0), "Invalid USDC");
        require(_eurc != address(0), "Invalid EURC");
        require(_stableFx != address(0), "Invalid StableFX");
        
        usdc = IERC20(_usdc);
        eurc = IERC20(_eurc);
        stableFx = IStableFX(_stableFx);
        owner = msg.sender;
        operators[msg.sender] = true;
    }

    // ============ Core Functions ============
    
    /**
     * @notice Get quote for USDC -> EURC conversion
     * @param usdcAmount Amount of USDC to convert
     */
    function quoteUsdcToEurc(uint256 usdcAmount) external view returns (uint256 eurcAmount, uint256 rate) {
        (eurcAmount, rate) = stableFx.getExchangeRate(address(usdc), address(eurc), usdcAmount);
    }
    
    /**
     * @notice Get quote for EURC -> USDC conversion
     * @param eurcAmount Amount of EURC to convert
     */
    function quoteEurcToUsdc(uint256 eurcAmount) external view returns (uint256 usdcAmount, uint256 rate) {
        (usdcAmount, rate) = stableFx.getExchangeRate(address(eurc), address(usdc), eurcAmount);
    }
    
    /**
     * @notice Convert USDC to EURC
     * @param amount USDC amount
     * @param minEurc Minimum EURC expected (slippage protection)
     * @param recipient Address to receive EURC
     * @param settlementMemo Settlement memo
     */
    function settleUsdcToEurc(
        uint256 amount,
        uint256 minEurc,
        address recipient,
        string calldata settlementMemo
    ) external returns (uint256 eurcReceived) {
        require(amount > 0, "Amount must be > 0");
        require(recipient != address(0), "Invalid recipient");
        
        // Transfer USDC from sender
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");
        
        // Approve StableFX
        usdc.approve(address(stableFx), amount);
        
        // Execute swap
        eurcReceived = stableFx.swap(
            address(usdc),
            address(eurc),
            amount,
            minEurc,
            recipient
        );
        
        // Get rate for record
        (, uint256 rate) = stableFx.getExchangeRate(address(usdc), address(eurc), amount);
        
        // Record settlement
        uint256 settlementId = settlements.length;
        settlements.push(SettlementRecord({
            initiator: msg.sender,
            sourceToken: address(usdc),
            targetToken: address(eurc),
            sourceAmount: amount,
            targetAmount: eurcReceived,
            rate: rate,
            timestamp: block.timestamp,
            memo: settlementMemo
        }));
        
        userSettlements[msg.sender].push(settlementId);
        totalVolumeUsdc += amount;
        
        emit SettlementExecuted(
            settlementId,
            msg.sender,
            address(usdc),
            address(eurc),
            amount,
            eurcReceived,
            rate
        );
    }
    
    /**
     * @notice Convert EURC to USDC
     * @param amount EURC amount
     * @param minUsdc Minimum USDC expected
     * @param recipient Address to receive USDC
     * @param settlementMemo Settlement memo
     */
    function settleEurcToUsdc(
        uint256 amount,
        uint256 minUsdc,
        address recipient,
        string calldata settlementMemo
    ) external returns (uint256 usdcReceived) {
        require(amount > 0, "Amount must be > 0");
        require(recipient != address(0), "Invalid recipient");
        
        bool success = eurc.transferFrom(msg.sender, address(this), amount);
        require(success, "EURC transfer failed");
        
        eurc.approve(address(stableFx), amount);
        
        usdcReceived = stableFx.swap(
            address(eurc),
            address(usdc),
            amount,
            minUsdc,
            recipient
        );
        
        (, uint256 rate) = stableFx.getExchangeRate(address(eurc), address(usdc), amount);
        
        uint256 settlementId = settlements.length;
        settlements.push(SettlementRecord({
            initiator: msg.sender,
            sourceToken: address(eurc),
            targetToken: address(usdc),
            sourceAmount: amount,
            targetAmount: usdcReceived,
            rate: rate,
            timestamp: block.timestamp,
            memo: settlementMemo
        }));
        
        userSettlements[msg.sender].push(settlementId);
        totalVolumeEurc += amount;
        
        emit SettlementExecuted(
            settlementId,
            msg.sender,
            address(eurc),
            address(usdc),
            amount,
            usdcReceived,
            rate
        );
    }

    // ============ View Functions ============
    
    /**
     * @notice Get settlement count
     */
    function getSettlementCount() external view returns (uint256) {
        return settlements.length;
    }
    
    /**
     * @notice Get user's settlement history
     */
    function getUserSettlements(address user) external view returns (uint256[] memory) {
        return userSettlements[user];
    }
    
    /**
     * @notice Get settlement by ID
     */
    function getSettlement(uint256 id) external view returns (SettlementRecord memory) {
        require(id < settlements.length, "Invalid ID");
        return settlements[id];
    }
    
    /**
     * @notice Get current EUR/USD rate
     */
    function getCurrentRate() external view returns (uint256) {
        (, uint256 rate) = stableFx.getExchangeRate(address(usdc), address(eurc), 1e6);
        return rate;
    }

    // ============ Admin Functions ============
    
    function setOperator(address operator, bool status) external onlyOwner {
        operators[operator] = status;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
}
