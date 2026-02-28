// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";
import "../interfaces/IStableFX.sol";

/**
 * @title MockStableFX
 * @notice Mock StableFX for testing USDC/EURC swaps
 * @dev NOT FOR PRODUCTION
 */
contract MockStableFX is IStableFX {
    IERC20 public immutable usdc;
    IERC20 public immutable eurc;
    
    /// @notice EUR/USD rate (18 decimals, e.g., 0.92e18 = 1 USD = 0.92 EUR)
    uint256 public eurUsdRate = 0.92e18;
    
    constructor(address _usdc, address _eurc) {
        usdc = IERC20(_usdc);
        eurc = IERC20(_eurc);
    }

    function getExchangeRate(
        address sourceToken,
        address targetToken,
        uint256 amount
    ) external view override returns (uint256 targetAmount, uint256 rate) {
        if (sourceToken == address(usdc) && targetToken == address(eurc)) {
            // USDC -> EURC
            rate = eurUsdRate;
            targetAmount = (amount * eurUsdRate) / 1e18;
        } else if (sourceToken == address(eurc) && targetToken == address(usdc)) {
            // EURC -> USDC
            rate = (1e36) / eurUsdRate;
            targetAmount = (amount * 1e18) / eurUsdRate;
        } else {
            revert("Invalid pair");
        }
    }

    function swap(
        address sourceToken,
        address targetToken,
        uint256 sourceAmount,
        uint256 minTargetAmount,
        address recipient
    ) external override returns (uint256 targetAmount) {
        require(sourceAmount > 0, "Amount must be > 0");
        require(recipient != address(0), "Invalid recipient");
        
        (targetAmount, ) = this.getExchangeRate(sourceToken, targetToken, sourceAmount);
        require(targetAmount >= minTargetAmount, "Slippage exceeded");
        
        // Transfer source token in
        IERC20(sourceToken).transferFrom(msg.sender, address(this), sourceAmount);
        
        // Transfer target token out
        IERC20(targetToken).transfer(recipient, targetAmount);
        
        emit Swap(msg.sender, sourceToken, targetToken, sourceAmount, targetAmount, eurUsdRate);
    }

    function quote(
        address sourceToken,
        address targetToken,
        uint256 sourceAmount
    ) external view override returns (uint256 targetAmount) {
        (targetAmount, ) = this.getExchangeRate(sourceToken, targetToken, sourceAmount);
    }

    // ============ Mock Functions ============
    
    function setRate(uint256 newRate) external {
        eurUsdRate = newRate;
    }
    
    function seedLiquidity(uint256 usdcAmount, uint256 eurcAmount) external {
        if (usdcAmount > 0) {
            usdc.transferFrom(msg.sender, address(this), usdcAmount);
        }
        if (eurcAmount > 0) {
            eurc.transferFrom(msg.sender, address(this), eurcAmount);
        }
    }
}
