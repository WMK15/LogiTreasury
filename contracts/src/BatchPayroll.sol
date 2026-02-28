// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";

/**
 * @title BatchPayroll
 * @notice Multi-recipient batch payments for logistics operations
 * @dev Supports USDC and EURC payments with status tracking
 */
contract BatchPayroll {
    // ============ Structs ============
    
    struct Recipient {
        address wallet;
        uint256 amount;
        string memo;
    }
    
    struct BatchRecord {
        address initiator;
        address token;
        uint256 totalAmount;
        uint256 recipientCount;
        uint256 timestamp;
        string batchReference;
        bool executed;
    }
    
    struct PaymentRecord {
        uint256 batchId;
        address recipient;
        uint256 amount;
        string memo;
        uint256 timestamp;
    }

    // ============ State ============
    
    IERC20 public immutable usdc;
    IERC20 public immutable eurc;
    
    address public owner;
    mapping(address => bool) public operators;
    
    /// @notice Batch records
    BatchRecord[] public batches;
    
    /// @notice Payment records
    PaymentRecord[] public payments;
    
    /// @notice User's payment history (as recipient)
    mapping(address => uint256[]) public recipientPayments;
    
    /// @notice User's batch history (as initiator)
    mapping(address => uint256[]) public initiatorBatches;
    
    /// @notice Total paid out
    uint256 public totalPaidUsdc;
    uint256 public totalPaidEurc;

    // ============ Events ============
    
    event BatchCreated(
        uint256 indexed batchId,
        address indexed initiator,
        address token,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    event PaymentSent(
        uint256 indexed paymentId,
        uint256 indexed batchId,
        address indexed recipient,
        uint256 amount
    );
    
    event SinglePayment(
        address indexed from,
        address indexed to,
        address token,
        uint256 amount,
        string memo
    );

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
    
    constructor(address _usdc, address _eurc) {
        require(_usdc != address(0), "Invalid USDC");
        require(_eurc != address(0), "Invalid EURC");
        
        usdc = IERC20(_usdc);
        eurc = IERC20(_eurc);
        owner = msg.sender;
        operators[msg.sender] = true;
    }

    // ============ Core Functions ============
    
    /**
     * @notice Execute batch payment in USDC
     * @param recipients Array of recipients
     * @param batchReference Batch reference string
     */
    function batchPayUsdc(
        Recipient[] calldata recipients,
        string calldata batchReference
    ) external onlyOperator returns (uint256 batchId) {
        return _executeBatch(usdc, recipients, batchReference);
    }
    
    /**
     * @notice Execute batch payment in EURC
     * @param recipients Array of recipients
     * @param batchReference Batch reference string
     */
    function batchPayEurc(
        Recipient[] calldata recipients,
        string calldata batchReference
    ) external onlyOperator returns (uint256 batchId) {
        return _executeBatch(eurc, recipients, batchReference);
    }
    
    /**
     * @notice Single payment
     * @param token Token address (USDC or EURC)
     * @param to Recipient
     * @param amount Amount
     * @param paymentMemo Payment memo
     */
    function pay(
        address token,
        address to,
        uint256 amount,
        string calldata paymentMemo
    ) external onlyOperator {
        require(token == address(usdc) || token == address(eurc), "Invalid token");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        
        IERC20 t = IERC20(token);
        bool success = t.transferFrom(msg.sender, to, amount);
        require(success, "Transfer failed");
        
        if (token == address(usdc)) {
            totalPaidUsdc += amount;
        } else {
            totalPaidEurc += amount;
        }
        
        // Record payment
        uint256 paymentId = payments.length;
        payments.push(PaymentRecord({
            batchId: type(uint256).max, // Not part of batch
            recipient: to,
            amount: amount,
            memo: paymentMemo,
            timestamp: block.timestamp
        }));
        
        recipientPayments[to].push(paymentId);
        
        emit SinglePayment(msg.sender, to, token, amount, paymentMemo);
    }

    // ============ View Functions ============
    
    /**
     * @notice Get batch count
     */
    function getBatchCount() external view returns (uint256) {
        return batches.length;
    }
    
    /**
     * @notice Get payment count
     */
    function getPaymentCount() external view returns (uint256) {
        return payments.length;
    }
    
    /**
     * @notice Get batch details
     */
    function getBatch(uint256 batchId) external view returns (BatchRecord memory) {
        require(batchId < batches.length, "Invalid ID");
        return batches[batchId];
    }
    
    /**
     * @notice Get payment details
     */
    function getPayment(uint256 paymentId) external view returns (PaymentRecord memory) {
        require(paymentId < payments.length, "Invalid ID");
        return payments[paymentId];
    }
    
    /**
     * @notice Get recipient's payment history
     */
    function getRecipientPayments(address recipient) external view returns (uint256[] memory) {
        return recipientPayments[recipient];
    }
    
    /**
     * @notice Get initiator's batch history
     */
    function getInitiatorBatches(address initiator) external view returns (uint256[] memory) {
        return initiatorBatches[initiator];
    }

    // ============ Admin Functions ============
    
    function setOperator(address operator, bool status) external onlyOwner {
        operators[operator] = status;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    // ============ Internal Functions ============
    
    function _executeBatch(
        IERC20 token,
        Recipient[] calldata recipients,
        string calldata batchReference
    ) internal returns (uint256 batchId) {
        require(recipients.length > 0, "Empty batch");
        require(recipients.length <= 100, "Batch too large");
        
        // Calculate total
        uint256 total = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i].wallet != address(0), "Invalid recipient");
            require(recipients[i].amount > 0, "Invalid amount");
            total += recipients[i].amount;
        }
        
        // Transfer total from sender
        bool success = token.transferFrom(msg.sender, address(this), total);
        require(success, "Transfer failed");
        
        // Create batch record
        batchId = batches.length;
        batches.push(BatchRecord({
            initiator: msg.sender,
            token: address(token),
            totalAmount: total,
            recipientCount: recipients.length,
            timestamp: block.timestamp,
            batchReference: batchReference,
            executed: true
        }));
        
        initiatorBatches[msg.sender].push(batchId);
        
        emit BatchCreated(batchId, msg.sender, address(token), total, recipients.length);
        
        // Execute payments
        for (uint256 i = 0; i < recipients.length; i++) {
            success = token.transfer(recipients[i].wallet, recipients[i].amount);
            require(success, "Payment failed");
            
            uint256 paymentId = payments.length;
            payments.push(PaymentRecord({
                batchId: batchId,
                recipient: recipients[i].wallet,
                amount: recipients[i].amount,
                memo: recipients[i].memo,
                timestamp: block.timestamp
            }));
            
            recipientPayments[recipients[i].wallet].push(paymentId);
            
            emit PaymentSent(paymentId, batchId, recipients[i].wallet, recipients[i].amount);
        }
        
        // Update totals
        if (address(token) == address(usdc)) {
            totalPaidUsdc += total;
        } else {
            totalPaidEurc += total;
        }
    }
}
