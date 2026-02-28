// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";
import "../interfaces/IUSYC.sol";

/**
 * @title FreightEscrow
 * @notice High-value logistics escrow with yield accrual
 * @dev Funds locked in USYC for yield until delivery confirmation
 */
contract FreightEscrow {
    // ============ Enums ============
    
    enum EscrowStatus { 
        CREATED,      // Escrow created, awaiting funding
        FUNDED,       // Funds deposited, awaiting shipment
        IN_TRANSIT,   // Goods in transit
        DELIVERED,    // Delivery confirmed by carrier
        RELEASED,     // Funds released to carrier
        DISPUTED,     // Under dispute
        REFUNDED      // Refunded to shipper
    }

    // ============ Structs ============
    
    struct Shipment {
        // Parties
        address shipper;           // Payer (logistics company)
        address carrier;           // Recipient (freight carrier)
        
        // Financials
        uint256 amount;            // USDC amount
        uint256 usycShares;        // USYC shares (for yield tracking)
        uint256 yieldAccrued;      // Yield earned during escrow
        
        // Shipment details
        string shipmentId;         // External reference
        string origin;             // Origin location
        string destination;        // Destination location
        
        // Timestamps
        uint256 createdAt;
        uint256 fundedAt;
        uint256 deliveredAt;
        uint256 releasedAt;
        
        // Status
        EscrowStatus status;
        
        // Dispute
        uint256 disputeDeadline;   // Time after delivery to raise dispute
        string disputeReason;
    }

    // ============ State ============
    
    IERC20 public immutable usdc;
    IUSYC public immutable usyc;
    
    uint256 public escrowCount;
    mapping(uint256 => Shipment) public shipments;
    mapping(address => uint256[]) public shipperEscrows;
    mapping(address => uint256[]) public carrierEscrows;
    
    /// @notice Default dispute window (48 hours)
    uint256 public constant DEFAULT_DISPUTE_WINDOW = 48 hours;
    
    /// @notice Protocol fee (0.1% = 10 basis points)
    uint256 public constant PROTOCOL_FEE_BPS = 10;
    
    /// @notice Fee recipient
    address public feeRecipient;
    
    /// @notice Yield allocation to shipper (50% = 5000 bps)
    uint256 public constant SHIPPER_YIELD_BPS = 5000;

    // ============ Events ============
    
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed shipper,
        address indexed carrier,
        uint256 amount,
        string shipmentId
    );
    
    event EscrowFunded(
        uint256 indexed escrowId,
        uint256 usycShares
    );
    
    event ShipmentInTransit(
        uint256 indexed escrowId,
        uint256 timestamp
    );
    
    event DeliveryConfirmed(
        uint256 indexed escrowId,
        uint256 timestamp
    );
    
    event FundsReleased(
        uint256 indexed escrowId,
        address indexed carrier,
        uint256 principal,
        uint256 yield
    );
    
    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed raiser,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed escrowId,
        bool releasedToCarrier
    );
    
    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed shipper,
        uint256 amount
    );

    // ============ Modifiers ============
    
    modifier onlyShipper(uint256 escrowId) {
        require(shipments[escrowId].shipper == msg.sender, "Not shipper");
        _;
    }
    
    modifier onlyCarrier(uint256 escrowId) {
        require(shipments[escrowId].carrier == msg.sender, "Not carrier");
        _;
    }
    
    modifier escrowExists(uint256 escrowId) {
        require(shipments[escrowId].shipper != address(0), "Escrow not found");
        _;
    }

    // ============ Constructor ============
    
    constructor(address _usdc, address _usyc, address _feeRecipient) {
        require(_usdc != address(0), "Invalid USDC");
        require(_usyc != address(0), "Invalid USYC");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        usdc = IERC20(_usdc);
        usyc = IUSYC(_usyc);
        feeRecipient = _feeRecipient;
    }

    // ============ Core Functions ============
    
    /**
     * @notice Create a new freight escrow
     * @param carrier Address of the freight carrier
     * @param amount USDC amount for the shipment
     * @param shipmentId External shipment reference
     * @param origin Origin location
     * @param destination Destination location
     */
    function createEscrow(
        address carrier,
        uint256 amount,
        string calldata shipmentId,
        string calldata origin,
        string calldata destination
    ) external returns (uint256 escrowId) {
        require(carrier != address(0), "Invalid carrier");
        require(carrier != msg.sender, "Cannot escrow to self");
        require(amount > 0, "Amount must be > 0");
        
        escrowId = escrowCount++;
        
        shipments[escrowId] = Shipment({
            shipper: msg.sender,
            carrier: carrier,
            amount: amount,
            usycShares: 0,
            yieldAccrued: 0,
            shipmentId: shipmentId,
            origin: origin,
            destination: destination,
            createdAt: block.timestamp,
            fundedAt: 0,
            deliveredAt: 0,
            releasedAt: 0,
            status: EscrowStatus.CREATED,
            disputeDeadline: DEFAULT_DISPUTE_WINDOW,
            disputeReason: ""
        });
        
        shipperEscrows[msg.sender].push(escrowId);
        carrierEscrows[carrier].push(escrowId);
        
        emit EscrowCreated(escrowId, msg.sender, carrier, amount, shipmentId);
    }
    
    /**
     * @notice Fund an escrow - deposits USDC and converts to USYC for yield
     * @param escrowId ID of the escrow to fund
     */
    function fundEscrow(uint256 escrowId) 
        external 
        escrowExists(escrowId) 
        onlyShipper(escrowId) 
    {
        Shipment storage s = shipments[escrowId];
        require(s.status == EscrowStatus.CREATED, "Already funded");
        
        // Transfer USDC from shipper
        bool success = usdc.transferFrom(msg.sender, address(this), s.amount);
        require(success, "USDC transfer failed");
        
        // Approve USYC contract
        usdc.approve(address(usyc), s.amount);
        
        // Deposit into USYC for yield
        uint256 shares = usyc.deposit(s.amount, address(this));
        
        s.usycShares = shares;
        s.fundedAt = block.timestamp;
        s.status = EscrowStatus.FUNDED;
        
        emit EscrowFunded(escrowId, shares);
    }
    
    /**
     * @notice Mark shipment as in transit
     * @param escrowId ID of the escrow
     */
    function markInTransit(uint256 escrowId)
        external
        escrowExists(escrowId)
        onlyCarrier(escrowId)
    {
        Shipment storage s = shipments[escrowId];
        require(s.status == EscrowStatus.FUNDED, "Not funded");
        
        s.status = EscrowStatus.IN_TRANSIT;
        
        emit ShipmentInTransit(escrowId, block.timestamp);
    }
    
    /**
     * @notice Confirm delivery - starts dispute window
     * @param escrowId ID of the escrow
     */
    function confirmDelivery(uint256 escrowId)
        external
        escrowExists(escrowId)
        onlyCarrier(escrowId)
    {
        Shipment storage s = shipments[escrowId];
        require(
            s.status == EscrowStatus.FUNDED || s.status == EscrowStatus.IN_TRANSIT,
            "Invalid status"
        );
        
        s.deliveredAt = block.timestamp;
        s.status = EscrowStatus.DELIVERED;
        
        emit DeliveryConfirmed(escrowId, block.timestamp);
    }
    
    /**
     * @notice Release funds to carrier after dispute window
     * @param escrowId ID of the escrow
     */
    function releaseFunds(uint256 escrowId)
        external
        escrowExists(escrowId)
    {
        Shipment storage s = shipments[escrowId];
        require(s.status == EscrowStatus.DELIVERED, "Not delivered");
        require(
            block.timestamp >= s.deliveredAt + s.disputeDeadline,
            "Dispute window active"
        );
        
        _releaseFunds(escrowId, true);
    }
    
    /**
     * @notice Raise a dispute during dispute window
     * @param escrowId ID of the escrow
     * @param reason Reason for dispute
     */
    function raiseDispute(uint256 escrowId, string calldata reason)
        external
        escrowExists(escrowId)
        onlyShipper(escrowId)
    {
        Shipment storage s = shipments[escrowId];
        require(
            s.status == EscrowStatus.DELIVERED,
            "Can only dispute after delivery"
        );
        require(
            block.timestamp < s.deliveredAt + s.disputeDeadline,
            "Dispute window expired"
        );
        
        s.status = EscrowStatus.DISPUTED;
        s.disputeReason = reason;
        
        emit DisputeRaised(escrowId, msg.sender, reason);
    }
    
    /**
     * @notice Resolve a dispute (simplified - shipper decides for MVP)
     * @param escrowId ID of the escrow
     * @param releaseToCarrier True to release to carrier, false to refund shipper
     */
    function resolveDispute(uint256 escrowId, bool releaseToCarrier)
        external
        escrowExists(escrowId)
        onlyShipper(escrowId)
    {
        Shipment storage s = shipments[escrowId];
        require(s.status == EscrowStatus.DISPUTED, "Not disputed");
        
        if (releaseToCarrier) {
            _releaseFunds(escrowId, true);
        } else {
            _releaseFunds(escrowId, false);
        }
        
        emit DisputeResolved(escrowId, releaseToCarrier);
    }
    
    /**
     * @notice Cancel unfunded escrow
     * @param escrowId ID of the escrow
     */
    function cancelEscrow(uint256 escrowId)
        external
        escrowExists(escrowId)
        onlyShipper(escrowId)
    {
        Shipment storage s = shipments[escrowId];
        require(s.status == EscrowStatus.CREATED, "Already funded");
        
        s.status = EscrowStatus.REFUNDED;
    }

    // ============ View Functions ============
    
    /**
     * @notice Get current yield for an escrow
     */
    function getCurrentYield(uint256 escrowId) public view returns (uint256) {
        Shipment storage s = shipments[escrowId];
        if (s.usycShares == 0) return 0;
        
        uint256 currentValue = usyc.convertToAssets(s.usycShares);
        if (currentValue <= s.amount) return 0;
        
        return currentValue - s.amount;
    }
    
    /**
     * @notice Get all escrows for a shipper
     */
    function getShipperEscrows(address shipper) external view returns (uint256[] memory) {
        return shipperEscrows[shipper];
    }
    
    /**
     * @notice Get all escrows for a carrier
     */
    function getCarrierEscrows(address carrier) external view returns (uint256[] memory) {
        return carrierEscrows[carrier];
    }
    
    /**
     * @notice Get full shipment details
     */
    function getShipment(uint256 escrowId) external view returns (Shipment memory) {
        return shipments[escrowId];
    }

    // ============ Internal Functions ============
    
    function _releaseFunds(uint256 escrowId, bool toCarrier) internal {
        Shipment storage s = shipments[escrowId];
        
        // Calculate current value including yield
        uint256 currentValue = usyc.convertToAssets(s.usycShares);
        uint256 yieldEarned = currentValue > s.amount ? currentValue - s.amount : 0;
        
        // Redeem USYC for USDC
        usyc.redeem(s.usycShares, address(this), address(this));
        
        // Calculate fee
        uint256 fee = (s.amount * PROTOCOL_FEE_BPS) / 10000;
        uint256 principal = s.amount - fee;
        
        // Calculate yield split
        uint256 carrierYield = (yieldEarned * (10000 - SHIPPER_YIELD_BPS)) / 10000;
        uint256 shipperYield = yieldEarned - carrierYield;
        
        if (toCarrier) {
            // Release principal + carrier yield share to carrier
            usdc.transfer(s.carrier, principal + carrierYield);
            
            // Return shipper yield share
            if (shipperYield > 0) {
                usdc.transfer(s.shipper, shipperYield);
            }
            
            s.status = EscrowStatus.RELEASED;
            emit FundsReleased(escrowId, s.carrier, principal, carrierYield);
        } else {
            // Refund full amount + all yield to shipper
            usdc.transfer(s.shipper, principal + yieldEarned);
            s.status = EscrowStatus.REFUNDED;
            emit EscrowRefunded(escrowId, s.shipper, principal + yieldEarned);
        }
        
        // Transfer fee
        if (fee > 0) {
            usdc.transfer(feeRecipient, fee);
        }
        
        s.yieldAccrued = yieldEarned;
        s.releasedAt = block.timestamp;
    }
}
