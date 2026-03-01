'use server';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface BankAccount {
  id: string;
  institution_name: string;
  account_name: string;
  account_number_obfuscated: string;
  currency: string;
  balance: number;
}

export async function getBankBalances(companyId: string): Promise<BankAccount[]> {
  if (!isSupabaseConfigured() || !companyId) return [];

  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) throw error;
    
    return data.map((account: any) => ({
      id: account.id,
      institution_name: account.institution_name,
      account_name: account.account_name,
      account_number_obfuscated: account.account_number_obfuscated,
      currency: account.currency,
      balance: Number(account.balance)
    }));
  } catch (err) {
    console.error('Failed to fetch bank accounts:', err);
    return [];
  }
}
