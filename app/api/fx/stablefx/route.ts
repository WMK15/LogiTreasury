/**
 * StableFX Live Rates API
 * GET /api/fx/stablefx - Get live rates
 * POST /api/fx/stablefx - Request a quote
 * 
 * Integrates with Circle StableFX API for institutional FX rates
 */

import { NextRequest, NextResponse } from 'next/server';
import { stableFXAPI } from '@/lib/services/stablefx-api.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rates = await stableFXAPI.getRates();
    const isDemoMode = stableFXAPI.isDemoMode();

    return NextResponse.json({
      success: true,
      data: {
        rates,
        isDemoMode,
        provider: isDemoMode ? 'Demo Mode' : 'Circle StableFX',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('StableFX rates error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch StableFX rates',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceCurrency, targetCurrency, sourceAmount, targetAmount } = body;

    if (!sourceCurrency || !targetCurrency) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: sourceCurrency, targetCurrency',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const quote = await stableFXAPI.requestQuote({
      sourceCurrency,
      targetCurrency,
      sourceAmount,
      targetAmount,
    });

    return NextResponse.json({
      success: true,
      data: quote,
      isDemoMode: stableFXAPI.isDemoMode(),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('StableFX quote error:', error);
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
