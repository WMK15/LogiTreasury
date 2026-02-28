// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";
import "../interfaces/IUSYC.sol";

/**
 * @title MockUSYC
 * @notice Mock USYC for testing yield functionality
 * @dev Simulates yield accrual - NOT FOR PRODUCTION
 */
contract MockUSYC is IUSYC {
    string public constant name = "US Yield Coin";
    string public constant symbol = "USYC";
    uint8 public constant decimals = 6;
    
    IERC20 public immutable usdc;
    
    uint256 private _totalSupply;
    uint256 private _totalAssets;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    /// @notice Simulated APY (500 = 5%)
    uint256 public yieldRateBps = 500;
    
    /// @notice Last yield update
    uint256 public lastYieldUpdate;

    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC");
        usdc = IERC20(_usdc);
        lastYieldUpdate = block.timestamp;
    }

    // ============ USYC Functions ============
    
    function deposit(uint256 usdcAmount, address receiver) external override returns (uint256 usycShares) {
        require(usdcAmount > 0, "Amount must be > 0");
        
        // Transfer USDC in
        bool success = usdc.transferFrom(msg.sender, address(this), usdcAmount);
        require(success, "Transfer failed");
        
        // Calculate shares
        usycShares = convertToShares(usdcAmount);
        
        _balances[receiver] += usycShares;
        _totalSupply += usycShares;
        _totalAssets += usdcAmount;
        
        emit Transfer(address(0), receiver, usycShares);
        
        return usycShares;
    }
    
    function redeem(uint256 usycShares, address receiver, address owner) external override returns (uint256 usdcAmount) {
        require(_balances[owner] >= usycShares, "Insufficient balance");
        
        if (msg.sender != owner) {
            require(_allowances[owner][msg.sender] >= usycShares, "Insufficient allowance");
            _allowances[owner][msg.sender] -= usycShares;
        }
        
        // Simulate yield accrual
        _accrueYield();
        
        // Calculate USDC amount
        usdcAmount = convertToAssets(usycShares);
        
        _balances[owner] -= usycShares;
        _totalSupply -= usycShares;
        _totalAssets -= usdcAmount;
        
        bool success = usdc.transfer(receiver, usdcAmount);
        require(success, "Transfer failed");
        
        emit Transfer(owner, address(0), usycShares);
        
        return usdcAmount;
    }
    
    function convertToShares(uint256 usdcAmount) public view override returns (uint256) {
        if (_totalSupply == 0 || _totalAssets == 0) {
            return usdcAmount;
        }
        return (usdcAmount * _totalSupply) / _totalAssets;
    }
    
    function convertToAssets(uint256 usycShares) public view override returns (uint256) {
        if (_totalSupply == 0) {
            return usycShares;
        }
        return (usycShares * _totalAssets) / _totalSupply;
    }
    
    function totalAssets() external view override returns (uint256) {
        return _totalAssets;
    }
    
    function previewDeposit(uint256 usdcAmount) external view override returns (uint256) {
        return convertToShares(usdcAmount);
    }
    
    function previewRedeem(uint256 usycShares) external view override returns (uint256) {
        return convertToAssets(usycShares);
    }
    
    function currentYieldRate() external view override returns (uint256) {
        return yieldRateBps;
    }

    // ============ ERC20 Functions ============
    
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) external override returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(_balances[from] >= amount, "Insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }

    // ============ Mock Functions ============
    
    /**
     * @notice Simulate yield accrual (for testing)
     */
    function accrueYield() external {
        _accrueYield();
    }
    
    /**
     * @notice Set yield rate (for testing)
     */
    function setYieldRate(uint256 newRateBps) external {
        yieldRateBps = newRateBps;
    }
    
    function _accrueYield() internal {
        if (_totalAssets == 0) return;
        
        uint256 elapsed = block.timestamp - lastYieldUpdate;
        if (elapsed == 0) return;
        
        // Simple yield: (assets * rate * time) / (365 days * 10000)
        uint256 yield = (_totalAssets * yieldRateBps * elapsed) / (365 days * 10000);
        _totalAssets += yield;
        
        lastYieldUpdate = block.timestamp;
    }
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
