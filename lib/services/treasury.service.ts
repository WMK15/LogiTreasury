/**
 * Treasury Service
 * Core treasury operations and USYC yield management
 */

import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { arcTestnet } from '../config';
import { treasuryManagerAbi } from '@/abi/TreasuryManager';
import { yieldVaultAdapterAbi } from '@/abi/YieldVaultAdapter';
import type { 
  BalanceSnapshot, 
  YieldConfig, 
  YieldMetrics,
  DashboardStats 
} from '@/types/treasury';

const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS as `0x${string}`;
const YIELD_ADAPTER_ADDRESS = process.env.NEXT_PUBLIC_YIELD_ADAPTER_ADDRESS as `0x${string}`;

const getClient = () => createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export class TreasuryService {
  private static instance: TreasuryService;
  
  private constructor() {}
  
  static getInstance(): TreasuryService {
    if (!TreasuryService.instance) {
      TreasuryService.instance = new TreasuryService();
    }
    return TreasuryService.instance;
  }

  // ============ Read Operations ============

  /**
   * Get complete balance snapshot
   */
  async getBalanceSnapshot(): Promise<BalanceSnapshot> {
    const client = getClient();
    
    const snapshot = await client.readContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'getBalanceSnapshot',
    });
    
    return snapshot as BalanceSnapshot;
  }

  /**
   * Get available balance (liquid + redeemable)
   */
  async getAvailableBalance(): Promise<bigint> {
    const client = getClient();
    
    return await client.readContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'getAvailableBalance',
    }) as bigint;
  }

  /**
   * Get current yield rate from USYC
   */
  async getCurrentYieldRate(): Promise<bigint> {
    const client = getClient();
    
    return await client.readContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'getCurrentYieldRate',
    }) as bigint;
  }

  /**
   * Get yield configuration
   */
  async getYieldConfig(): Promise<YieldConfig> {
    const client = getClient();
    
    return await client.readContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'getYieldConfig',
    }) as YieldConfig;
  }

  /**
   * Get yield metrics from adapter
   */
  async getYieldMetrics(): Promise<YieldMetrics> {
    const client = getClient();
    
    return await client.readContract({
      address: YIELD_ADAPTER_ADDRESS,
      abi: yieldVaultAdapterAbi,
      functionName: 'getYieldMetrics',
    }) as YieldMetrics;
  }

  /**
   * Check if treasury needs rebalancing
   */
  async needsRebalancing(): Promise<boolean> {
    const client = getClient();
    
    return await client.readContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'needsRebalancing',
    }) as boolean;
  }

  /**
   * Get unified balance across chains
   */
  async getUnifiedBalance(): Promise<bigint> {
    const client = getClient();
    
    return await client.readContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'getUnifiedBalance',
    }) as bigint;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const [snapshot, yieldMetrics, yieldRate] = await Promise.all([
      this.getBalanceSnapshot(),
      this.getYieldMetrics(),
      this.getCurrentYieldRate(),
    ]);
    
    return {
      totalBalance: snapshot.totalValue,
      liquidBalance: snapshot.liquidUsdc,
      yieldBalance: snapshot.yieldBearingUsdc,
      escrowBalance: snapshot.lockedInEscrow,
      pendingSettlements: snapshot.pendingSettlement,
      totalYieldEarned: yieldMetrics.realizedYield + yieldMetrics.unrealizedYield,
      currentAPY: yieldRate,
      activeEscrows: 0, // Would need escrow service
      pendingPayouts: 0, // Would need settlement service
    };
  }

  // ============ Utility Functions ============

  /**
   * Format balance for display
   */
  formatBalance(balance: bigint, decimals: number = 6): string {
    return formatUnits(balance, decimals);
  }

  /**
   * Calculate APY display string
   */
  formatAPY(rate: bigint): string {
    // Rate is in basis points (100 = 1%)
    const percentage = Number(rate) / 100;
    return `${percentage.toFixed(2)}%`;
  }

  /**
   * Calculate yield allocation percentage
   */
  calculateYieldAllocation(snapshot: BalanceSnapshot): number {
    const total = snapshot.liquidUsdc + snapshot.yieldBearingUsdc;
    if (total === 0n) return 0;
    return Number((snapshot.yieldBearingUsdc * 10000n) / total) / 100;
  }
}

export const treasuryService = TreasuryService.getInstance();
