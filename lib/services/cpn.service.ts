/**
 * CPN Service
 * Circle Payments Network fiat on/off ramp integration (read-only)
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { arcTestnet } from '../config';
import { cpnGatewayAbi } from '@/abi/CPNGateway';
import { 
  DepositStatus,
  WithdrawalStatus 
} from '@/types/treasury';
import type { 
  BankAccount, 
  FiatDeposit, 
  FiatWithdrawal 
} from '@/types/treasury';

const CPN_GATEWAY_ADDRESS = process.env.NEXT_PUBLIC_CPN_GATEWAY_ADDRESS as `0x${string}`;

const getClient = () => createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

// Currency metadata
export const CURRENCY_METADATA: Record<string, { symbol: string; name: string; flag: string }> = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
};

export class CPNService {
  private static instance: CPNService;
  
  private constructor() {}
  
  static getInstance(): CPNService {
    if (!CPNService.instance) {
      CPNService.instance = new CPNService();
    }
    return CPNService.instance;
  }

  /**
   * Get bank account details
   */
  async getBankAccount(accountId: `0x${string}`): Promise<BankAccount> {
    const client = getClient();
    
    return await client.readContract({
      address: CPN_GATEWAY_ADDRESS,
      abi: cpnGatewayAbi,
      functionName: 'getBankAccount',
      args: [accountId],
    }) as BankAccount;
  }

  /**
   * Get daily limits status
   */
  async getDailyLimitsStatus(): Promise<{
    depositRemaining: bigint;
    withdrawalRemaining: bigint;
    resetIn: bigint;
  }> {
    const client = getClient();
    
    const result = await client.readContract({
      address: CPN_GATEWAY_ADDRESS,
      abi: cpnGatewayAbi,
      functionName: 'getDailyLimitsStatus',
    });
    
    // Handle tuple return
    const [depositRemaining, withdrawalRemaining, resetIn] = result as [bigint, bigint, bigint];
    return { depositRemaining, withdrawalRemaining, resetIn };
  }

  // ============ Utility Functions ============

  /**
   * Format fiat amount (cents to display)
   */
  formatFiatAmount(cents: bigint, currency: string): string {
    const amount = Number(cents) / 100;
    const symbol = CURRENCY_METADATA[currency]?.symbol || '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  /**
   * Format USDC amount
   */
  formatUsdcAmount(amount: bigint): string {
    return `$${formatUnits(amount, 6)}`;
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency: string): string {
    return CURRENCY_METADATA[currency]?.symbol || '$';
  }

  /**
   * Get deposit status label
   */
  getDepositStatusLabel(status: DepositStatus): string {
    const labels: Record<DepositStatus, string> = {
      [DepositStatus.PENDING]: 'Pending',
      [DepositStatus.RECEIVED]: 'Received',
      [DepositStatus.CREDITED]: 'Credited',
      [DepositStatus.FAILED]: 'Failed',
      [DepositStatus.REFUNDED]: 'Refunded',
    };
    return labels[status];
  }

  /**
   * Get withdrawal status label
   */
  getWithdrawalStatusLabel(status: WithdrawalStatus): string {
    const labels: Record<WithdrawalStatus, string> = {
      [WithdrawalStatus.REQUESTED]: 'Requested',
      [WithdrawalStatus.APPROVED]: 'Approved',
      [WithdrawalStatus.PROCESSING]: 'Processing',
      [WithdrawalStatus.SETTLED]: 'Settled',
      [WithdrawalStatus.COMPLETED]: 'Completed',
      [WithdrawalStatus.FAILED]: 'Failed',
      [WithdrawalStatus.REFUNDED]: 'Refunded',
    };
    return labels[status];
  }

  /**
   * Format reset time
   */
  formatResetTime(seconds: bigint): string {
    const secs = Number(seconds);
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

export const cpnService = CPNService.getInstance();
