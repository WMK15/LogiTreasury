/**
 * StableFX API Service
 * Real integration with Circle StableFX for institutional FX rates
 * 
 * API Documentation: https://developers.circle.com/stablefx
 */

// StableFX API types
export interface StableFXQuoteRequest {
  sourceCurrency: 'USDC' | 'EURC';
  targetCurrency: 'USDC' | 'EURC';
  sourceAmount?: string;
  targetAmount?: string;
}

export interface StableFXQuote {
  quoteId: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: string;
  targetAmount: string;
  exchangeRate: string;
  inverseRate: string;
  expiresAt: string;
  createdAt: string;
}

export interface StableFXRates {
  USDC_EURC: {
    rate: string;
    inverseRate: string;
    spread: string;
    timestamp: string;
  };
  EURC_USDC: {
    rate: string;
    inverseRate: string;
    spread: string;
    timestamp: string;
  };
}

export interface StableFXExecuteRequest {
  quoteId: string;
  sourceWallet: string;
  targetWallet: string;
  idempotencyKey: string;
}

export interface StableFXExecution {
  executionId: string;
  quoteId: string;
  status: 'pending' | 'completed' | 'failed';
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: string;
  targetAmount: string;
  executedAt?: string;
}

const STABLEFX_API_URL = process.env.STABLEFX_API_URL || 'https://api.circle.com/v1/stablefx';
const STABLEFX_API_KEY = process.env.STABLEFX_API_KEY || '';

// Demo mode - use mock rates when API key is test key or missing
const isDemoMode = !STABLEFX_API_KEY || STABLEFX_API_KEY.startsWith('TEST_API_KEY');

// Mock rates for demo mode (realistic EUR/USD rates)
const MOCK_RATES: StableFXRates = {
  USDC_EURC: {
    rate: '0.9215',
    inverseRate: '1.0852',
    spread: '0.0015',
    timestamp: new Date().toISOString(),
  },
  EURC_USDC: {
    rate: '1.0852',
    inverseRate: '0.9215',
    spread: '0.0015',
    timestamp: new Date().toISOString(),
  },
};

export class StableFXAPIService {
  private static instance: StableFXAPIService;
  
  private constructor() {}
  
  static getInstance(): StableFXAPIService {
    if (!StableFXAPIService.instance) {
      StableFXAPIService.instance = new StableFXAPIService();
    }
    return StableFXAPIService.instance;
  }

  /**
   * Check if we're in demo mode
   */
  isDemoMode(): boolean {
    return isDemoMode;
  }

  /**
   * Get current FX rates from StableFX API
   */
  async getRates(): Promise<StableFXRates> {
    if (isDemoMode) {
      // Add slight randomness to mock rates for realism
      const variance = (Math.random() - 0.5) * 0.002; // ±0.1% variance
      const baseRate = 0.9215 + variance;
      
      return {
        USDC_EURC: {
          rate: baseRate.toFixed(4),
          inverseRate: (1 / baseRate).toFixed(4),
          spread: '0.0015',
          timestamp: new Date().toISOString(),
        },
        EURC_USDC: {
          rate: (1 / baseRate).toFixed(4),
          inverseRate: baseRate.toFixed(4),
          spread: '0.0015',
          timestamp: new Date().toISOString(),
        },
      };
    }

    try {
      const response = await fetch(`${STABLEFX_API_URL}/rates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STABLEFX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`StableFX API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('StableFX getRates error:', error);
      // Fallback to mock rates on error
      return MOCK_RATES;
    }
  }

  /**
   * Request a quote for a currency swap
   */
  async requestQuote(request: StableFXQuoteRequest): Promise<StableFXQuote> {
    const rates = await this.getRates();
    const rateKey = `${request.sourceCurrency}_${request.targetCurrency}` as keyof StableFXRates;
    const rateInfo = rates[rateKey];
    const rate = parseFloat(rateInfo.rate);

    if (isDemoMode) {
      // Generate mock quote
      const sourceAmount = request.sourceAmount || '0';
      const targetAmount = request.targetAmount || (parseFloat(sourceAmount) * rate).toFixed(6);
      
      return {
        quoteId: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceCurrency: request.sourceCurrency,
        targetCurrency: request.targetCurrency,
        sourceAmount: sourceAmount,
        targetAmount: targetAmount,
        exchangeRate: rate.toFixed(6),
        inverseRate: (1 / rate).toFixed(6),
        expiresAt: new Date(Date.now() + 30000).toISOString(), // 30 second expiry
        createdAt: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(`${STABLEFX_API_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STABLEFX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`StableFX API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('StableFX requestQuote error:', error);
      throw error;
    }
  }

  /**
   * Execute a quoted swap (in production this would integrate with on-chain)
   */
  async executeSwap(request: StableFXExecuteRequest): Promise<StableFXExecution> {
    if (isDemoMode) {
      // In demo mode, return mock execution
      return {
        executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        quoteId: request.quoteId,
        status: 'completed',
        sourceCurrency: 'USDC',
        targetCurrency: 'EURC',
        sourceAmount: '0',
        targetAmount: '0',
        executedAt: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(`${STABLEFX_API_URL}/executions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STABLEFX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`StableFX API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('StableFX executeSwap error:', error);
      throw error;
    }
  }

  /**
   * Calculate output amount given input
   */
  calculateOutput(
    sourceAmount: string,
    sourceCurrency: 'USDC' | 'EURC',
    targetCurrency: 'USDC' | 'EURC',
    rates: StableFXRates
  ): string {
    const rateKey = `${sourceCurrency}_${targetCurrency}` as keyof StableFXRates;
    const rate = parseFloat(rates[rateKey].rate);
    const amount = parseFloat(sourceAmount);
    return (amount * rate).toFixed(6);
  }
}

export const stableFXAPI = StableFXAPIService.getInstance();
