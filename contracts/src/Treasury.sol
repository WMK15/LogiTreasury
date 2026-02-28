// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";
import "../interfaces/IUSYC.sol";

/**
 * @title Treasury
 * @notice Central treasury management for logistics operations
 * @dev Manages USDC deposits, USYC yield, and operator permissions
 */
contract Treasury {
    // ============ Structs ============
    
    struct TreasuryStats {
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint256 totalYieldEarned;
        uint256 activeEscrowCount;
        uint256 activeEscrowValue;
    }

    // ============ State ============
    
    IERC20 public immutable usdc;
    IUSYC public immutable usyc;
    
    /// @notice Treasury owner
    address public owner;
    
    /// @notice Operators can execute transactions
    mapping(address => bool) public operators;
    
    /// @notice USDC balance (not in yield)
    uint256 public usdcBalance;
    
    /// @notice USYC shares (yield-bearing)
    uint256 public usycShares;
    
    /// @notice Total deposited (lifetime)
    uint256 public totalDeposited;
    
    /// @notice Total withdrawn (lifetime)
    uint256 public totalWithdrawn;
    
    /// @notice Total yield earned (lifetime)
    uint256 public totalYieldEarned;
    
    /// @notice Allocation to yield (basis points, e.g., 8000 = 80%)
    uint256 public yieldAllocationBps;
    
    /// @notice Minimum USDC to keep liquid
    uint256 public minLiquidBuffer;

    // ============ Events ============
    
    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event YieldAllocated(uint256 usdcAmount, uint256 usycShares);
    event YieldHarvested(uint256 yieldAmount);
    event OperatorUpdated(address indexed operator, bool status);
    event AllocationUpdated(uint256 newBps);
    event Transfer(address indexed to, uint256 amount, string memo);

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
    
    constructor(address _usdc, address _usyc) {
        require(_usdc != address(0), "Invalid USDC");
        require(_usyc != address(0), "Invalid USYC");
        
        usdc = IERC20(_usdc);
        usyc = IUSYC(_usyc);
        owner = msg.sender;
        operators[msg.sender] = true;
        yieldAllocationBps = 8000; // 80% to yield by default
        minLiquidBuffer = 10000 * 1e6; // 10,000 USDC minimum liquid
    }

    // ============ Core Functions ============
    
    /**
     * @notice Deposit USDC into treasury
     * @param amount Amount of USDC to deposit
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
        
        usdcBalance += amount;
        totalDeposited += amount;
        
        emit Deposit(msg.sender, amount);
        
        // Auto-allocate to yield if above buffer
        _rebalance();
    }
    
    /**
     * @notice Withdraw USDC from treasury
     * @param amount Amount to withdraw
     * @param to Recipient address
     */
    function withdraw(uint256 amount, address to) external onlyOperator {
        require(to != address(0), "Invalid recipient");
        
        // First use liquid USDC
        if (usdcBalance >= amount) {
            usdcBalance -= amount;
        } else {
            // Need to redeem from USYC
            uint256 needed = amount - usdcBalance;
            uint256 sharesToRedeem = usyc.convertToShares(needed);
            
            // Add buffer for rounding
            sharesToRedeem = (sharesToRedeem * 10100) / 10000;
            if (sharesToRedeem > usycShares) {
                sharesToRedeem = usycShares;
            }
            
            uint256 redeemed = usyc.redeem(sharesToRedeem, address(this), address(this));
            usycShares -= sharesToRedeem;
            usdcBalance += redeemed;
            usdcBalance -= amount;
        }
        
        bool success = usdc.transfer(to, amount);
        require(success, "Transfer failed");
        
        totalWithdrawn += amount;
        
        emit Withdraw(to, amount);
    }
    
    /**
     * @notice Transfer USDC with memo (for payments)
     * @param to Recipient address
     * @param amount Amount to transfer
     * @param memo Payment reference
     */
    function transfer(address to, uint256 amount, string calldata memo) 
        external 
        onlyOperator 
    {
        require(to != address(0), "Invalid recipient");
        require(getTotalBalance() >= amount, "Insufficient balance");
        
        // Ensure liquidity
        _ensureLiquidity(amount);
        
        usdcBalance -= amount;
        
        bool success = usdc.transfer(to, amount);
        require(success, "Transfer failed");
        
        emit Transfer(to, amount, memo);
    }
    
    /**
     * @notice Allocate idle USDC to yield
     */
    function allocateToYield() external onlyOperator {
        _rebalance();
    }
    
    /**
     * @notice Harvest yield - realize gains
     */
    function harvestYield() external onlyOperator {
        uint256 currentValue = usyc.convertToAssets(usycShares);
        uint256 costBasis = _getYieldCostBasis();
        
        if (currentValue > costBasis) {
            uint256 yield = currentValue - costBasis;
            totalYieldEarned += yield;
            emit YieldHarvested(yield);
        }
    }

    // ============ Admin Functions ============
    
    function setOperator(address operator, bool status) external onlyOwner {
        operators[operator] = status;
        emit OperatorUpdated(operator, status);
    }
    
    function setYieldAllocation(uint256 newBps) external onlyOwner {
        require(newBps <= 10000, "Invalid bps");
        yieldAllocationBps = newBps;
        emit AllocationUpdated(newBps);
    }
    
    function setMinLiquidBuffer(uint256 amount) external onlyOwner {
        minLiquidBuffer = amount;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    // ============ View Functions ============
    
    /**
     * @notice Get total treasury balance (USDC + USYC value)
     */
    function getTotalBalance() public view returns (uint256) {
        uint256 usycValue = usycShares > 0 ? usyc.convertToAssets(usycShares) : 0;
        return usdcBalance + usycValue;
    }
    
    /**
     * @notice Get current yield value
     */
    function getCurrentYield() public view returns (uint256) {
        if (usycShares == 0) return 0;
        
        uint256 currentValue = usyc.convertToAssets(usycShares);
        uint256 costBasis = _getYieldCostBasis();
        
        return currentValue > costBasis ? currentValue - costBasis : 0;
    }
    
    /**
     * @notice Get treasury statistics
     */
    function getStats() external view returns (TreasuryStats memory) {
        return TreasuryStats({
            totalDeposited: totalDeposited,
            totalWithdrawn: totalWithdrawn,
            totalYieldEarned: totalYieldEarned + getCurrentYield(),
            activeEscrowCount: 0, // Would need escrow integration
            activeEscrowValue: 0
        });
    }
    
    /**
     * @notice Get current APY from USYC
     */
    function getCurrentAPY() external view returns (uint256) {
        return usyc.currentYieldRate();
    }

    // ============ Internal Functions ============
    
    function _rebalance() internal {
        if (usdcBalance <= minLiquidBuffer) return;
        
        uint256 toAllocate = ((usdcBalance - minLiquidBuffer) * yieldAllocationBps) / 10000;
        if (toAllocate == 0) return;
        
        usdc.approve(address(usyc), toAllocate);
        uint256 shares = usyc.deposit(toAllocate, address(this));
        
        usdcBalance -= toAllocate;
        usycShares += shares;
        
        emit YieldAllocated(toAllocate, shares);
    }
    
    function _ensureLiquidity(uint256 needed) internal {
        if (usdcBalance >= needed) return;
        
        uint256 deficit = needed - usdcBalance;
        uint256 sharesToRedeem = usyc.convertToShares(deficit);
        
        // Add buffer
        sharesToRedeem = (sharesToRedeem * 10100) / 10000;
        if (sharesToRedeem > usycShares) {
            sharesToRedeem = usycShares;
        }
        
        uint256 redeemed = usyc.redeem(sharesToRedeem, address(this), address(this));
        usycShares -= sharesToRedeem;
        usdcBalance += redeemed;
    }
    
    function _getYieldCostBasis() internal view returns (uint256) {
        // Simplified: assume all USYC was purchased at 1:1
        // In production, track actual cost basis
        return usycShares;
    }
}
