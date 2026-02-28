/**
 * Supported Chains API
 * GET /api/settlement/chains
 * 
 * Returns list of supported chains for cross-chain settlement
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { arcTestnet } from '@/lib/chains';
import { settlementRouterAbi } from '@/abi/SettlementRouter';

const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_SETTLEMENT_ROUTER_ADDRESS as `0x${string}`;

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

// Chain metadata
const CHAIN_METADATA: Record<number, { name: string; icon: string; color: string }> = {
  5042002: { name: 'Arc Testnet', icon: '/chains/arc.svg', color: '#6366f1' },
  1: { name: 'Ethereum', icon: '/chains/ethereum.svg', color: '#627eea' },
  42161: { name: 'Arbitrum', icon: '/chains/arbitrum.svg', color: '#28a0f0' },
  137: { name: 'Polygon', icon: '/chains/polygon.svg', color: '#8247e5' },
  8453: { name: 'Base', icon: '/chains/base.svg', color: '#0052ff' },
};

export async function GET(request: NextRequest) {
  try {
    const supportedChains = await client.readContract({
      address: ROUTER_ADDRESS,
      abi: settlementRouterAbi,
      functionName: 'getSupportedChains',
    }) as bigint[];

    // Fetch config for each chain
    const chainConfigs = await Promise.all(
      supportedChains.map(async (chainId) => {
        const config = await client.readContract({
          address: ROUTER_ADDRESS,
          abi: settlementRouterAbi,
          functionName: 'getChainConfig',
          args: [chainId],
        });

        const id = Number(chainId);
        const metadata = CHAIN_METADATA[id] || { name: `Chain ${id}`, icon: '', color: '#6b7280' };

        return {
          chainId: id,
          ...metadata,
          config,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        chains: chainConfigs,
        count: chainConfigs.length,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Chains fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch supported chains',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
