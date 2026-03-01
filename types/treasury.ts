/**
 * ArcLogistics Treasury Types
 * Enterprise-grade type definitions for treasury operations
 */

// ============ Enums ============

export enum EscrowStatus {
  CREATED = 0,
  FUNDED = 1,
  IN_TRANSIT = 2,
  DELIVERED = 3,
  RELEASED = 4,
  DISPUTED = 5,
  REFUNDED = 6,
}

export enum QuoteStatus {
  PENDING = 0,
  ACCEPTED = 1,
  EXECUTED = 2,
  EXPIRED = 3,
  CANCELLED = 4,
}

export enum SwapDirection {
  USDC_TO_EURC = 0,
  EURC_TO_USDC = 1,
}

export enum SettlementStatus {
  PENDING = 0,
  INITIATED = 1,
  BRIDGING = 2,
  CONFIRMING = 3,
  COMPLETED = 4,
  FAILED = 5,
  REFUNDED = 6,
}

export enum DepositStatus {
  PENDING = 0,
  RECEIVED = 1,
  CREDITED = 2,
  FAILED = 3,
  REFUNDED = 4,
}

export enum WithdrawalStatus {
  REQUESTED = 0,
  APPROVED = 1,
  PROCESSING = 2,
  SETTLED = 3,
  COMPLETED = 4,
  FAILED = 5,
  REFUNDED = 6,
}

// ============ Treasury Types ============

export interface BalanceSnapshot {
  liquidUsdc: bigint;
  yieldBearingUsdc: bigint;
  lockedInEscrow: bigint;
  pendingSettlement: bigint;
  totalValue: bigint;
  unrealizedYield: bigint;
  timestamp: bigint;
}

export interface YieldConfig {
  targetAllocationBps: bigint;
  minLiquidBuffer: bigint;
  rebalanceThreshold: bigint;
  maxSingleSwap: bigint;
  autoSweepEnabled: boolean;
}

export interface YieldMetrics {
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  currentShares: bigint;
  currentValue: bigint;
  unrealizedYield: bigint;
  realizedYield: bigint;
  currentAPY: bigint;
}

export interface TreasuryStats {
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  totalYieldEarned: bigint;
  activeEscrowCount: bigint;
  activeEscrowValue: bigint;
}

// ============ Escrow Types ============

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

export interface EscrowSummary {
  escrowId: bigint;
  shipmentId: string;
  carrier: `0x${string}`;
  amount: bigint;
  status: EscrowStatus;
  currentYield: bigint;
  createdAt: bigint;
}

// ============ FX Types ============

export interface FXQuote {
  quoteId: `0x${string}`;
  requester: `0x${string}`;
  direction: SwapDirection;
  inputAmount: bigint;
  outputAmount: bigint;
  rate: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  status: QuoteStatus;
}

export interface FXExposure {
  usdcBalance: bigint;
  eurcBalance: bigint;
  eurcInUsdTerms: bigint;
  netExposure: bigint;
  lastUpdated: bigint;
}

export interface RateSnapshot {
  usdcToEurcRate: bigint;
  eurcToUsdcRate: bigint;
  spread: bigint;
  timestamp: bigint;
}

export interface SwapExecution {
  quoteId: `0x${string}`;
  executor: `0x${string}`;
  direction: SwapDirection;
  inputAmount: bigint;
  outputAmount: bigint;
  effectiveRate: bigint;
  executedAt: bigint;
  settlementId: `0x${string}`;
}

// ============ Settlement Types ============

export interface ChainConfig {
  chainId: bigint;
  name: string;
  bridgeEndpoint: `0x${string}`;
  minTransfer: bigint;
  maxTransfer: bigint;
  estimatedTime: bigint;
  baseFee: bigint;
  isActive: boolean;
}

export interface Settlement {
  settlementId: `0x${string}`;
  sender: `0x${string}`;
  recipient: `0x${string}`;
  sourceChain: bigint;
  destChain: bigint;
  token: `0x${string}`;
  amount: bigint;
  fee: bigint;
  initiatedAt: bigint;
  completedAt: bigint;
  status: SettlementStatus;
  routeType: number;
  memo: string;
  bridgeTxId: `0x${string}`;
}

export interface BatchSettlement {
  batchId: `0x${string}`;
  sender: `0x${string}`;
  destChain: bigint;
  token: `0x${string}`;
  recipients: `0x${string}`[];
  amounts: bigint[];
  totalAmount: bigint;
  totalFee: bigint;
  initiatedAt: bigint;
  completedAt: bigint;
  status: SettlementStatus;
}

export interface RouteQuote {
  destChain: bigint;
  routeType: number;
  estimatedFee: bigint;
  estimatedTime: bigint;
  inputAmount: bigint;
  outputAmount: bigint;
  validUntil: bigint;
}

// ============ CPN Types ============

export interface BankAccount {
  accountId: `0x${string}`;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  currency: string;
  country: string;
  isVerified: boolean;
  isActive: boolean;
  addedAt: bigint;
}

export interface FiatDeposit {
  depositId: `0x${string}`;
  depositor: `0x${string}`;
  bankAccountId: `0x${string}`;
  fiatAmount: bigint;
  fiatCurrency: string;
  usdcAmount: bigint;
  exchangeRate: bigint;
  fee: bigint;
  initiatedAt: bigint;
  completedAt: bigint;
  status: DepositStatus;
  cpnReference: string;
  memo: string;
}

export interface FiatWithdrawal {
  withdrawalId: `0x${string}`;
  requester: `0x${string}`;
  bankAccountId: `0x${string}`;
  usdcAmount: bigint;
  fiatAmount: bigint;
  fiatCurrency: string;
  exchangeRate: bigint;
  fee: bigint;
  requestedAt: bigint;
  approvedAt: bigint;
  settledAt: bigint;
  status: WithdrawalStatus;
  cpnReference: string;
  memo: string;
}

// ============ Dashboard Types ============

export interface DashboardStats {
  totalBalance: bigint;
  liquidBalance: bigint;
  yieldBalance: bigint;
  escrowBalance: bigint;
  pendingSettlements: bigint;
  totalYieldEarned: bigint;
  currentAPY: bigint;
  activeEscrows: number;
  pendingPayouts: number;
}

export interface ChainBalance {
  chainId: number;
  chainName: string;
  balance: bigint;
  lastUpdated: bigint;
}

export interface ActivityItem {
  id: string;
  type: 'deposit' | 'withdrawal' | 'escrow' | 'settlement' | 'swap' | 'yield';
  amount: bigint;
  token: 'USDC' | 'EURC' | 'USYC';
  status: string;
  timestamp: bigint;
  description: string;
  txHash?: `0x${string}`;
}

// ============ Form Types ============

export interface CreateEscrowForm {
  carrier: `0x${string}`;
  amount: string;
  shipmentId: string;
  origin: string;
  destination: string;
}

export interface SwapForm {
  direction: SwapDirection;
  amount: string;
  minOutput: string;
}

export interface SettlementForm {
  recipient: `0x${string}`;
  destChain: number;
  amount: string;
  memo: string;
}

export interface BatchPayoutRecipient {
  address: `0x${string}`;
  amount: string;
  memo?: string;
}

export interface BatchPayoutForm {
  destChain: number;
  token: 'USDC' | 'EURC';
  recipients: BatchPayoutRecipient[];
}

// ============ API Response Types ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
