'use server';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface RecentConversion {
  id: string;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  taxBasis: number;
  taxWithheld: number;
}

export async function getRecentConversions(companyId?: string): Promise<RecentConversion[]> {
  if (!isSupabaseConfigured() || !companyId) {
    return [
      {
        id: 'mock-1',
        date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        fromCurrency: 'USDC',
        toCurrency: 'USYC',
        amount: 50000,
        taxBasis: 2400,
        taxWithheld: 480
      },
      {
        id: 'mock-2',
        date: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
        fromCurrency: 'USDC',
        toCurrency: 'USYC',
        amount: 35000,
        taxBasis: 1680,
        taxWithheld: 336
      }
    ];
  }

  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id,
        created_at,
        from_currency,
        to_currency,
        amount,
        audit_trail (
          tax_basis_usd,
          total_tax_withheld
        )
      `)
      .eq('company_id', companyId)
      .eq('type', 'TREASURY_SWEEP')
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    return transactions.map((tx: any) => ({
      id: tx.id,
      date: tx.created_at,
      fromCurrency: tx.from_currency,
      toCurrency: tx.to_currency,
      amount: Number(tx.amount),
      taxBasis: tx.audit_trail?.[0]?.tax_basis_usd ? Number(tx.audit_trail[0].tax_basis_usd) : 0,
      taxWithheld: tx.audit_trail?.[0]?.total_tax_withheld ? Number(tx.audit_trail[0].total_tax_withheld) : 0,
    }));
  } catch (err) {
    console.error('Failed to fetch recent conversions:', err);
    return [];
  }
}
