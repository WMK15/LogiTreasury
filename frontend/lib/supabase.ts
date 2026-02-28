import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create the client if credentials are actually provided
// createClient('', '') throws and crashes SSR
export const supabase: SupabaseClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as SupabaseClient, {
      get: () => () => ({ data: null, error: { message: 'Supabase not configured' } }),
    });

// ============ Database Types ============

export type TransactionType = 'FX_SWAP' | 'TREASURY_SWEEP' | 'SETTLEMENT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ComplianceStatus = 'COMPLIANT' | 'REVIEW_REQUIRED' | 'FLAGGED' | 'EXEMPT';
export type AssetType = 'USDC' | 'EURC' | 'USYC';

export interface Company {
  id: string;
  name: string;
  bank_balance_usd: number;
  onchain_address: string;
  total_yield_earned: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  company_id: string;
  type: TransactionType;
  from_currency: string;
  to_currency: string;
  amount: number;
  fiat_value_usd: number;
  tx_hash: string | null;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

export interface AuditTrailEntry {
  id: string;
  tx_id: string;
  action_type: string;
  tax_basis_usd: number;
  tax_rate_applied: number;
  total_tax_withheld: number;
  ai_reasoning_summary: string | null;
  compliance_status: ComplianceStatus;
  created_at: string;
  // Joined transaction data
  transaction?: Transaction;
}

export interface AssetBalance {
  id: string;
  company_id: string;
  asset_type: AssetType;
  amount: number;
  last_updated: string;
}

// ============ Query Helpers ============

export async function getCompany(companyId: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();
  if (error) throw error;
  return data as Company;
}

export async function getCompanyByAddress(address: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('onchain_address', address.toLowerCase())
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as Company | null;
}

export async function getAssetBalances(companyId: string) {
  const { data, error } = await supabase
    .from('asset_balances')
    .select('*')
    .eq('company_id', companyId);
  if (error) throw error;
  return data as AssetBalance[];
}

export async function getAuditTrailWithTransactions(companyId?: string) {
  let query = supabase
    .from('audit_trail')
    .select(`
      *,
      transaction:transactions!tx_id (*)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (companyId) {
    query = query.eq('transaction.company_id', companyId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AuditTrailEntry[];
}

export async function getTransactions(companyId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Transaction[];
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
