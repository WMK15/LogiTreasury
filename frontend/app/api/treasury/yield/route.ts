/**
 * Treasury Yield API
 * GET /api/treasury/yield
 * 
 * Returns yield metrics and USYC information
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { arcTestnet } from '@/lib/chains';
import { yieldVaultAdapterAbi } from '@/abi/YieldVaultAdapter';
import { treasuryManagerAbi } from '@/abi/TreasuryManager';

const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS as `0x${string}`;
const YIELD_ADAPTER_ADDRESS = process.env.NEXT_PUBLIC_YIELD_ADAPTER_ADDRESS as `0x${string}`;

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export async function GET(request: NextRequest) {
  try {
    const [yieldMetrics, yieldConfig, needsRebalancing] = await Promise.all([
      client.readContract({
        address: YIELD_ADAPTER_ADDRESS,
        abi: yieldVaultAdapterAbi,
        functionName: 'getYieldMetrics',
      }),
      client.readContract({
        address: TREASURY_ADDRESS,
        abi: treasuryManagerAbi,
        functionName: 'getYieldConfig',
      }),
      client.readContract({
        address: TREASURY_ADDRESS,
        abi: treasuryManagerAbi,
        functionName: 'needsRebalancing',
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        metrics: yieldMetrics,
        config: yieldConfig,
        needsRebalancing,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Yield metrics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch yield metrics',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
