// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";

/**
 * @title IEURC
 * @notice Interface for EURC (Euro Coin) - Circle's EUR-backed stablecoin
 */
interface IEURC is IERC20 {
    // EURC follows standard ERC20 interface
    // Additional Circle-specific functions can be added here
}
