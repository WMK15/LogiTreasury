/**
 * Seed Data for LogiTreasury Demo
 * 
 * Run this to populate Supabase with demo data for the hackathon.
 * Usage: npx tsx lib/seed.ts (or import and call seedDemoData())
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { supabase, isSupabaseConfigured } from './supabase';

const DEMO_COMPANY = {
  name: 'EuroFreight Logistics GmbH',
  bank_balance_usd: 245_000.00,
  onchain_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
  total_yield_earned: 3_847.52,
};

export async function seedDemoData() {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    return;
  }

  console.log('🌱 Seeding demo data...');

  // 1. Create company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert(DEMO_COMPANY)
    .select()
    .single();

  if (companyError) {
    console.error('Error creating company:', companyError);
    return;
  }

  console.log('✅ Company created:', company.id);
  const companyId = company.id;

  // 2. Create asset balances
  const assetBalances = [
    { company_id: companyId, asset_type: 'USDC' as const, amount: 128_500.00 },
    { company_id: companyId, asset_type: 'EURC' as const, amount: 42_300.00 },
    { company_id: companyId, asset_type: 'USYC' as const, amount: 85_000.00 },
  ];

  const { error: balanceError } = await supabase
    .from('asset_balances')
    .insert(assetBalances);

  if (balanceError) {
    console.error('Error creating balances:', balanceError);
    return;
  }
  console.log('✅ Asset balances created');

  // 3. Create transactions and audit trail entries
  const transactions = [
    // Past completed transactions (history)
    {
      company_id: companyId,
      type: 'FX_SWAP' as const,
      from_currency: 'USDC',
      to_currency: 'EURC',
      amount: 25_000.00,
      fiat_value_usd: 25_000.00,
      tx_hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
      status: 'COMPLETED' as const,
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      company_id: companyId,
      type: 'TREASURY_SWEEP' as const,
      from_currency: 'USDC',
      to_currency: 'USYC',
      amount: 50_000.00,
      fiat_value_usd: 50_000.00,
      tx_hash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      status: 'COMPLETED' as const,
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      company_id: companyId,
      type: 'SETTLEMENT' as const,
      from_currency: 'EURC',
      to_currency: 'EUR',
      amount: 15_000.00,
      fiat_value_usd: 16_304.35,
      tx_hash: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
      status: 'COMPLETED' as const,
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
    {
      company_id: companyId,
      type: 'TREASURY_SWEEP' as const,
      from_currency: 'USDC',
      to_currency: 'USYC',
      amount: 35_000.00,
      fiat_value_usd: 35_000.00,
      tx_hash: '0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      status: 'COMPLETED' as const,
      created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    },
    // Future pending obligations (upcoming liabilities within 5 days)
    {
      company_id: companyId,
      type: 'SETTLEMENT' as const,
      from_currency: 'USDC',
      to_currency: 'USD',
      amount: 40_000.00,
      fiat_value_usd: 40_000.00,
      tx_hash: null, // No hash yet since it's pending
      status: 'PENDING' as const,
      created_at: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(), // Due in 2 days
    },
    {
      company_id: companyId,
      type: 'SETTLEMENT' as const,
      from_currency: 'USDC',
      to_currency: 'EUR', // Simulating an upcoming EU vendor payment 
      amount: 25_000.00, 
      fiat_value_usd: 26_250.00,
      tx_hash: null,
      status: 'PENDING' as const,
      created_at: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(), // Due in 4 days
    },
  ];

  const { data: txData, error: txError } = await supabase
    .from('transactions')
    .insert(transactions)
    .select();

  if (txError) {
    console.error('Error creating transactions:', txError);
    return;
  }
  console.log('✅ Transactions created:', txData.length);

  // 4. Create audit trail entries for completed transactions
  const auditEntries = txData
    .filter(tx => tx.status === 'COMPLETED')
    .map(tx => {
      let taxRate = 0;
      let taxBasis = 0;
      let actionType = '';
      let reasoning = '';
      let complianceStatus: 'COMPLIANT' | 'REVIEW_REQUIRED' | 'FLAGGED' | 'EXEMPT' = 'COMPLIANT';

      if (tx.type === 'FX_SWAP') {
        taxRate = 0.005; // 0.5% levy
        taxBasis = tx.fiat_value_usd;
        actionType = 'Cross-border Levy';
        reasoning = 'Automated tax calculation for FX swap. EU MiCA cross-border transfer levy applied natively at settlement.';
      } else if (tx.type === 'TREASURY_SWEEP') {
        // For USYC conversions, withholding tax is on the ~4.8% APY assumed gain
        taxRate = 0.20; // 20% withholding
        taxBasis = tx.fiat_value_usd * 0.048; // Annual estimated basis
        actionType = 'USYC Withholding Tax';
        reasoning = `USDC to USYC sweep of $${tx.amount.toLocaleString()}. 20% future withholding tax applied on expected Treasury Bill yield over duration.`;
      } else {
        taxRate = 0.001; // 0.1% fee
        taxBasis = tx.fiat_value_usd;
        actionType = 'Settlement Fee';
        reasoning = 'Automated bridge settlement fee applied.';
      }

      if (tx.amount >= 100_000) complianceStatus = 'REVIEW_REQUIRED';

      const taxWithheld = taxBasis * taxRate;

      return {
        tx_id: tx.id,
        action_type: actionType,
        tax_basis_usd: Number(taxBasis.toFixed(6)),
        tax_rate_applied: taxRate,
        total_tax_withheld: Number(taxWithheld.toFixed(6)),
        ai_reasoning_summary: reasoning,
        compliance_status: complianceStatus,
      };
    });

  const { error: auditError } = await supabase
    .from('audit_trail')
    .insert(auditEntries);

  if (auditError) {
    console.error('Error creating audit entries:', auditError);
    return;
  }
  console.log('✅ Audit trail entries created:', auditEntries.length);
  console.log('🎉 Demo data seeded successfully!');
  console.log(`📋 Company ID: ${companyId}`);
}

// Ensure the function gets called when run directly via CLI
seedDemoData().catch(console.error);
