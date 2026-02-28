/**
 * Settlement Service
 * Multi-chain settlement and Arc Bridge Kit integration (read-only)
 */

import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { arcTestnet } from '../config';
import { settlementRouterAbi } from '@/abi/SettlementRouter';
import type { 
  Settlement, 
  BatchSettlement,
  ChainConfig,
  RouteQuote,
  SettlementStatus 
} from '@/types/treasury';

const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_SETTLEMENT_ROUTER_ADDRESS as `0x${string}`;

const getClient = () => createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

// Chain metadata
export const CHAIN_METADATA: Record<number, { name: string; icon: string; color: string }> = {
  5042002: { name: 'Arc Testnet', icon: '/chains/arc.svg', color: '#6366f1' },
  1: { name: 'Ethereum', icon: '/chains/ethereum.svg', color: '#627eea' },
  42161: { name: 'Arbitrum', icon: '/chains/arbitrum.svg', color: '#28a0f0' },
  137: { name: 'Polygon', icon: '/chains/polygon.svg', color: '#8247e5' },
  8453: { name: 'Base', icon: '/chains/base.svg', color: '#0052ff' },
};

export class SettlementService {
  private static instance: SettlementService;
  
  private constructor() {}
  
  static getInstance(): SettlementService {
    if (!SettlementService.instance) {
      SettlementService.instance = new SettlementService();
    }
    return SettlementService.instance;
  }

  /**
   * Get supported chains
   */
  async getSupportedChains(): Promise<bigint[]> {
    const client = getClient();
    
    return await client.readContract({
      address: ROUTER_ADDRESS,
      abi: settlementRouterAbi,
      functionName: 'getSupportedChains',
    }) as bigint[];
  }

  /**
   * Get chain configuration
   */
  async getChainConfig(chainId: number): Promise<ChainConfig> {
    const client = getClient();
    
    return await client.readContract({
      address: ROUTER_ADDRESS,
      abi: settlementRouterAbi,
      functionName: 'getChainConfig',
      args: [BigInt(chainId)],
    }) as ChainConfig;
  }

  /**
   * Get route quote
   */
  async getRouteQuote(destChain: number, amount: string): Promise<RouteQuote> {
    const client = getClient();
    const amountWei = parseUnits(amount, 6);
    
    return await client.readContract({
      address: ROUTER_ADDRESS,
      abi: settlementRouterAbi,
      functionName: 'getRouteQuote',
      args: [BigInt(destChain), amountWei],
    }) as RouteQuote;
  }

  // ============ Utility Functions ============

  /**
   * Get chain display name
   */
  getChainName(chainId: number): string {
    return CHAIN_METADATA[chainId]?.name || `Chain ${chainId}`;
  }

  /**
   * Get chain icon path
   */
  getChainIcon(chainId: number): string {
    return CHAIN_METADATA[chainId]?.icon || '/chains/unknown.svg';
  }

  /**
   * Get chain color
   */
  getChainColor(chainId: number): string {
    return CHAIN_METADATA[chainId]?.color || '#6b7280';
  }

  /**
   * Format estimated time
   */
  formatEstimatedTime(seconds: bigint): string {
    const secs = Number(seconds);
    if (secs < 60) return `~${secs}s`;
    if (secs < 3600) return `~${Math.ceil(secs / 60)}m`;
    return `~${Math.ceil(secs / 3600)}h`;
  }

  /**
   * Format fee for display
   */
  formatFee(feeBps: bigint): string {
    return `${(Number(feeBps) / 100).toFixed(2)}%`;
  }

  /**
   * Get settlement status label
   */
  getStatusLabel(status: SettlementStatus): string {
    const labels: Record<SettlementStatus, string> = {
      [SettlementStatus.PENDING]: 'Pending',
      [SettlementStatus.INITIATED]: 'Initiated',
      [SettlementStatus.BRIDGING]: 'Bridging',
      [SettlementStatus.CONFIRMING]: 'Confirming',
      [SettlementStatus.COMPLETED]: 'Completed',
      [SettlementStatus.FAILED]: 'Failed',
      [SettlementStatus.REFUNDED]: 'Refunded',
    };
    return labels[status];
  }
}

export const settlementService = SettlementService.getInstance();
