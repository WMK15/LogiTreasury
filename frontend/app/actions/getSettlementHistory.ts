'use server';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface SettlementRecord {
  id: string;
  type: string;
  from: string;
  to: string;
  amount: number;
  rate: string;
  status: string;
  date: string;
  txHash: string;
}

export async function getSettlementHistory(
  companyId?: string,
  types: string[] = ['SETTLEMENT', 'FX_SWAP']
): Promise<SettlementRecord[]> {
  if (!isSupabaseConfigured() || !companyId) return [];

  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', companyId)
      .in('type', types)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return transactions.map((tx: any) => ({
      id: tx.id,
      type: tx.type === 'FX_SWAP' 
        ? 'FX Settlement' 
        : tx.type === 'TREASURY_SWEEP' 
          ? 'Yield Sweep' 
          : 'Cross-chain',
      from: tx.from_currency,
      to: tx.to_currency,
      amount: Number(tx.amount),
      rate: tx.type === 'FX_SWAP' ? '0.9520' : '—', // In a real app, this would be stored per-tx
      status: tx.status === 'PENDING' ? 'Pending' : tx.status === 'CANCELLED' ? 'Cancelled' : tx.status === 'FAILED' ? 'Failed' : 'Completed',
      date: new Date(tx.created_at).toLocaleDateString('en-GB'),
      txHash: tx.tx_hash || '—',
    }));
  } catch (err) {
    console.error('Failed to fetch settlements:', err);
    return [];
  }
}
