// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interfaces/IERC20.sol";

/**
 * @title CPNGateway
 * @notice Circle Payments Network integration for fiat on/off ramp
 * @dev Handles fiat funding and withdrawal flows via CPN
 * 
 * CPN Funding Flow:
 * 1. User initiates fiat deposit via bank transfer
 * 2. CPN receives fiat and mints USDC
 * 3. CPNGateway receives USDC via callback
 * 4. Treasury balance updated
 * 
 * CPN Withdrawal Flow:
 * 1. Treasury initiates withdrawal request
 * 2. USDC locked in CPNGateway
 * 3. CPN burns USDC and initiates wire
 * 4. Fiat settled to bank account
 * 
 * Reconciliation:
 * - Track all pending deposits/withdrawals
 * - Match CPN callbacks to requests
 * - Maintain audit trail for compliance
 */
contract CPNGateway {
    // ============ Enums ============
    
    enum DepositStatus {
        PENDING,        // Awaiting fiat arrival
        RECEIVED,       // Fiat received, minting USDC
        CREDITED,       // USDC credited to treasury
        FAILED,         // Deposit failed
        REFUNDED        // Fiat refunded to sender
    }
    
    enum WithdrawalStatus {
        REQUESTED,      // Withdrawal requested
        APPROVED,       // Approved by admin
        PROCESSING,     // CPN processing
        SETTLED,        // Wire sent
        COMPLETED,      // Bank confirmed receipt
        FAILED,         // Withdrawal failed
        REFUNDED        // USDC refunded
    }

    // ============ Structs ============
    
    struct BankAccount {
        bytes32 accountId;
        string bankName;
        string accountNumber;     // Last 4 digits only (for display)
        string routingNumber;     // Masked
        string currency;          // EUR, USD, GBP
        string country;
        bool isVerified;
        bool isActive;
        uint256 addedAt;
    }
    
    struct FiatDeposit {
        bytes32 depositId;
        address depositor;
        bytes32 bankAccountId;
        uint256 fiatAmount;       // In cents
        string fiatCurrency;      // EUR, USD
        uint256 usdcAmount;       // USDC received
        uint256 exchangeRate;     // Rate at time of conversion
        uint256 fee;              // CPN fee
        uint256 initiatedAt;
        uint256 completedAt;
        DepositStatus status;
        string cpnReference;      // CPN transaction reference
        string memo;
    }
    
    struct FiatWithdrawal {
        bytes32 withdrawalId;
        address requester;
        bytes32 bankAccountId;
        uint256 usdcAmount;
        uint256 fiatAmount;       // Expected fiat output
        string fiatCurrency;
        uint256 exchangeRate;
        uint256 fee;
        uint256 requestedAt;
        uint256 approvedAt;
        uint256 settledAt;
        WithdrawalStatus status;
        string cpnReference;
        string memo;
    }
    
    struct ReconciliationRecord {
        bytes32 recordId;
        bytes32 depositOrWithdrawalId;
        bool isDeposit;
        uint256 expectedAmount;
        uint256 actualAmount;
        int256 difference;
        uint256 reconciledAt;
        string notes;
    }
    
    struct DailyLimit {
        uint256 maxDeposit;
        uint256 maxWithdrawal;
        uint256 currentDeposit;
        uint256 currentWithdrawal;
        uint256 resetTimestamp;
    }

    // ============ State Variables ============
    
    IERC20 public immutable usdc;
    
    address public owner;
    address public treasuryManager;
    mapping(address => bool) public operators;
    mapping(address => bool) public cpnCallbackAddresses;
    
    // Bank accounts
    mapping(bytes32 => BankAccount) public bankAccounts;
    mapping(address => bytes32[]) public userBankAccounts;
    uint256 public bankAccountCount;
    
    // Deposits
    mapping(bytes32 => FiatDeposit) public deposits;
    mapping(address => bytes32[]) public userDeposits;
    uint256 public depositCount;
    
    // Withdrawals
    mapping(bytes32 => FiatWithdrawal) public withdrawals;
    mapping(address => bytes32[]) public userWithdrawals;
    uint256 public withdrawalCount;
    
    // Reconciliation
    mapping(bytes32 => ReconciliationRecord) public reconciliations;
    uint256 public reconciliationCount;
    
    // Limits
    mapping(address => DailyLimit) public userLimits;
    uint256 public globalDailyDepositLimit;
    uint256 public globalDailyWithdrawalLimit;
    uint256 public currentDailyDeposits;
    uint256 public currentDailyWithdrawals;
    uint256 public limitResetTimestamp;
    
    // Statistics
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;
    uint256 public totalFees;
    
    // Fee configuration
    uint256 public depositFeeBps;     // Basis points
    uint256 public withdrawalFeeBps;
    uint256 public minDeposit;
    uint256 public minWithdrawal;

    // ============ Events ============
    
    event BankAccountAdded(
        bytes32 indexed accountId,
        address indexed owner,
        string currency
    );
    
    event BankAccountVerified(bytes32 indexed accountId);
    
    event DepositInitiated(
        bytes32 indexed depositId,
        address indexed depositor,
        uint256 fiatAmount,
        string currency
    );
    
    event DepositReceived(
        bytes32 indexed depositId,
        uint256 usdcAmount,
        string cpnReference
    );
    
    event DepositCredited(
        bytes32 indexed depositId,
        address indexed depositor,
        uint256 usdcAmount
    );
    
    event DepositFailed(
        bytes32 indexed depositId,
        string reason
    );
    
    event WithdrawalRequested(
        bytes32 indexed withdrawalId,
        address indexed requester,
        uint256 usdcAmount,
        bytes32 bankAccountId
    );
    
    event WithdrawalApproved(
        bytes32 indexed withdrawalId,
        address approver
    );
    
    event WithdrawalProcessing(
        bytes32 indexed withdrawalId,
        string cpnReference
    );
    
    event WithdrawalSettled(
        bytes32 indexed withdrawalId,
        uint256 fiatAmount
    );
    
    event WithdrawalCompleted(
        bytes32 indexed withdrawalId
    );
    
    event WithdrawalFailed(
        bytes32 indexed withdrawalId,
        string reason
    );
    
    event Reconciled(
        bytes32 indexed recordId,
        bytes32 indexed transactionId,
        int256 difference
    );
    
    event LimitsUpdated(
        uint256 depositLimit,
        uint256 withdrawalLimit
    );

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "CPN: not owner");
        _;
    }
    
    modifier onlyOperator() {
        require(
            operators[msg.sender] || msg.sender == owner || msg.sender == treasuryManager,
            "CPN: not operator"
        );
        _;
    }
    
    modifier onlyCPNCallback() {
        require(cpnCallbackAddresses[msg.sender], "CPN: not authorized callback");
        _;
    }

    // ============ Constructor ============
    
    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC");
        
        usdc = IERC20(_usdc);
        owner = msg.sender;
        operators[msg.sender] = true;
        
        // Default configuration
        depositFeeBps = 50;          // 0.5%
        withdrawalFeeBps = 100;      // 1%
        minDeposit = 100 * 1e6;      // 100 USDC
        minWithdrawal = 500 * 1e6;   // 500 USDC
        
        globalDailyDepositLimit = 10_000_000 * 1e6;    // 10M
        globalDailyWithdrawalLimit = 5_000_000 * 1e6;  // 5M
        limitResetTimestamp = block.timestamp + 1 days;
    }

    // ============ Bank Account Functions ============
    
    /**
     * @notice Register a bank account for fiat operations
     * @param bankName Name of the bank
     * @param accountNumber Last 4 digits
     * @param routingNumber Masked routing number
     * @param currency Account currency
     * @param country Country code
     * @return accountId Unique account identifier
     */
    function addBankAccount(
        string calldata bankName,
        string calldata accountNumber,
        string calldata routingNumber,
        string calldata currency,
        string calldata country
    ) external returns (bytes32 accountId) {
        accountId = keccak256(abi.encodePacked(
            bankAccountCount++,
            msg.sender,
            bankName,
            accountNumber,
            block.timestamp
        ));
        
        bankAccounts[accountId] = BankAccount({
            accountId: accountId,
            bankName: bankName,
            accountNumber: accountNumber,
            routingNumber: routingNumber,
            currency: currency,
            country: country,
            isVerified: false,
            isActive: true,
            addedAt: block.timestamp
        });
        
        userBankAccounts[msg.sender].push(accountId);
        
        emit BankAccountAdded(accountId, msg.sender, currency);
        
        return accountId;
    }
    
    /**
     * @notice Verify a bank account (admin only)
     */
    function verifyBankAccount(bytes32 accountId) external onlyOperator {
        require(bankAccounts[accountId].accountId != bytes32(0), "Account not found");
        bankAccounts[accountId].isVerified = true;
        emit BankAccountVerified(accountId);
    }

    // ============ Deposit Functions ============
    
    /**
     * @notice Initiate a fiat deposit (off-chain bank transfer)
     * @param bankAccountId Source bank account
     * @param fiatAmount Amount in cents
     * @param fiatCurrency Currency (EUR/USD)
     * @param memo Reference memo
     * @return depositId Unique deposit identifier
     */
    function initiateDeposit(
        bytes32 bankAccountId,
        uint256 fiatAmount,
        string calldata fiatCurrency,
        string calldata memo
    ) external returns (bytes32 depositId) {
        BankAccount memory account = bankAccounts[bankAccountId];
        require(account.isVerified, "Bank account not verified");
        require(account.isActive, "Bank account inactive");
        
        // Estimate USDC amount (actual amount set by CPN callback)
        uint256 estimatedUsdc = _convertFiatToUsdc(fiatAmount, fiatCurrency);
        require(estimatedUsdc >= minDeposit, "Below minimum deposit");
        
        // Check limits
        _checkAndUpdateLimits(true, estimatedUsdc);
        
        depositId = keccak256(abi.encodePacked(
            depositCount++,
            msg.sender,
            bankAccountId,
            fiatAmount,
            block.timestamp
        ));
        
        deposits[depositId] = FiatDeposit({
            depositId: depositId,
            depositor: msg.sender,
            bankAccountId: bankAccountId,
            fiatAmount: fiatAmount,
            fiatCurrency: fiatCurrency,
            usdcAmount: 0,
            exchangeRate: 0,
            fee: 0,
            initiatedAt: block.timestamp,
            completedAt: 0,
            status: DepositStatus.PENDING,
            cpnReference: "",
            memo: memo
        });
        
        userDeposits[msg.sender].push(depositId);
        
        emit DepositInitiated(depositId, msg.sender, fiatAmount, fiatCurrency);
        
        return depositId;
    }
    
    /**
     * @notice CPN callback when fiat is received
     * @param depositId Deposit to update
     * @param usdcAmount Actual USDC minted
     * @param exchangeRate Rate used
     * @param cpnReference CPN transaction reference
     */
    function cpnDepositCallback(
        bytes32 depositId,
        uint256 usdcAmount,
        uint256 exchangeRate,
        string calldata cpnReference
    ) external onlyCPNCallback {
        FiatDeposit storage deposit = deposits[depositId];
        require(deposit.depositor != address(0), "Deposit not found");
        require(deposit.status == DepositStatus.PENDING, "Invalid status");
        
        uint256 fee = (usdcAmount * depositFeeBps) / 10000;
        
        deposit.usdcAmount = usdcAmount;
        deposit.exchangeRate = exchangeRate;
        deposit.fee = fee;
        deposit.cpnReference = cpnReference;
        deposit.status = DepositStatus.RECEIVED;
        
        emit DepositReceived(depositId, usdcAmount, cpnReference);
        
        // Auto-credit to depositor
        _creditDeposit(depositId);
    }
    
    /**
     * @notice Credit USDC to depositor
     */
    function _creditDeposit(bytes32 depositId) internal {
        FiatDeposit storage deposit = deposits[depositId];
        require(deposit.status == DepositStatus.RECEIVED, "Not received");
        
        uint256 netAmount = deposit.usdcAmount - deposit.fee;
        
        // Transfer USDC to depositor (or treasury)
        bool success = usdc.transfer(deposit.depositor, netAmount);
        require(success, "USDC transfer failed");
        
        deposit.status = DepositStatus.CREDITED;
        deposit.completedAt = block.timestamp;
        
        totalDeposited += deposit.usdcAmount;
        totalFees += deposit.fee;
        
        emit DepositCredited(depositId, deposit.depositor, netAmount);
    }

    // ============ Withdrawal Functions ============
    
    /**
     * @notice Request a fiat withdrawal
     * @param bankAccountId Destination bank account
     * @param usdcAmount Amount of USDC to withdraw
     * @param memo Reference memo
     * @return withdrawalId Unique withdrawal identifier
     */
    function requestWithdrawal(
        bytes32 bankAccountId,
        uint256 usdcAmount,
        string calldata memo
    ) external returns (bytes32 withdrawalId) {
        require(usdcAmount >= minWithdrawal, "Below minimum withdrawal");
        
        BankAccount memory account = bankAccounts[bankAccountId];
        require(account.isVerified, "Bank account not verified");
        require(account.isActive, "Bank account inactive");
        
        // Check limits
        _checkAndUpdateLimits(false, usdcAmount);
        
        // Transfer USDC to gateway
        bool success = usdc.transferFrom(msg.sender, address(this), usdcAmount);
        require(success, "USDC transfer failed");
        
        uint256 fee = (usdcAmount * withdrawalFeeBps) / 10000;
        uint256 netUsdc = usdcAmount - fee;
        uint256 estimatedFiat = _convertUsdcToFiat(netUsdc, account.currency);
        
        withdrawalId = keccak256(abi.encodePacked(
            withdrawalCount++,
            msg.sender,
            bankAccountId,
            usdcAmount,
            block.timestamp
        ));
        
        withdrawals[withdrawalId] = FiatWithdrawal({
            withdrawalId: withdrawalId,
            requester: msg.sender,
            bankAccountId: bankAccountId,
            usdcAmount: usdcAmount,
            fiatAmount: estimatedFiat,
            fiatCurrency: account.currency,
            exchangeRate: 0,
            fee: fee,
            requestedAt: block.timestamp,
            approvedAt: 0,
            settledAt: 0,
            status: WithdrawalStatus.REQUESTED,
            cpnReference: "",
            memo: memo
        });
        
        userWithdrawals[msg.sender].push(withdrawalId);
        
        emit WithdrawalRequested(withdrawalId, msg.sender, usdcAmount, bankAccountId);
        
        return withdrawalId;
    }
    
    /**
     * @notice Approve a withdrawal request (admin)
     */
    function approveWithdrawal(bytes32 withdrawalId) external onlyOperator {
        FiatWithdrawal storage withdrawal = withdrawals[withdrawalId];
        require(withdrawal.requester != address(0), "Withdrawal not found");
        require(withdrawal.status == WithdrawalStatus.REQUESTED, "Invalid status");
        
        withdrawal.status = WithdrawalStatus.APPROVED;
        withdrawal.approvedAt = block.timestamp;
        
        emit WithdrawalApproved(withdrawalId, msg.sender);
        
        // In production, this would trigger CPN API call
    }
    
    /**
     * @notice CPN callback when withdrawal is processing
     */
    function cpnWithdrawalProcessing(
        bytes32 withdrawalId,
        string calldata cpnReference
    ) external onlyCPNCallback {
        FiatWithdrawal storage withdrawal = withdrawals[withdrawalId];
        require(withdrawal.status == WithdrawalStatus.APPROVED, "Not approved");
        
        withdrawal.status = WithdrawalStatus.PROCESSING;
        withdrawal.cpnReference = cpnReference;
        
        emit WithdrawalProcessing(withdrawalId, cpnReference);
    }
    
    /**
     * @notice CPN callback when wire is sent
     */
    function cpnWithdrawalSettled(
        bytes32 withdrawalId,
        uint256 actualFiatAmount,
        uint256 exchangeRate
    ) external onlyCPNCallback {
        FiatWithdrawal storage withdrawal = withdrawals[withdrawalId];
        require(withdrawal.status == WithdrawalStatus.PROCESSING, "Not processing");
        
        withdrawal.fiatAmount = actualFiatAmount;
        withdrawal.exchangeRate = exchangeRate;
        withdrawal.status = WithdrawalStatus.SETTLED;
        withdrawal.settledAt = block.timestamp;
        
        emit WithdrawalSettled(withdrawalId, actualFiatAmount);
    }
    
    /**
     * @notice Mark withdrawal as completed (bank confirmed)
     */
    function confirmWithdrawalComplete(bytes32 withdrawalId) external onlyOperator {
        FiatWithdrawal storage withdrawal = withdrawals[withdrawalId];
        require(withdrawal.status == WithdrawalStatus.SETTLED, "Not settled");
        
        withdrawal.status = WithdrawalStatus.COMPLETED;
        
        totalWithdrawn += withdrawal.usdcAmount;
        totalFees += withdrawal.fee;
        
        emit WithdrawalCompleted(withdrawalId);
    }
    
    /**
     * @notice Fail and refund a withdrawal
     */
    function failWithdrawal(bytes32 withdrawalId, string calldata reason) 
        external 
        onlyOperator 
    {
        FiatWithdrawal storage withdrawal = withdrawals[withdrawalId];
        require(
            withdrawal.status != WithdrawalStatus.COMPLETED &&
            withdrawal.status != WithdrawalStatus.REFUNDED,
            "Cannot fail"
        );
        
        // Refund USDC to requester
        bool success = usdc.transfer(withdrawal.requester, withdrawal.usdcAmount);
        require(success, "Refund failed");
        
        withdrawal.status = WithdrawalStatus.REFUNDED;
        
        emit WithdrawalFailed(withdrawalId, reason);
    }

    // ============ View Functions ============
    
    function getDeposit(bytes32 depositId) external view returns (FiatDeposit memory) {
        return deposits[depositId];
    }
    
    function getWithdrawal(bytes32 withdrawalId) external view returns (FiatWithdrawal memory) {
        return withdrawals[withdrawalId];
    }
    
    function getBankAccount(bytes32 accountId) external view returns (BankAccount memory) {
        return bankAccounts[accountId];
    }
    
    function getUserBankAccounts(address user) external view returns (bytes32[] memory) {
        return userBankAccounts[user];
    }
    
    function getUserDeposits(address user) external view returns (bytes32[] memory) {
        return userDeposits[user];
    }
    
    function getUserWithdrawals(address user) external view returns (bytes32[] memory) {
        return userWithdrawals[user];
    }
    
    function getDailyLimitsStatus() external view returns (
        uint256 depositRemaining,
        uint256 withdrawalRemaining,
        uint256 resetIn
    ) {
        _checkLimitReset();
        depositRemaining = globalDailyDepositLimit > currentDailyDeposits ? 
            globalDailyDepositLimit - currentDailyDeposits : 0;
        withdrawalRemaining = globalDailyWithdrawalLimit > currentDailyWithdrawals ?
            globalDailyWithdrawalLimit - currentDailyWithdrawals : 0;
        resetIn = limitResetTimestamp > block.timestamp ? 
            limitResetTimestamp - block.timestamp : 0;
    }

    // ============ Admin Functions ============
    
    function setOperator(address operator, bool status) external onlyOwner {
        operators[operator] = status;
    }
    
    function setCPNCallback(address callback, bool status) external onlyOwner {
        cpnCallbackAddresses[callback] = status;
    }
    
    function setTreasuryManager(address _treasury) external onlyOwner {
        treasuryManager = _treasury;
    }
    
    function setFees(uint256 depositBps, uint256 withdrawalBps) external onlyOwner {
        require(depositBps <= 500, "Deposit fee too high");
        require(withdrawalBps <= 500, "Withdrawal fee too high");
        depositFeeBps = depositBps;
        withdrawalFeeBps = withdrawalBps;
    }
    
    function setLimits(uint256 depositLimit, uint256 withdrawalLimit) external onlyOwner {
        globalDailyDepositLimit = depositLimit;
        globalDailyWithdrawalLimit = withdrawalLimit;
        emit LimitsUpdated(depositLimit, withdrawalLimit);
    }
    
    function setMinimums(uint256 minDep, uint256 minWith) external onlyOwner {
        minDeposit = minDep;
        minWithdrawal = minWith;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
    
    /**
     * @notice Emergency withdrawal of stuck funds
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }

    // ============ Internal Functions ============
    
    function _convertFiatToUsdc(uint256 fiatCents, string memory currency) 
        internal 
        pure 
        returns (uint256) 
    {
        // Simplified conversion (in production, use oracle)
        if (keccak256(bytes(currency)) == keccak256(bytes("EUR"))) {
            // 1 EUR = ~1.08 USD
            return (fiatCents * 108 * 1e4) / 100; // Convert cents to 6 decimals
        }
        // USD: direct conversion
        return fiatCents * 1e4; // cents to 6 decimals
    }
    
    function _convertUsdcToFiat(uint256 usdcAmount, string memory currency)
        internal
        pure
        returns (uint256)
    {
        if (keccak256(bytes(currency)) == keccak256(bytes("EUR"))) {
            // 1 USD = ~0.93 EUR
            return (usdcAmount * 93) / (100 * 1e4);
        }
        return usdcAmount / 1e4;
    }
    
    function _checkLimitReset() internal view {
        // This is a view function, actual reset happens in _checkAndUpdateLimits
    }
    
    function _checkAndUpdateLimits(bool isDeposit, uint256 amount) internal {
        // Reset daily limits if needed
        if (block.timestamp >= limitResetTimestamp) {
            currentDailyDeposits = 0;
            currentDailyWithdrawals = 0;
            limitResetTimestamp = block.timestamp + 1 days;
        }
        
        if (isDeposit) {
            require(
                currentDailyDeposits + amount <= globalDailyDepositLimit,
                "Daily deposit limit exceeded"
            );
            currentDailyDeposits += amount;
        } else {
            require(
                currentDailyWithdrawals + amount <= globalDailyWithdrawalLimit,
                "Daily withdrawal limit exceeded"
            );
            currentDailyWithdrawals += amount;
        }
    }
}
