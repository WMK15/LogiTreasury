/**
 * Contract ABIs - ArcLogistics Treasury
 */

// New enterprise contracts
export { treasuryManagerAbi } from './TreasuryManager';
export { yieldVaultAdapterAbi } from './YieldVaultAdapter';
export { fxExecutionEngineAbi } from './FXExecutionEngine';
export { settlementRouterAbi } from './SettlementRouter';
export { cpnGatewayAbi } from './CPNGateway';

export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const FREIGHT_ESCROW_ABI = [
  // Read
  { inputs: [], name: "escrowCount", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "escrowId", type: "uint256" }], name: "getShipment", outputs: [{ components: [{ name: "shipper", type: "address" }, { name: "carrier", type: "address" }, { name: "amount", type: "uint256" }, { name: "usycShares", type: "uint256" }, { name: "yieldAccrued", type: "uint256" }, { name: "shipmentId", type: "string" }, { name: "origin", type: "string" }, { name: "destination", type: "string" }, { name: "createdAt", type: "uint256" }, { name: "fundedAt", type: "uint256" }, { name: "deliveredAt", type: "uint256" }, { name: "releasedAt", type: "uint256" }, { name: "status", type: "uint8" }, { name: "disputeDeadline", type: "uint256" }, { name: "disputeReason", type: "string" }], type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "shipper", type: "address" }], name: "getShipperEscrows", outputs: [{ type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "carrier", type: "address" }], name: "getCarrierEscrows", outputs: [{ type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "escrowId", type: "uint256" }], name: "getCurrentYield", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  // Write
  { inputs: [{ name: "carrier", type: "address" }, { name: "amount", type: "uint256" }, { name: "shipmentId", type: "string" }, { name: "origin", type: "string" }, { name: "destination", type: "string" }], name: "createEscrow", outputs: [{ type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "escrowId", type: "uint256" }], name: "fundEscrow", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "escrowId", type: "uint256" }], name: "markInTransit", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "escrowId", type: "uint256" }], name: "confirmDelivery", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "escrowId", type: "uint256" }], name: "releaseFunds", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "escrowId", type: "uint256" }, { name: "reason", type: "string" }], name: "raiseDispute", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "escrowId", type: "uint256" }, { name: "releaseToCarrier", type: "bool" }], name: "resolveDispute", outputs: [], stateMutability: "nonpayable", type: "function" },
  // Events
  { anonymous: false, inputs: [{ indexed: true, name: "escrowId", type: "uint256" }, { indexed: true, name: "shipper", type: "address" }, { indexed: true, name: "carrier", type: "address" }, { indexed: false, name: "amount", type: "uint256" }, { indexed: false, name: "shipmentId", type: "string" }], name: "EscrowCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "escrowId", type: "uint256" }, { indexed: false, name: "usycShares", type: "uint256" }], name: "EscrowFunded", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "escrowId", type: "uint256" }, { indexed: false, name: "timestamp", type: "uint256" }], name: "DeliveryConfirmed", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "escrowId", type: "uint256" }, { indexed: true, name: "carrier", type: "address" }, { indexed: false, name: "principal", type: "uint256" }, { indexed: false, name: "yield", type: "uint256" }], name: "FundsReleased", type: "event" },
] as const;

export const TREASURY_ABI = [
  // Read
  { inputs: [], name: "owner", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "usdcBalance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "usycShares", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getTotalBalance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getCurrentYield", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getCurrentAPY", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalDeposited", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalWithdrawn", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalYieldEarned", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "yieldAllocationBps", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "operator", type: "address" }], name: "operators", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  // Write
  { inputs: [{ name: "amount", type: "uint256" }], name: "deposit", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "amount", type: "uint256" }, { name: "to", type: "address" }], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }, { name: "memo", type: "string" }], name: "transfer", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "allocateToYield", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "harvestYield", outputs: [], stateMutability: "nonpayable", type: "function" },
  // Events
  { anonymous: false, inputs: [{ indexed: true, name: "from", type: "address" }, { indexed: false, name: "amount", type: "uint256" }], name: "Deposit", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "to", type: "address" }, { indexed: false, name: "amount", type: "uint256" }], name: "Withdraw", type: "event" },
] as const;

export const SETTLEMENT_ABI = [
  // Read
  { inputs: [{ name: "usdcAmount", type: "uint256" }], name: "quoteUsdcToEurc", outputs: [{ name: "eurcAmount", type: "uint256" }, { name: "rate", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "eurcAmount", type: "uint256" }], name: "quoteEurcToUsdc", outputs: [{ name: "usdcAmount", type: "uint256" }, { name: "rate", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getCurrentRate", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getSettlementCount", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "id", type: "uint256" }], name: "getSettlement", outputs: [{ components: [{ name: "initiator", type: "address" }, { name: "sourceToken", type: "address" }, { name: "targetToken", type: "address" }, { name: "sourceAmount", type: "uint256" }, { name: "targetAmount", type: "uint256" }, { name: "rate", type: "uint256" }, { name: "timestamp", type: "uint256" }, { name: "reference", type: "string" }], type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "getUserSettlements", outputs: [{ type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalVolumeUsdc", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalVolumeEurc", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  // Write
  { inputs: [{ name: "amount", type: "uint256" }, { name: "minEurc", type: "uint256" }, { name: "recipient", type: "address" }, { name: "reference", type: "string" }], name: "settleUsdcToEurc", outputs: [{ type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "amount", type: "uint256" }, { name: "minUsdc", type: "uint256" }, { name: "recipient", type: "address" }, { name: "reference", type: "string" }], name: "settleEurcToUsdc", outputs: [{ type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  // Events
  { anonymous: false, inputs: [{ indexed: true, name: "settlementId", type: "uint256" }, { indexed: true, name: "initiator", type: "address" }, { indexed: false, name: "sourceToken", type: "address" }, { indexed: false, name: "targetToken", type: "address" }, { indexed: false, name: "sourceAmount", type: "uint256" }, { indexed: false, name: "targetAmount", type: "uint256" }, { indexed: false, name: "rate", type: "uint256" }], name: "SettlementExecuted", type: "event" },
] as const;

export const BATCH_PAYROLL_ABI = [
  // Read
  { inputs: [], name: "getBatchCount", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getPaymentCount", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "batchId", type: "uint256" }], name: "getBatch", outputs: [{ components: [{ name: "initiator", type: "address" }, { name: "token", type: "address" }, { name: "totalAmount", type: "uint256" }, { name: "recipientCount", type: "uint256" }, { name: "timestamp", type: "uint256" }, { name: "batchReference", type: "string" }, { name: "executed", type: "bool" }], type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "paymentId", type: "uint256" }], name: "getPayment", outputs: [{ components: [{ name: "batchId", type: "uint256" }, { name: "recipient", type: "address" }, { name: "amount", type: "uint256" }, { name: "reference", type: "string" }, { name: "timestamp", type: "uint256" }], type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "recipient", type: "address" }], name: "getRecipientPayments", outputs: [{ type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "initiator", type: "address" }], name: "getInitiatorBatches", outputs: [{ type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalPaidUsdc", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalPaidEurc", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  // Write
  { inputs: [{ name: "recipients", type: "tuple[]", components: [{ name: "wallet", type: "address" }, { name: "amount", type: "uint256" }, { name: "reference", type: "string" }] }, { name: "batchReference", type: "string" }], name: "batchPayUsdc", outputs: [{ type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "recipients", type: "tuple[]", components: [{ name: "wallet", type: "address" }, { name: "amount", type: "uint256" }, { name: "reference", type: "string" }] }, { name: "batchReference", type: "string" }], name: "batchPayEurc", outputs: [{ type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "token", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }, { name: "reference", type: "string" }], name: "pay", outputs: [], stateMutability: "nonpayable", type: "function" },
  // Events
  { anonymous: false, inputs: [{ indexed: true, name: "batchId", type: "uint256" }, { indexed: true, name: "initiator", type: "address" }, { indexed: false, name: "token", type: "address" }, { indexed: false, name: "totalAmount", type: "uint256" }, { indexed: false, name: "recipientCount", type: "uint256" }], name: "BatchCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "paymentId", type: "uint256" }, { indexed: true, name: "batchId", type: "uint256" }, { indexed: true, name: "recipient", type: "address" }, { indexed: false, name: "amount", type: "uint256" }], name: "PaymentSent", type: "event" },
] as const;
