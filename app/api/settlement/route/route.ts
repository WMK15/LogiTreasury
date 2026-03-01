/**
 * Settlement Route API
 * POST /api/settlement/route
 * 
 * Get optimal route for cross-chain settlement
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseUnits } from 'viem';
import { arcTestnet } from '@/lib/chains';
import { settlementRouterAbi } from '@/abi/SettlementRouter';

const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_SETTLEMENT_ROUTER_ADDRESS as `0x${string}`;

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

// Chain metadata for response
const CHAIN_INFO: Record<number, { name: string; estimatedTime: string }> = {
  5042002: { name: 'Arc Testnet', estimatedTime: '~30s' },
  1: { name: 'Ethereum', estimatedTime: '~15m' },
  42161: { name: 'Arbitrum', estimatedTime: '~1m' },
  137: { name: 'Polygon', estimatedTime: '~2m' },
  8453: { name: 'Base', estimatedTime: '~1m' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destChain, amount } = body;

    if (!destChain || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: destChain, amount',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const amountWei = parseUnits(amount, 6);

    const [routeQuote, chainConfig, isSupported] = await Promise.all([
      client.readContract({
        address: ROUTER_ADDRESS,
        abi: settlementRouterAbi,
        functionName: 'getRouteQuote',
        args: [BigInt(destChain), amountWei],
      }),
      client.readContract({
        address: ROUTER_ADDRESS,
        abi: settlementRouterAbi,
        functionName: 'getChainConfig',
        args: [BigInt(destChain)],
      }),
      client.readContract({
        address: ROUTER_ADDRESS,
        abi: settlementRouterAbi,
        functionName: 'isChainSupported',
        args: [BigInt(destChain)],
      }),
    ]);

    if (!isSupported) {
      return NextResponse.json(
        {
          success: false,
          error: `Chain ${destChain} is not supported`,
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const chainInfo = CHAIN_INFO[destChain] || { name: `Chain ${destChain}`, estimatedTime: 'Unknown' };

    return NextResponse.json({
      success: true,
      data: {
        route: routeQuote,
        chainConfig,
        chainInfo,
        inputAmount: amount,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Settlement route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate route',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
