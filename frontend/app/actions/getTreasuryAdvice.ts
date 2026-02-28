'use server';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AssetBalance, Company } from '@/lib/supabase';

// ============ Types ============

export interface TreasuryRecommendation {
  shouldSweep: boolean;
  idleUsdcAmount: number;
  bankBalance: number;
  totalOnchainUsdc: number;
  sweepAmount: number;
  projectedMonthlyYield: number;
  projectedAnnualYield: number;
  currentAPY: number;
  reasoning: string;
  recommendations: RecommendationItem[];
  timestamp: string;
}

export interface RecommendationItem {
  action: 'SWEEP_TO_USYC' | 'FX_CONVERSION' | 'HOLD';
  amount: number;
  description: string;
  expectedReturn: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ============ Constants ============

const IDLE_THRESHOLD_USD = 20_000;
const SWEEP_PERCENTAGE = 0.40; // 40% of idle funds
const CURRENT_TBILL_APY = 0.048; // 4.8% annual T-Bill yield
const EUR_USD_RATE = 0.92;

// ============ Mock Data (Fallback) ============

function getMockRecommendation(): TreasuryRecommendation {
  const bankBalance = 245_000;
  const onchainUsdc = 128_500;
  const idleAmount = onchainUsdc;
  const sweepAmount = idleAmount * SWEEP_PERCENTAGE;
  const monthlyYield = (sweepAmount * CURRENT_TBILL_APY) / 12;
  const annualYield = sweepAmount * CURRENT_TBILL_APY;

  return {
    shouldSweep: true,
    idleUsdcAmount: idleAmount,
    bankBalance,
    totalOnchainUsdc: onchainUsdc,
    sweepAmount,
    projectedMonthlyYield: Number(monthlyYield.toFixed(2)),
    projectedAnnualYield: Number(annualYield.toFixed(2)),
    currentAPY: CURRENT_TBILL_APY * 100,
    reasoning: `Your treasury has $${onchainUsdc.toLocaleString()} USDC sitting idle on-chain. This exceeds the $${IDLE_THRESHOLD_USD.toLocaleString()} threshold for automated yield optimization. By sweeping ${(SWEEP_PERCENTAGE * 100).toFixed(0)}% ($${sweepAmount.toLocaleString()}) into USYC (Hashnote T-Bill token), you would earn approximately $${monthlyYield.toFixed(2)}/month at the current ${(CURRENT_TBILL_APY * 100).toFixed(1)}% APY. USYC is backed by short-duration US Treasury Bills, providing institutional-grade security with daily liquidity.`,
    recommendations: [
      {
        action: 'SWEEP_TO_USYC',
        amount: sweepAmount,
        description: `Sweep $${sweepAmount.toLocaleString()} into USYC T-Bill vault`,
        expectedReturn: `~$${monthlyYield.toFixed(2)}/mo at ${(CURRENT_TBILL_APY * 100).toFixed(1)}% APY`,
        urgency: 'HIGH',
      },
      {
        action: 'FX_CONVERSION',
        amount: 15_000,
        description: 'Convert $15,000 USDC → EURC for upcoming EU settlements',
        expectedReturn: `~€${(15_000 * EUR_USD_RATE).toLocaleString()} EURC at ${EUR_USD_RATE} rate`,
        urgency: 'MEDIUM',
      },
      {
        action: 'HOLD',
        amount: idleAmount - sweepAmount - 15_000,
        description: 'Maintain liquid USDC buffer for operational needs',
        expectedReturn: 'Liquidity buffer — no yield',
        urgency: 'LOW',
      },
    ],
    timestamp: new Date().toISOString(),
  };
}

// ============ Server Action ============

/**
 * AI Treasury Recommendation Engine
 * 
 * Analyzes idle cash positions and recommends optimal allocation:
 * - If idle USDC > $20k → recommend sweeping 40% into USYC
 * - Cites current T-Bill yield (~4.8% APY)
 * - Provides multi-action recommendation set
 */
export async function getTreasuryAdvice(
  companyId?: string,
): Promise<TreasuryRecommendation> {
  // Fallback to mock data if Supabase not configured
  if (!isSupabaseConfigured() || !companyId) {
    return getMockRecommendation();
  }

  try {
    // Fetch company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError) throw companyError;

    // Fetch asset balances
    const { data: balances, error: balancesError } = await supabase
      .from('asset_balances')
      .select('*')
      .eq('company_id', companyId);

    if (balancesError) throw balancesError;

    const typedCompany = company as Company;
    const typedBalances = balances as AssetBalance[];

    const usdcBalance = typedBalances.find(b => b.asset_type === 'USDC')?.amount || 0;
    const eurcBalance = typedBalances.find(b => b.asset_type === 'EURC')?.amount || 0;
    const usycBalance = typedBalances.find(b => b.asset_type === 'USYC')?.amount || 0;

    const bankBalance = typedCompany.bank_balance_usd;
    const idleUsdc = usdcBalance; // USDC not in yield = idle

    const shouldSweep = idleUsdc > IDLE_THRESHOLD_USD;
    const sweepAmount = shouldSweep ? Number((idleUsdc * SWEEP_PERCENTAGE).toFixed(2)) : 0;
    const monthlyYield = (sweepAmount * CURRENT_TBILL_APY) / 12;
    const annualYield = sweepAmount * CURRENT_TBILL_APY;

    const recommendations: RecommendationItem[] = [];

    if (shouldSweep) {
      recommendations.push({
        action: 'SWEEP_TO_USYC',
        amount: sweepAmount,
        description: `Sweep $${sweepAmount.toLocaleString()} into USYC T-Bill vault`,
        expectedReturn: `~$${monthlyYield.toFixed(2)}/mo at ${(CURRENT_TBILL_APY * 100).toFixed(1)}% APY`,
        urgency: 'HIGH',
      });
    }

    // Check if EUR settlements might be needed
    if (eurcBalance < 10_000 && usdcBalance > 30_000) {
      const fxAmount = Math.min(15_000, usdcBalance * 0.1);
      recommendations.push({
        action: 'FX_CONVERSION',
        amount: fxAmount,
        description: `Convert $${fxAmount.toLocaleString()} USDC → EURC for EU operations`,
        expectedReturn: `~€${(fxAmount * EUR_USD_RATE).toLocaleString()} EURC`,
        urgency: 'MEDIUM',
      });
    }

    if (!shouldSweep) {
      recommendations.push({
        action: 'HOLD',
        amount: idleUsdc,
        description: 'Current USDC position is within optimal range',
        expectedReturn: 'No action needed',
        urgency: 'LOW',
      });
    }

    const reasoning = shouldSweep
      ? `Your treasury has $${idleUsdc.toLocaleString()} USDC idle on-chain, exceeding the $${IDLE_THRESHOLD_USD.toLocaleString()} threshold. Recommend sweeping ${(SWEEP_PERCENTAGE * 100)}% ($${sweepAmount.toLocaleString()}) into USYC for ${(CURRENT_TBILL_APY * 100).toFixed(1)}% APY yield. Bank balance: $${bankBalance.toLocaleString()}. Current USYC position: $${usycBalance.toLocaleString()}.`
      : `Treasury USDC balance of $${idleUsdc.toLocaleString()} is below the $${IDLE_THRESHOLD_USD.toLocaleString()} threshold. No sweep recommended at this time. Bank balance: $${bankBalance.toLocaleString()}.`;

    return {
      shouldSweep,
      idleUsdcAmount: idleUsdc,
      bankBalance,
      totalOnchainUsdc: usdcBalance,
      sweepAmount,
      projectedMonthlyYield: Number(monthlyYield.toFixed(2)),
      projectedAnnualYield: Number(annualYield.toFixed(2)),
      currentAPY: CURRENT_TBILL_APY * 100,
      reasoning,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('getTreasuryAdvice error:', error);
    // Fallback to mock data on error
    return getMockRecommendation();
  }
}
