// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IUSYC
 * @notice Interface for USYC (US Yield Coin) - Circle's yield-bearing stablecoin
 * @dev USYC accrues yield from tokenized US Treasury exposure
 */
interface IUSYC {
    /// @notice Deposit USDC to mint USYC
    function deposit(uint256 usdcAmount, address receiver) external returns (uint256 usycShares);
    
    /// @notice Redeem USYC for USDC
    function redeem(uint256 usycShares, address receiver, address owner) external returns (uint256 usdcAmount);
    
    /// @notice Get current exchange rate (USYC per USDC)
    function convertToShares(uint256 usdcAmount) external view returns (uint256 usycShares);
    
    /// @notice Get current exchange rate (USDC per USYC)
    function convertToAssets(uint256 usycShares) external view returns (uint256 usdcAmount);
    
    /// @notice Total assets under management
    function totalAssets() external view returns (uint256);
    
    /// @notice Preview deposit amount
    function previewDeposit(uint256 usdcAmount) external view returns (uint256 usycShares);
    
    /// @notice Preview redeem amount
    function previewRedeem(uint256 usycShares) external view returns (uint256 usdcAmount);
    
    /// @notice Current yield rate (APY in basis points)
    function currentYieldRate() external view returns (uint256);

    // ERC20 functions
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
