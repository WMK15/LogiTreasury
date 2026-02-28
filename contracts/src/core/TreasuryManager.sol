// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interfaces/IERC20.sol";
import "../../interfaces/IUSYC.sol";
import "../adapters/YieldVaultAdapter.sol";

/**
 * @title TreasuryManager
 * @notice Enterprise-grade unified treasury management for ArcLogistics
 * @dev Implements Circle Gateway unified balance abstraction with USYC yield optimization
 * 
 * Core Responsibilities:
 * 1. Unified balance view across chains (via Circle Gateway)
 * 2. Idle capital detection and auto-sweep to USYC
 * 3. Liquidity availability tracking
 * 4. Multi-operator role-based access
 * 5. Integration with FreightEscrow for locked capital tracking
 */
contract TreasuryManager {
    // ============ Structs ============
    
    struct BalanceSnapshot {
        uint256 liquidUsdc;           // Immediately available USDC
        uint256 yieldBearingUsdc;     // USDC value in USYC
        uint256 lockedInEscrow;       // USDC locked in freight escrows
        uint256 pendingSettlement;    // USDC in cross-chain settlement
        uint256 totalValue;           // Sum of all above
        uint256 unrealizedYield;      // Accumulated yield not yet harvested
        uint256 timestamp;
    }
    
    struct YieldConfig {
        uint256 targetAllocationBps;  // Target % to allocate to yield (basis points)
        uint256 minLiquidBuffer;      // Minimum USDC to keep liquid
        uint256 rebalanceThreshold;   // Min amount to trigger rebalance
        uint256 maxSingleSwap;        // Max amount per sweep operation
        bool autoSweepEnabled;        // Auto-sweep idle capital
    }
    
    struct ChainBalance {
        uint256 chainId;
        uint256 balance;
        uint256 lastUpdated;
        bool isActive;
    }
    
    struct WithdrawalRequest {
        address requester;
        address recipient;
        uint256 amount;
        uint256 requestedAt;
        uint256 approvedAt;
        bool executed;
        bool cancelled;
        string memo;
    }

    // ============ State Variables ============
    
    IERC20 public immutable usdc;
    IERC20 public immutable eurc;
    YieldVaultAdapter public yieldAdapter;
    
    address public owner;
    mapping(address => bool) public operators;
    mapping(address => bool) public admins;
    
    // Treasury state
    uint256 public liquidUsdcBalance;
    uint256 public liquidEurcBalance;
    uint256 public totalEscrowLocked;
    uint256 public totalPendingSettlement;
    
    // Yield tracking
    uint256 public totalYieldEarned;
    uint256 public lastYieldHarvest;
    
    // Configuration
    YieldConfig public yieldConfig;
    
    // Multi-chain balance tracking (Circle Gateway integration)
    mapping(uint256 => ChainBalance) public chainBalances;
    uint256[] public supportedChains;
    
    // Withdrawal queue (for large withdrawals)
    uint256 public withdrawalRequestCount;
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    uint256 public largeWithdrawalThreshold;
    
    // Escrow integration
    address public freightEscrowContract;
    mapping(uint256 => uint256) public escrowAllocations;

    // ============ Events ============
    
    event Deposit(
        address indexed depositor,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event Withdrawal(
        address indexed recipient,
        address indexed token,
        uint256 amount,
        string memo
    );
    
    event YieldSwept(
        uint256 usdcAmount,
        uint256 usycSharesReceived,
        uint256 timestamp
    );
    
    event YieldHarvested(
        uint256 yieldAmount,
        uint256 newTotalYield,
        uint256 timestamp
    );
    
    event RebalanceExecuted(
        uint256 fromLiquid,
        uint256 toYield,
        uint256 timestamp
    );
    
    event ChainBalanceUpdated(
        uint256 indexed chainId,
        uint256 balance,
        uint256 timestamp
    );
    
    event EscrowFundsLocked(
        uint256 indexed escrowId,
        uint256 amount
    );
    
    event EscrowFundsReleased(
        uint256 indexed escrowId,
        uint256 amount
    );
    
    event LargeWithdrawalRequested(
        uint256 indexed requestId,
        address requester,
        uint256 amount
    );
    
    event WithdrawalApproved(
        uint256 indexed requestId,
        address approver
    );
    
    event ConfigUpdated(
        string parameter,
        uint256 oldValue,
        uint256 newValue
    );
    
    event OperatorUpdated(address indexed operator, bool status);
    event AdminUpdated(address indexed admin, bool status);

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "TreasuryManager: not owner");
        _;
    }
    
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "TreasuryManager: not admin");
        _;
    }
    
    modifier onlyOperator() {
        require(
            operators[msg.sender] || admins[msg.sender] || msg.sender == owner,
            "TreasuryManager: not operator"
        );
        _;
    }
    
    modifier onlyEscrowContract() {
        require(msg.sender == freightEscrowContract, "TreasuryManager: not escrow");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address _usdc,
        address _eurc,
        address _yieldAdapter
    ) {
        require(_usdc != address(0), "Invalid USDC");
        require(_eurc != address(0), "Invalid EURC");
        require(_yieldAdapter != address(0), "Invalid yield adapter");
        
        usdc = IERC20(_usdc);
        eurc = IERC20(_eurc);
        yieldAdapter = YieldVaultAdapter(_yieldAdapter);
        
        owner = msg.sender;
        operators[msg.sender] = true;
        admins[msg.sender] = true;
        
        // Default yield configuration
        yieldConfig = YieldConfig({
            targetAllocationBps: 8000,      // 80% to yield
            minLiquidBuffer: 50_000 * 1e6,  // 50,000 USDC minimum liquid
            rebalanceThreshold: 10_000 * 1e6, // 10,000 USDC minimum to trigger
            maxSingleSwap: 500_000 * 1e6,   // 500,000 USDC max per operation
            autoSweepEnabled: true
        });
        
        largeWithdrawalThreshold = 100_000 * 1e6; // 100,000 USDC requires approval
        
        // Initialize supported chains (Arc ecosystem)
        supportedChains.push(5042002); // Arc Testnet
        supportedChains.push(1);       // Ethereum Mainnet
        supportedChains.push(42161);   // Arbitrum
        supportedChains.push(137);     // Polygon
    }

    // ============ Deposit Functions ============
    
    /**
     * @notice Deposit USDC into treasury
     * @param amount Amount of USDC to deposit
     */
    function depositUsdc(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");
        
        liquidUsdcBalance += amount;
        
        emit Deposit(msg.sender, address(usdc), amount, block.timestamp);
        
        // Auto-sweep if enabled and above threshold
        if (yieldConfig.autoSweepEnabled) {
            _checkAndSweep();
        }
    }
    
    /**
     * @notice Deposit EURC into treasury
     * @param amount Amount of EURC to deposit
     */
    function depositEurc(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        bool success = eurc.transferFrom(msg.sender, address(this), amount);
        require(success, "EURC transfer failed");
        
        liquidEurcBalance += amount;
        
        emit Deposit(msg.sender, address(eurc), amount, block.timestamp);
    }

    // ============ Withdrawal Functions ============
    
    /**
     * @notice Withdraw USDC from treasury
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param memo Payment reference
     */
    function withdrawUsdc(
        uint256 amount,
        address recipient,
        string calldata memo
    ) external onlyOperator {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        
        // Large withdrawals require admin approval
        if (amount >= largeWithdrawalThreshold) {
            _createWithdrawalRequest(recipient, amount, memo);
            return;
        }
        
        _executeUsdcWithdrawal(amount, recipient, memo);
    }
    
    /**
     * @notice Withdraw EURC from treasury
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param memo Payment reference
     */
    function withdrawEurc(
        uint256 amount,
        address recipient,
        string calldata memo
    ) external onlyOperator {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(liquidEurcBalance >= amount, "Insufficient EURC");
        
        liquidEurcBalance -= amount;
        
        bool success = eurc.transfer(recipient, amount);
        require(success, "EURC transfer failed");
        
        emit Withdrawal(recipient, address(eurc), amount, memo);
    }
    
    /**
     * @notice Approve a large withdrawal request
     * @param requestId ID of the withdrawal request
     */
    function approveWithdrawal(uint256 requestId) external onlyAdmin {
        WithdrawalRequest storage req = withdrawalRequests[requestId];
        require(req.requester != address(0), "Request not found");
        require(!req.executed && !req.cancelled, "Request closed");
        require(req.approvedAt == 0, "Already approved");
        
        req.approvedAt = block.timestamp;
        
        emit WithdrawalApproved(requestId, msg.sender);
    }
    
    /**
     * @notice Execute an approved withdrawal
     * @param requestId ID of the withdrawal request
     */
    function executeWithdrawal(uint256 requestId) external onlyOperator {
        WithdrawalRequest storage req = withdrawalRequests[requestId];
        require(req.approvedAt > 0, "Not approved");
        require(!req.executed && !req.cancelled, "Request closed");
        
        req.executed = true;
        
        _executeUsdcWithdrawal(req.amount, req.recipient, req.memo);
    }

    // ============ Yield Management Functions ============
    
    /**
     * @notice Sweep idle USDC to USYC for yield
     */
    function sweepToYield() external onlyOperator {
        _sweepToYield();
    }
    
    /**
     * @notice Harvest accumulated yield
     */
    function harvestYield() external onlyOperator {
        uint256 currentYield = yieldAdapter.getUnrealizedYield();
        
        if (currentYield > 0) {
            totalYieldEarned += currentYield;
            lastYieldHarvest = block.timestamp;
            
            emit YieldHarvested(currentYield, totalYieldEarned, block.timestamp);
        }
    }
    
    /**
     * @notice Rebalance treasury allocation
     */
    function rebalance() external onlyOperator {
        _rebalance();
    }
    
    /**
     * @notice Redeem USYC back to USDC for liquidity
     * @param amount Amount of USDC needed
     */
    function redeemFromYield(uint256 amount) external onlyOperator {
        require(amount > 0, "Amount must be > 0");
        
        uint256 redeemed = yieldAdapter.redeem(amount);
        liquidUsdcBalance += redeemed;
    }

    // ============ Escrow Integration Functions ============
    
    /**
     * @notice Lock funds for a freight escrow
     * @param escrowId ID of the escrow
     * @param amount Amount to lock
     */
    function lockForEscrow(uint256 escrowId, uint256 amount) external onlyEscrowContract {
        require(_getAvailableBalance() >= amount, "Insufficient available balance");
        
        // Ensure liquidity
        _ensureLiquidity(amount);
        
        liquidUsdcBalance -= amount;
        totalEscrowLocked += amount;
        escrowAllocations[escrowId] = amount;
        
        emit EscrowFundsLocked(escrowId, amount);
    }
    
    /**
     * @notice Release funds from a completed escrow
     * @param escrowId ID of the escrow
     * @param amount Amount to release
     * @param recipient Recipient of the funds
     */
    function releaseFromEscrow(
        uint256 escrowId,
        uint256 amount,
        address recipient
    ) external onlyEscrowContract {
        require(escrowAllocations[escrowId] >= amount, "Invalid escrow amount");
        
        escrowAllocations[escrowId] -= amount;
        totalEscrowLocked -= amount;
        
        bool success = usdc.transfer(recipient, amount);
        require(success, "Transfer failed");
        
        emit EscrowFundsReleased(escrowId, amount);
    }

    // ============ Multi-Chain Balance Functions ============
    
    /**
     * @notice Update balance for a specific chain (Circle Gateway callback)
     * @param chainId Chain ID
     * @param balance Current balance on that chain
     */
    function updateChainBalance(uint256 chainId, uint256 balance) external onlyOperator {
        chainBalances[chainId] = ChainBalance({
            chainId: chainId,
            balance: balance,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        emit ChainBalanceUpdated(chainId, balance, block.timestamp);
    }
    
    /**
     * @notice Get unified balance across all chains
     */
    function getUnifiedBalance() external view returns (uint256 total) {
        for (uint i = 0; i < supportedChains.length; i++) {
            total += chainBalances[supportedChains[i]].balance;
        }
        total += liquidUsdcBalance;
        total += yieldAdapter.getValueInUsdc();
    }

    // ============ View Functions ============
    
    /**
     * @notice Get complete balance snapshot
     */
    function getBalanceSnapshot() external view returns (BalanceSnapshot memory) {
        uint256 yieldValue = yieldAdapter.getValueInUsdc();
        uint256 unrealized = yieldAdapter.getUnrealizedYield();
        
        return BalanceSnapshot({
            liquidUsdc: liquidUsdcBalance,
            yieldBearingUsdc: yieldValue,
            lockedInEscrow: totalEscrowLocked,
            pendingSettlement: totalPendingSettlement,
            totalValue: liquidUsdcBalance + yieldValue + totalEscrowLocked + totalPendingSettlement,
            unrealizedYield: unrealized,
            timestamp: block.timestamp
        });
    }
    
    /**
     * @notice Get available balance (liquid + redeemable yield)
     */
    function getAvailableBalance() external view returns (uint256) {
        return _getAvailableBalance();
    }
    
    /**
     * @notice Get current yield rate from USYC
     */
    function getCurrentYieldRate() external view returns (uint256) {
        return yieldAdapter.getCurrentYieldRate();
    }
    
    /**
     * @notice Check if treasury needs rebalancing
     */
    function needsRebalancing() external view returns (bool) {
        return _needsRebalancing();
    }
    
    /**
     * @notice Get yield configuration
     */
    function getYieldConfig() external view returns (YieldConfig memory) {
        return yieldConfig;
    }

    // ============ Admin Functions ============
    
    function setOperator(address operator, bool status) external onlyAdmin {
        operators[operator] = status;
        emit OperatorUpdated(operator, status);
    }
    
    function setAdmin(address admin, bool status) external onlyOwner {
        admins[admin] = status;
        emit AdminUpdated(admin, status);
    }
    
    function setFreightEscrowContract(address escrow) external onlyOwner {
        freightEscrowContract = escrow;
    }
    
    function setYieldConfig(YieldConfig calldata config) external onlyAdmin {
        require(config.targetAllocationBps <= 10000, "Invalid bps");
        yieldConfig = config;
    }
    
    function setLargeWithdrawalThreshold(uint256 threshold) external onlyAdmin {
        uint256 oldValue = largeWithdrawalThreshold;
        largeWithdrawalThreshold = threshold;
        emit ConfigUpdated("largeWithdrawalThreshold", oldValue, threshold);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    // ============ Internal Functions ============
    
    function _getAvailableBalance() internal view returns (uint256) {
        return liquidUsdcBalance + yieldAdapter.getValueInUsdc();
    }
    
    function _needsRebalancing() internal view returns (bool) {
        if (!yieldConfig.autoSweepEnabled) return false;
        if (liquidUsdcBalance <= yieldConfig.minLiquidBuffer) return false;
        
        uint256 excess = liquidUsdcBalance - yieldConfig.minLiquidBuffer;
        return excess >= yieldConfig.rebalanceThreshold;
    }
    
    function _checkAndSweep() internal {
        if (_needsRebalancing()) {
            _sweepToYield();
        }
    }
    
    function _sweepToYield() internal {
        if (liquidUsdcBalance <= yieldConfig.minLiquidBuffer) return;
        
        uint256 available = liquidUsdcBalance - yieldConfig.minLiquidBuffer;
        uint256 toAllocate = (available * yieldConfig.targetAllocationBps) / 10000;
        
        // Cap at max single swap
        if (toAllocate > yieldConfig.maxSingleSwap) {
            toAllocate = yieldConfig.maxSingleSwap;
        }
        
        if (toAllocate == 0) return;
        
        // Approve and deposit to yield adapter
        usdc.approve(address(yieldAdapter), toAllocate);
        uint256 shares = yieldAdapter.deposit(toAllocate);
        
        liquidUsdcBalance -= toAllocate;
        
        emit YieldSwept(toAllocate, shares, block.timestamp);
    }
    
    function _rebalance() internal {
        emit RebalanceExecuted(liquidUsdcBalance, yieldAdapter.getValueInUsdc(), block.timestamp);
        _sweepToYield();
    }
    
    function _ensureLiquidity(uint256 needed) internal {
        if (liquidUsdcBalance >= needed) return;
        
        uint256 deficit = needed - liquidUsdcBalance;
        uint256 redeemed = yieldAdapter.redeem(deficit);
        liquidUsdcBalance += redeemed;
    }
    
    function _executeUsdcWithdrawal(
        uint256 amount,
        address recipient,
        string memory memo
    ) internal {
        require(_getAvailableBalance() >= amount, "Insufficient balance");
        
        // Ensure liquidity
        _ensureLiquidity(amount);
        
        liquidUsdcBalance -= amount;
        
        bool success = usdc.transfer(recipient, amount);
        require(success, "USDC transfer failed");
        
        emit Withdrawal(recipient, address(usdc), amount, memo);
    }
    
    function _createWithdrawalRequest(
        address recipient,
        uint256 amount,
        string memory memo
    ) internal {
        uint256 requestId = withdrawalRequestCount++;
        
        withdrawalRequests[requestId] = WithdrawalRequest({
            requester: msg.sender,
            recipient: recipient,
            amount: amount,
            requestedAt: block.timestamp,
            approvedAt: 0,
            executed: false,
            cancelled: false,
            memo: memo
        });
        
        emit LargeWithdrawalRequested(requestId, msg.sender, amount);
    }
}
