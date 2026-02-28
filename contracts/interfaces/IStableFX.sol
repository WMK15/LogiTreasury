// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStableFX
 * @notice Interface for Circle's StableFX - Cross-currency stablecoin swaps
 * @dev Enables USDC <-> EURC conversions at market FX rates
 */
interface IStableFX {
    /// @notice Get current exchange rate from source to target
    /// @param sourceToken Address of source token (e.g., USDC)
    /// @param targetToken Address of target token (e.g., EURC)
    /// @param amount Amount of source token
    /// @return targetAmount Amount of target token receivable
    /// @return rate Current exchange rate (18 decimals)
    function getExchangeRate(
        address sourceToken,
        address targetToken,
        uint256 amount
    ) external view returns (uint256 targetAmount, uint256 rate);

    /// @notice Execute a swap from source to target token
    /// @param sourceToken Address of source token
    /// @param targetToken Address of target token
    /// @param sourceAmount Amount of source token to swap
    /// @param minTargetAmount Minimum acceptable target amount (slippage protection)
    /// @param recipient Address to receive target tokens
    /// @return targetAmount Actual amount of target tokens received
    function swap(
        address sourceToken,
        address targetToken,
        uint256 sourceAmount,
        uint256 minTargetAmount,
        address recipient
    ) external returns (uint256 targetAmount);

    /// @notice Get quote for a swap without executing
    function quote(
        address sourceToken,
        address targetToken,
        uint256 sourceAmount
    ) external view returns (uint256 targetAmount);

    event Swap(
        address indexed sender,
        address indexed sourceToken,
        address indexed targetToken,
        uint256 sourceAmount,
        uint256 targetAmount,
        uint256 rate
    );
}
