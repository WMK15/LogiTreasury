/**
 * FX Rates API
 * GET /api/fx/rates
 * 
 * Returns current FX rates from StableFX
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { arcTestnet } from '@/lib/chains';
import { fxExecutionEngineAbi } from '@/abi/FXExecutionEngine';

const FX_ENGINE_ADDRESS = process.env.NEXT_PUBLIC_FX_ENGINE_ADDRESS as `0x${string}`;

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export async function GET(request: NextRequest) {
  try {
    const [currentRates, exposure] = await Promise.all([
      client.readContract({
        address: FX_ENGINE_ADDRESS,
        abi: fxExecutionEngineAbi,
        functionName: 'getCurrentRates',
      }),
      client.readContract({
        address: FX_ENGINE_ADDRESS,
        abi: fxExecutionEngineAbi,
        functionName: 'getExposure',
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        rates: currentRates,
        exposure,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('FX rates error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch FX rates',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
