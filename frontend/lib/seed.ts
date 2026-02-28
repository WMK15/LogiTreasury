/**
 * Seed Data for LogiTreasury Demo
 * 
 * Run this to populate Supabase with demo data for the hackathon.
 * Usage: npx tsx lib/seed.ts (or import and call seedDemoData())
 */

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
      type: 'FX_SWAP' as const,
      from_currency: 'EURC',
      to_currency: 'USDC',
      amount: 10_000.00,
      fiat_value_usd: 10_869.57,
      tx_hash: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcde1',
      status: 'COMPLETED' as const,
      created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
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
    {
      company_id: companyId,
      type: 'FX_SWAP' as const,
      from_currency: 'USDC',
      to_currency: 'EURC',
      amount: 8_500.00,
      fiat_value_usd: 8_500.00,
      tx_hash: '0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
      status: 'COMPLETED' as const,
      created_at: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    },
    {
      company_id: companyId,
      type: 'SETTLEMENT' as const,
      from_currency: 'USDC',
      to_currency: 'USDC',
      amount: 72_000.00,
      fiat_value_usd: 72_000.00,
      tx_hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
      status: 'PENDING' as const,
      created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
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
      const taxRate = tx.type === 'FX_SWAP' ? 0.005 : tx.type === 'TREASURY_SWEEP' ? 0.20 : 0.001;
      const yieldGain = tx.type === 'TREASURY_SWEEP' ? tx.amount * 0.048 / 12 : tx.amount;
      const taxBasis = tx.type === 'TREASURY_SWEEP' ? yieldGain : tx.amount;
      const taxWithheld = taxBasis * taxRate;

      return {
        tx_id: tx.id,
        action_type: tx.type === 'FX_SWAP' ? 'Cross-border Levy' : tx.type === 'TREASURY_SWEEP' ? 'Yield Withholding' : 'Settlement Fee',
        tax_basis_usd: Number(taxBasis.toFixed(6)),
        tax_rate_applied: taxRate,
        total_tax_withheld: Number(taxWithheld.toFixed(6)),
        ai_reasoning_summary: `Automated tax calculation for ${tx.type.replace('_', ' ')} of $${tx.amount.toLocaleString()}. ${tx.type === 'FX_SWAP' ? 'EU MiCA levy applied.' : tx.type === 'TREASURY_SWEEP' ? 'T-Bill yield withholding applied.' : 'Bridge settlement fee applied.'}`,
        compliance_status: tx.amount >= 100_000 ? 'REVIEW_REQUIRED' as const : 'COMPLIANT' as const,
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
