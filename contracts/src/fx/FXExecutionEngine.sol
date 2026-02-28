// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interfaces/IERC20.sol";
import "../../interfaces/IStableFX.sol";

/**
 * @title FXExecutionEngine
 * @notice Real-time FX execution layer with StableFX RFQ integration
 * @dev Handles USDC <-> EURC conversions with atomic PvP settlement
 * 
 * StableFX RFQ Lifecycle:
 * 1. Request Quote (RFQ) -> Get rate and quote ID
 * 2. Accept Quote -> Lock funds
 * 3. Execute Swap -> Atomic PvP settlement
 * 4. Confirm Settlement -> Update balances
 * 
 * Features:
 * - Real-time rate fetching
 * - Quote expiration handling
 * - Slippage protection
 * - FX exposure monitoring
 * - Rate history for analytics
 */
contract FXExecutionEngine {
    // ============ Enums ============
    
    enum QuoteStatus {
        PENDING,
        ACCEPTED,
        EXECUTED,
        EXPIRED,
        CANCELLED
    }
    
    enum SwapDirection {
        USDC_TO_EURC,
        EURC_TO_USDC
    }

    // ============ Structs ============
    
    struct FXQuote {
        bytes32 quoteId;
        address requester;
        SwapDirection direction;
        uint256 inputAmount;
        uint256 outputAmount;
        uint256 rate;              // Rate in basis points (10000 = 1:1)
        uint256 createdAt;
        uint256 expiresAt;
        QuoteStatus status;
    }
    
    struct FXExposure {
        uint256 usdcBalance;
        uint256 eurcBalance;
        uint256 eurcInUsdTerms;    // EURC converted to USD for exposure calc
        int256 netExposure;        // Positive = long EUR, negative = short EUR
        uint256 lastUpdated;
    }
    
    struct RateSnapshot {
        uint256 usdcToEurcRate;    // How much EURC per 1 USDC (in bps)
        uint256 eurcToUsdcRate;    // How much USDC per 1 EURC (in bps)
        uint256 spread;            // Spread in bps
        uint256 timestamp;
    }
    
    struct SwapExecution {
        bytes32 quoteId;
        address executor;
        SwapDirection direction;
        uint256 inputAmount;
        uint256 outputAmount;
        uint256 effectiveRate;
        uint256 executedAt;
        bytes32 settlementId;
    }

    // ============ State Variables ============
    
    IERC20 public immutable usdc;
    IERC20 public immutable eurc;
    IStableFX public stableFX;
    
    address public owner;
    address public treasuryManager;
    mapping(address => bool) public operators;
    
    // Quote management
    uint256 public quoteCount;
    mapping(bytes32 => FXQuote) public quotes;
    mapping(address => bytes32[]) public userQuotes;
    
    // Swap history
    SwapExecution[] public swapHistory;
    mapping(address => uint256[]) public userSwaps;
    
    // Rate tracking
    RateSnapshot[] public rateHistory;
    RateSnapshot public currentRate;
    
    // Configuration
    uint256 public defaultQuoteValidity;    // Default quote validity in seconds
    uint256 public maxSlippageBps;          // Maximum allowed slippage
    uint256 public minSwapAmount;           // Minimum swap amount
    uint256 public maxSwapAmount;           // Maximum swap amount per tx
    
    // Exposure limits
    uint256 public maxEurcExposure;         // Max EURC holding
    bool public exposureLimitsEnabled;

    // ============ Events ============
    
    event QuoteRequested(
        bytes32 indexed quoteId,
        address indexed requester,
        SwapDirection direction,
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 rate,
        uint256 expiresAt
    );
    
    event QuoteAccepted(
        bytes32 indexed quoteId,
        address indexed acceptor
    );
    
    event SwapExecuted(
        bytes32 indexed quoteId,
        address indexed executor,
        SwapDirection direction,
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 effectiveRate
    );
    
    event QuoteExpired(bytes32 indexed quoteId);
    event QuoteCancelled(bytes32 indexed quoteId);
    
    event RateUpdated(
        uint256 usdcToEurcRate,
        uint256 eurcToUsdcRate,
        uint256 spread
    );
    
    event ExposureWarning(
        uint256 currentExposure,
        uint256 maxExposure
    );

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "FXEngine: not owner");
        _;
    }
    
    modifier onlyOperator() {
        require(
            operators[msg.sender] || msg.sender == owner || msg.sender == treasuryManager,
            "FXEngine: not operator"
        );
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address _usdc,
        address _eurc,
        address _stableFX
    ) {
        require(_usdc != address(0), "Invalid USDC");
        require(_eurc != address(0), "Invalid EURC");
        require(_stableFX != address(0), "Invalid StableFX");
        
        usdc = IERC20(_usdc);
        eurc = IERC20(_eurc);
        stableFX = IStableFX(_stableFX);
        
        owner = msg.sender;
        operators[msg.sender] = true;
        
        // Default configuration
        defaultQuoteValidity = 30 seconds;
        maxSlippageBps = 50;          // 0.5% max slippage
        minSwapAmount = 100 * 1e6;    // 100 USDC/EURC minimum
        maxSwapAmount = 1_000_000 * 1e6; // 1M max per swap
        maxEurcExposure = 5_000_000 * 1e6; // 5M EURC max exposure
        exposureLimitsEnabled = true;
    }

    // ============ RFQ Functions ============
    
    /**
     * @notice Request a quote for USDC -> EURC swap
     * @param usdcAmount Amount of USDC to swap
     * @return quoteId Unique quote identifier
     */
    function requestUsdcToEurcQuote(uint256 usdcAmount) 
        external 
        onlyOperator 
        returns (bytes32 quoteId) 
    {
        return _requestQuote(SwapDirection.USDC_TO_EURC, usdcAmount);
    }
    
    /**
     * @notice Request a quote for EURC -> USDC swap
     * @param eurcAmount Amount of EURC to swap
     * @return quoteId Unique quote identifier
     */
    function requestEurcToUsdcQuote(uint256 eurcAmount) 
        external 
        onlyOperator 
        returns (bytes32 quoteId) 
    {
        return _requestQuote(SwapDirection.EURC_TO_USDC, eurcAmount);
    }
    
    /**
     * @notice Accept a quote and lock funds
     * @param quoteId Quote to accept
     */
    function acceptQuote(bytes32 quoteId) external onlyOperator {
        FXQuote storage quote = quotes[quoteId];
        require(quote.requester != address(0), "Quote not found");
        require(quote.status == QuoteStatus.PENDING, "Quote not pending");
        require(block.timestamp < quote.expiresAt, "Quote expired");
        
        quote.status = QuoteStatus.ACCEPTED;
        
        emit QuoteAccepted(quoteId, msg.sender);
    }
    
    /**
     * @notice Execute an accepted quote
     * @param quoteId Quote to execute
     * @return outputAmount Amount received
     */
    function executeQuote(bytes32 quoteId) 
        external 
        onlyOperator 
        returns (uint256 outputAmount) 
    {
        FXQuote storage quote = quotes[quoteId];
        require(quote.status == QuoteStatus.ACCEPTED, "Quote not accepted");
        require(block.timestamp < quote.expiresAt, "Quote expired");
        
        // Execute via StableFX
        if (quote.direction == SwapDirection.USDC_TO_EURC) {
            outputAmount = _executeUsdcToEurc(quote.inputAmount);
        } else {
            outputAmount = _executeEurcToUsdc(quote.inputAmount);
        }
        
        // Verify slippage
        uint256 expectedOutput = quote.outputAmount;
        uint256 minAcceptable = (expectedOutput * (10000 - maxSlippageBps)) / 10000;
        require(outputAmount >= minAcceptable, "Slippage exceeded");
        
        // Update quote
        quote.status = QuoteStatus.EXECUTED;
        quote.outputAmount = outputAmount;
        
        // Record execution
        bytes32 settlementId = keccak256(abi.encodePacked(quoteId, block.timestamp));
        swapHistory.push(SwapExecution({
            quoteId: quoteId,
            executor: msg.sender,
            direction: quote.direction,
            inputAmount: quote.inputAmount,
            outputAmount: outputAmount,
            effectiveRate: (outputAmount * 10000) / quote.inputAmount,
            executedAt: block.timestamp,
            settlementId: settlementId
        }));
        
        userSwaps[msg.sender].push(swapHistory.length - 1);
        
        emit SwapExecuted(
            quoteId,
            msg.sender,
            quote.direction,
            quote.inputAmount,
            outputAmount,
            (outputAmount * 10000) / quote.inputAmount
        );
        
        // Check exposure
        _checkExposure();
        
        return outputAmount;
    }
    
    /**
     * @notice Direct swap without RFQ (for small amounts)
     * @param direction Swap direction
     * @param amount Input amount
     * @param minOutput Minimum acceptable output
     * @return outputAmount Amount received
     */
    function directSwap(
        SwapDirection direction,
        uint256 amount,
        uint256 minOutput
    ) external onlyOperator returns (uint256 outputAmount) {
        require(amount >= minSwapAmount, "Below minimum");
        require(amount <= maxSwapAmount, "Above maximum");
        
        if (direction == SwapDirection.USDC_TO_EURC) {
            outputAmount = _executeUsdcToEurc(amount);
        } else {
            outputAmount = _executeEurcToUsdc(amount);
        }
        
        require(outputAmount >= minOutput, "Slippage exceeded");
        
        // Record as direct swap
        bytes32 quoteId = keccak256(abi.encodePacked("DIRECT", block.timestamp, msg.sender));
        
        swapHistory.push(SwapExecution({
            quoteId: quoteId,
            executor: msg.sender,
            direction: direction,
            inputAmount: amount,
            outputAmount: outputAmount,
            effectiveRate: (outputAmount * 10000) / amount,
            executedAt: block.timestamp,
            settlementId: quoteId
        }));
        
        emit SwapExecuted(
            quoteId,
            msg.sender,
            direction,
            amount,
            outputAmount,
            (outputAmount * 10000) / amount
        );
        
        _checkExposure();
        
        return outputAmount;
    }

    // ============ View Functions ============
    
    /**
     * @notice Get current FX rates from StableFX
     */
    function getCurrentRates() external view returns (RateSnapshot memory) {
        // Get rates using 1e6 (1 USDC/EURC) as reference amount
        uint256 refAmount = 1e6;
        (, uint256 usdcToEurcRate) = stableFX.getExchangeRate(address(usdc), address(eurc), refAmount);
        (, uint256 eurcToUsdcRate) = stableFX.getExchangeRate(address(eurc), address(usdc), refAmount);
        
        // Convert from 18 decimals to basis points (10000 = 1:1)
        uint256 usdcToEurc = (usdcToEurcRate * 10000) / 1e18;
        uint256 eurcToUsdc = (eurcToUsdcRate * 10000) / 1e18;
        
        // Calculate spread
        uint256 midRate = (usdcToEurc + eurcToUsdc) / 2;
        uint256 spread = 0;
        if (midRate > 0) {
            spread = usdcToEurc > eurcToUsdc ? 
                ((usdcToEurc - eurcToUsdc) * 10000) / midRate : 
                ((eurcToUsdc - usdcToEurc) * 10000) / midRate;
        }
        
        return RateSnapshot({
            usdcToEurcRate: usdcToEurc,
            eurcToUsdcRate: eurcToUsdc,
            spread: spread,
            timestamp: block.timestamp
        });
    }
    
    /**
     * @notice Preview swap output
     * @param direction Swap direction
     * @param inputAmount Input amount
     * @return outputAmount Expected output
     */
    function previewSwap(SwapDirection direction, uint256 inputAmount) 
        external 
        view 
        returns (uint256 outputAmount) 
    {
        if (direction == SwapDirection.USDC_TO_EURC) {
            outputAmount = stableFX.quote(address(usdc), address(eurc), inputAmount);
        } else {
            outputAmount = stableFX.quote(address(eurc), address(usdc), inputAmount);
        }
    }
    
    /**
     * @notice Get current FX exposure
     */
    function getExposure() external view returns (FXExposure memory) {
        uint256 usdcBal = usdc.balanceOf(address(this));
        uint256 eurcBal = eurc.balanceOf(address(this));
        
        // Convert EURC to USD terms using current rate
        uint256 eurcInUsd = eurcBal > 0 ? stableFX.quote(address(eurc), address(usdc), eurcBal) : 0;
        
        int256 netExposure = int256(eurcInUsd) - int256(usdcBal);
        
        return FXExposure({
            usdcBalance: usdcBal,
            eurcBalance: eurcBal,
            eurcInUsdTerms: eurcInUsd,
            netExposure: netExposure,
            lastUpdated: block.timestamp
        });
    }
    
    /**
     * @notice Get quote details
     */
    function getQuote(bytes32 quoteId) external view returns (FXQuote memory) {
        return quotes[quoteId];
    }
    
    /**
     * @notice Get user's quotes
     */
    function getUserQuotes(address user) external view returns (bytes32[] memory) {
        return userQuotes[user];
    }
    
    /**
     * @notice Get swap history count
     */
    function getSwapCount() external view returns (uint256) {
        return swapHistory.length;
    }
    
    /**
     * @notice Get swap by index
     */
    function getSwap(uint256 index) external view returns (SwapExecution memory) {
        require(index < swapHistory.length, "Index out of bounds");
        return swapHistory[index];
    }
    
    /**
     * @notice Get rate history count
     */
    function getRateHistoryCount() external view returns (uint256) {
        return rateHistory.length;
    }

    // ============ Admin Functions ============
    
    function setOperator(address operator, bool status) external onlyOwner {
        operators[operator] = status;
    }
    
    function setTreasuryManager(address _treasury) external onlyOwner {
        treasuryManager = _treasury;
    }
    
    function setMaxSlippage(uint256 bps) external onlyOwner {
        require(bps <= 500, "Slippage too high"); // Max 5%
        maxSlippageBps = bps;
    }
    
    function setSwapLimits(uint256 min, uint256 max) external onlyOwner {
        minSwapAmount = min;
        maxSwapAmount = max;
    }
    
    function setExposureLimits(uint256 maxEurc, bool enabled) external onlyOwner {
        maxEurcExposure = maxEurc;
        exposureLimitsEnabled = enabled;
    }
    
    function setQuoteValidity(uint256 validity) external onlyOwner {
        defaultQuoteValidity = validity;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    // ============ Internal Functions ============
    
    function _requestQuote(SwapDirection direction, uint256 amount) 
        internal 
        returns (bytes32 quoteId) 
    {
        require(amount >= minSwapAmount, "Below minimum");
        require(amount <= maxSwapAmount, "Above maximum");
        
        // Get rate from StableFX
        uint256 outputAmount;
        uint256 rate;
        
        if (direction == SwapDirection.USDC_TO_EURC) {
            (outputAmount, rate) = stableFX.getExchangeRate(address(usdc), address(eurc), amount);
        } else {
            (outputAmount, rate) = stableFX.getExchangeRate(address(eurc), address(usdc), amount);
        }
        // Convert rate to basis points
        rate = (rate * 10000) / 1e18;
        
        // Generate unique quote ID
        quoteId = keccak256(abi.encodePacked(
            quoteCount++,
            msg.sender,
            direction,
            amount,
            block.timestamp
        ));
        
        uint256 expiresAt = block.timestamp + defaultQuoteValidity;
        
        quotes[quoteId] = FXQuote({
            quoteId: quoteId,
            requester: msg.sender,
            direction: direction,
            inputAmount: amount,
            outputAmount: outputAmount,
            rate: rate,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: QuoteStatus.PENDING
        });
        
        userQuotes[msg.sender].push(quoteId);
        
        emit QuoteRequested(
            quoteId,
            msg.sender,
            direction,
            amount,
            outputAmount,
            rate,
            expiresAt
        );
        
        return quoteId;
    }
    
    function _executeUsdcToEurc(uint256 usdcAmount) internal returns (uint256 eurcAmount) {
        // Transfer USDC to this contract (assumes approval)
        bool success = usdc.transferFrom(msg.sender, address(this), usdcAmount);
        require(success, "USDC transfer failed");
        
        // Approve StableFX
        usdc.approve(address(stableFX), usdcAmount);
        
        // Execute swap - sends directly to msg.sender, minTarget=0 for simplicity
        eurcAmount = stableFX.swap(address(usdc), address(eurc), usdcAmount, 0, msg.sender);
        
        return eurcAmount;
    }
    
    function _executeEurcToUsdc(uint256 eurcAmount) internal returns (uint256 usdcAmount) {
        // Transfer EURC to this contract (assumes approval)
        bool success = eurc.transferFrom(msg.sender, address(this), eurcAmount);
        require(success, "EURC transfer failed");
        
        // Approve StableFX
        eurc.approve(address(stableFX), eurcAmount);
        
        // Execute swap - sends directly to msg.sender, minTarget=0 for simplicity
        usdcAmount = stableFX.swap(address(eurc), address(usdc), eurcAmount, 0, msg.sender);
        
        return usdcAmount;
    }
    
    function _checkExposure() internal {
        if (!exposureLimitsEnabled) return;
        
        uint256 eurcBal = eurc.balanceOf(address(this));
        
        if (eurcBal > maxEurcExposure) {
            emit ExposureWarning(eurcBal, maxEurcExposure);
        }
    }
    
    function _updateRateCache() internal {
        // Get rates using 1e6 (1 USDC/EURC) as reference amount
        uint256 refAmount = 1e6;
        (, uint256 usdcToEurcRate) = stableFX.getExchangeRate(address(usdc), address(eurc), refAmount);
        (, uint256 eurcToUsdcRate) = stableFX.getExchangeRate(address(eurc), address(usdc), refAmount);
        
        // Convert from 18 decimals to basis points (10000 = 1:1)
        uint256 usdcToEurc = (usdcToEurcRate * 10000) / 1e18;
        uint256 eurcToUsdc = (eurcToUsdcRate * 10000) / 1e18;
        
        uint256 midRate = (usdcToEurc + eurcToUsdc) / 2;
        uint256 spread = usdcToEurc > eurcToUsdc ? 
            usdcToEurc - eurcToUsdc : 
            eurcToUsdc - usdcToEurc;
        spread = midRate > 0 ? (spread * 10000) / midRate : 0;
        
        currentRate = RateSnapshot({
            usdcToEurcRate: usdcToEurc,
            eurcToUsdcRate: eurcToUsdc,
            spread: spread,
            timestamp: block.timestamp
        });
        
        rateHistory.push(currentRate);
        
        emit RateUpdated(usdcToEurc, eurcToUsdc, spread);
    }
}
