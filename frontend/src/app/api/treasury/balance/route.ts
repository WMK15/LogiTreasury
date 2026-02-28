/**
 * Treasury Balance API
 * GET /api/treasury/balance
 * 
 * Returns unified treasury balance snapshot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { arcTestnet } from '@/lib/chains';
import { treasuryManagerAbi } from '@/abi/TreasuryManager';

const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS as `0x${string}`;

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export async function GET(request: NextRequest) {
  try {
    const [balanceSnapshot, availableBalance, yieldRate] = await Promise.all([
      client.readContract({
        address: TREASURY_ADDRESS,
        abi: treasuryManagerAbi,
        functionName: 'getBalanceSnapshot',
      }),
      client.readContract({
        address: TREASURY_ADDRESS,
        abi: treasuryManagerAbi,
        functionName: 'getAvailableBalance',
      }),
      client.readContract({
        address: TREASURY_ADDRESS,
        abi: treasuryManagerAbi,
        functionName: 'getCurrentYieldRate',
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        snapshot: balanceSnapshot,
        availableBalance: availableBalance.toString(),
        yieldRate: yieldRate.toString(),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Treasury balance error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch treasury balance',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
