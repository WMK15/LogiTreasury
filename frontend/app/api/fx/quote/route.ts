/**
 * FX Quote API
 * POST /api/fx/quote
 * 
 * Request a swap quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseUnits } from 'viem';
import { arcTestnet } from '@/lib/chains';
import { fxExecutionEngineAbi } from '@/abi/FXExecutionEngine';
import { SwapDirection } from '@/types/treasury';

const FX_ENGINE_ADDRESS = process.env.NEXT_PUBLIC_FX_ENGINE_ADDRESS as `0x${string}`;

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { direction, amount } = body;

    if (direction === undefined || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: direction, amount',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const amountWei = parseUnits(amount, 6);

    const previewOutput = await client.readContract({
      address: FX_ENGINE_ADDRESS,
      abi: fxExecutionEngineAbi,
      functionName: 'previewSwap',
      args: [direction as SwapDirection, amountWei],
    });

    const rates = await client.readContract({
      address: FX_ENGINE_ADDRESS,
      abi: fxExecutionEngineAbi,
      functionName: 'getCurrentRates',
    });

    // Calculate min output with 0.5% slippage
    const minOutput = (previewOutput as bigint) * 9950n / 10000n;

    return NextResponse.json({
      success: true,
      data: {
        inputAmount: amount,
        outputAmount: previewOutput.toString(),
        minOutput: minOutput.toString(),
        direction,
        rates,
        validFor: 30, // seconds
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('FX quote error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate quote',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
