/**
 * LogiTreasury Type Definitions
 */

// ============ Escrow Types ============

export enum EscrowStatus {
  CREATED = 0,
  FUNDED = 1,
  IN_TRANSIT = 2,
  DELIVERED = 3,
  RELEASED = 4,
  DISPUTED = 5,
  REFUNDED = 6,
}

export const EscrowStatusLabel: Record<EscrowStatus, string> = {
  [EscrowStatus.CREATED]: "Created",
  [EscrowStatus.FUNDED]: "Funded",
  [EscrowStatus.IN_TRANSIT]: "In Transit",
  [EscrowStatus.DELIVERED]: "Delivered",
  [EscrowStatus.RELEASED]: "Released",
  [EscrowStatus.DISPUTED]: "Disputed",
  [EscrowStatus.REFUNDED]: "Refunded",
};

export interface Shipment {
  shipper: `0x${string}`;
  carrier: `0x${string}`;
  amount: bigint;
  usycShares: bigint;
  yieldAccrued: bigint;
  shipmentId: string;
  origin: string;
  destination: string;
  createdAt: bigint;
  fundedAt: bigint;
  deliveredAt: bigint;
  releasedAt: bigint;
  status: EscrowStatus;
  disputeDeadline: bigint;
  disputeReason: string;
}

export interface ShipmentWithId extends Shipment {
  id: bigint;
  currentYield?: bigint;
}

// ============ Treasury Types ============

export interface TreasuryStats {
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  totalYieldEarned: bigint;
  activeEscrowCount: bigint;
  activeEscrowValue: bigint;
}

// ============ Settlement Types ============

export interface SettlementRecord {
  initiator: `0x${string}`;
  sourceToken: `0x${string}`;
  targetToken: `0x${string}`;
  sourceAmount: bigint;
  targetAmount: bigint;
  rate: bigint;
  timestamp: bigint;
  reference: string;
}

// ============ Payroll Types ============

export interface BatchRecord {
  initiator: `0x${string}`;
  token: `0x${string}`;
  totalAmount: bigint;
  recipientCount: bigint;
  timestamp: bigint;
  batchReference: string;
  executed: boolean;
}

export interface PaymentRecord {
  batchId: bigint;
  recipient: `0x${string}`;
  amount: bigint;
  reference: string;
  timestamp: bigint;
}

export interface Recipient {
  wallet: `0x${string}`;
  amount: string;
  reference: string;
}

// ============ UI Types ============

export type TabId = "overview" | "escrow" | "treasury" | "settlement" | "payroll";

export interface NavItem {
  id: TabId;
  label: string;
  href: string;
}
