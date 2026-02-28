// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interfaces/IERC20.sol";
import "../../interfaces/IUSYC.sol";

/**
 * @title YieldVaultAdapter
 * @notice Adapter for USYC yield-bearing vault integration
 * @dev Abstracts USYC interactions for the TreasuryManager
 * 
 * USYC Integration Flow:
 * 1. Treasury deposits USDC -> Adapter deposits to USYC -> Receives shares
 * 2. Shares accrue yield over time (rebasing)
 * 3. Treasury requests withdrawal -> Adapter redeems shares -> Returns USDC
 * 
 * Key Features:
 * - Track cost basis for accurate yield calculation
 * - Handle share/asset conversions
 * - Emit events for off-chain indexing
 */
contract YieldVaultAdapter {
    // ============ Structs ============
    
    struct DepositRecord {
        uint256 amount;          // USDC deposited
        uint256 shares;          // USYC shares received
        uint256 timestamp;
        uint256 pricePerShare;   // Price at deposit time
    }
    
    struct YieldMetrics {
        uint256 totalDeposited;       // Lifetime USDC deposited
        uint256 totalWithdrawn;       // Lifetime USDC withdrawn
        uint256 currentShares;        // Current USYC share balance
        uint256 currentValue;         // Current USDC value
        uint256 unrealizedYield;      // Current unrealized yield
        uint256 realizedYield;        // Total realized yield
        uint256 currentAPY;           // Current APY from USYC
    }

    // ============ State Variables ============
    
    IERC20 public immutable usdc;
    IUSYC public immutable usyc;
    
    address public owner;
    address public treasuryManager;
    
    // Share tracking
    uint256 public totalShares;
    uint256 public totalCostBasis;  // Total USDC deposited (for yield calc)
    
    // Yield tracking
    uint256 public totalRealizedYield;
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;
    
    // Deposit history (for detailed tracking)
    DepositRecord[] public depositHistory;
    
    // Rate cache (updated periodically)
    uint256 public cachedYieldRate;
    uint256 public lastRateUpdate;
    uint256 public constant RATE_CACHE_DURATION = 1 hours;

    // ============ Events ============
    
    event Deposited(
        uint256 usdcAmount,
        uint256 sharesReceived,
        uint256 pricePerShare,
        uint256 timestamp
    );
    
    event Redeemed(
        uint256 sharesRedeemed,
        uint256 usdcReceived,
        uint256 yieldRealized,
        uint256 timestamp
    );
    
    event YieldAccrued(
        uint256 previousValue,
        uint256 newValue,
        uint256 yieldAmount,
        uint256 timestamp
    );
    
    event RateUpdated(
        uint256 oldRate,
        uint256 newRate,
        uint256 timestamp
    );

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "YieldAdapter: not owner");
        _;
    }
    
    modifier onlyTreasury() {
        require(
            msg.sender == treasuryManager || msg.sender == owner,
            "YieldAdapter: not treasury"
        );
        _;
    }

    // ============ Constructor ============
    
    constructor(address _usdc, address _usyc) {
        require(_usdc != address(0), "Invalid USDC");
        require(_usyc != address(0), "Invalid USYC");
        
        usdc = IERC20(_usdc);
        usyc = IUSYC(_usyc);
        owner = msg.sender;
    }

    // ============ Core Functions ============
    
    /**
     * @notice Deposit USDC into USYC vault
     * @param amount Amount of USDC to deposit
     * @return shares Number of USYC shares received
     */
    function deposit(uint256 amount) external onlyTreasury returns (uint256 shares) {
        require(amount > 0, "Amount must be > 0");
        
        // Transfer USDC from treasury
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");
        
        // Get current price per share for tracking
        uint256 pricePerShare = usyc.convertToAssets(1e18);
        
        // Approve and deposit to USYC
        usdc.approve(address(usyc), amount);
        shares = usyc.deposit(amount, address(this));
        
        // Update tracking
        totalShares += shares;
        totalCostBasis += amount;
        totalDeposited += amount;
        
        // Record deposit
        depositHistory.push(DepositRecord({
            amount: amount,
            shares: shares,
            timestamp: block.timestamp,
            pricePerShare: pricePerShare
        }));
        
        emit Deposited(amount, shares, pricePerShare, block.timestamp);
        
        return shares;
    }
    
    /**
     * @notice Redeem USYC shares for USDC
     * @param usdcAmount Amount of USDC needed
     * @return actualAmount Actual USDC received
     */
    function redeem(uint256 usdcAmount) external onlyTreasury returns (uint256 actualAmount) {
        require(usdcAmount > 0, "Amount must be > 0");
        
        // Calculate shares needed (with small buffer for rounding)
        uint256 sharesToRedeem = usyc.convertToShares(usdcAmount);
        sharesToRedeem = (sharesToRedeem * 10100) / 10000; // 1% buffer
        
        if (sharesToRedeem > totalShares) {
            sharesToRedeem = totalShares;
        }
        
        require(sharesToRedeem > 0, "No shares to redeem");
        
        // Calculate proportional cost basis
        uint256 proportionalCostBasis = (totalCostBasis * sharesToRedeem) / totalShares;
        
        // Redeem shares
        actualAmount = usyc.redeem(sharesToRedeem, address(this), address(this));
        
        // Calculate realized yield
        uint256 yieldRealized = 0;
        if (actualAmount > proportionalCostBasis) {
            yieldRealized = actualAmount - proportionalCostBasis;
            totalRealizedYield += yieldRealized;
        }
        
        // Update tracking
        totalShares -= sharesToRedeem;
        totalCostBasis -= proportionalCostBasis;
        totalWithdrawn += actualAmount;
        
        // Transfer USDC to treasury
        bool success = usdc.transfer(msg.sender, actualAmount);
        require(success, "USDC transfer failed");
        
        emit Redeemed(sharesToRedeem, actualAmount, yieldRealized, block.timestamp);
        
        return actualAmount;
    }
    
    /**
     * @notice Redeem all shares (full exit)
     * @return actualAmount Total USDC received
     */
    function redeemAll() external onlyTreasury returns (uint256 actualAmount) {
        require(totalShares > 0, "No shares to redeem");
        
        uint256 sharesToRedeem = totalShares;
        
        // Redeem all shares
        actualAmount = usyc.redeem(sharesToRedeem, address(this), address(this));
        
        // Calculate total yield
        uint256 yieldRealized = 0;
        if (actualAmount > totalCostBasis) {
            yieldRealized = actualAmount - totalCostBasis;
            totalRealizedYield += yieldRealized;
        }
        
        // Reset tracking
        totalShares = 0;
        totalCostBasis = 0;
        totalWithdrawn += actualAmount;
        
        // Transfer USDC to treasury
        bool success = usdc.transfer(msg.sender, actualAmount);
        require(success, "USDC transfer failed");
        
        emit Redeemed(sharesToRedeem, actualAmount, yieldRealized, block.timestamp);
        
        return actualAmount;
    }

    // ============ View Functions ============
    
    /**
     * @notice Get current USDC value of all shares
     */
    function getValueInUsdc() external view returns (uint256) {
        if (totalShares == 0) return 0;
        return usyc.convertToAssets(totalShares);
    }
    
    /**
     * @notice Get unrealized yield (current value - cost basis)
     */
    function getUnrealizedYield() external view returns (uint256) {
        if (totalShares == 0) return 0;
        
        uint256 currentValue = usyc.convertToAssets(totalShares);
        if (currentValue <= totalCostBasis) return 0;
        
        return currentValue - totalCostBasis;
    }
    
    /**
     * @notice Get total yield (realized + unrealized)
     */
    function getTotalYield() external view returns (uint256) {
        uint256 unrealized = this.getUnrealizedYield();
        return totalRealizedYield + unrealized;
    }
    
    /**
     * @notice Get current yield rate from USYC
     */
    function getCurrentYieldRate() external view returns (uint256) {
        return usyc.currentYieldRate();
    }
    
    /**
     * @notice Get comprehensive yield metrics
     */
    function getYieldMetrics() external view returns (YieldMetrics memory) {
        uint256 currentValue = totalShares > 0 ? usyc.convertToAssets(totalShares) : 0;
        uint256 unrealized = currentValue > totalCostBasis ? currentValue - totalCostBasis : 0;
        
        return YieldMetrics({
            totalDeposited: totalDeposited,
            totalWithdrawn: totalWithdrawn,
            currentShares: totalShares,
            currentValue: currentValue,
            unrealizedYield: unrealized,
            realizedYield: totalRealizedYield,
            currentAPY: usyc.currentYieldRate()
        });
    }
    
    /**
     * @notice Get number of deposit records
     */
    function getDepositCount() external view returns (uint256) {
        return depositHistory.length;
    }
    
    /**
     * @notice Get deposit record by index
     */
    function getDepositRecord(uint256 index) external view returns (DepositRecord memory) {
        require(index < depositHistory.length, "Index out of bounds");
        return depositHistory[index];
    }
    
    /**
     * @notice Calculate shares needed for a specific USDC amount
     */
    function previewRedeem(uint256 usdcAmount) external view returns (uint256 sharesNeeded) {
        return usyc.convertToShares(usdcAmount);
    }
    
    /**
     * @notice Calculate USDC received for a specific share amount
     */
    function previewWithdraw(uint256 shares) external view returns (uint256 usdcAmount) {
        return usyc.convertToAssets(shares);
    }

    // ============ Admin Functions ============
    
    function setTreasuryManager(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasuryManager = _treasury;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
    
    /**
     * @notice Emergency withdrawal (owner only)
     */
    function emergencyWithdraw() external onlyOwner returns (uint256) {
        if (totalShares == 0) return 0;
        
        uint256 amount = usyc.redeem(totalShares, address(this), address(this));
        totalShares = 0;
        totalCostBasis = 0;
        
        bool success = usdc.transfer(owner, amount);
        require(success, "Transfer failed");
        
        return amount;
    }
}
