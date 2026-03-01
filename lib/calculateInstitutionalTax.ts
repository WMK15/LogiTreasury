/**
 * Institutional Tax Calculation Engine
 * 
 * Calculates taxes for three transaction types:
 * - FX_SWAP:         0.5% Cross-border Levy (EU cross-border FX regulation)
 * - TREASURY_SWEEP:  20% Projected Withholding Tax on USYC yield gains
 * - SETTLEMENT:      0.1% Settlement Processing Fee
 */

export type TaxableTransactionType = 'FX_SWAP' | 'TREASURY_SWEEP' | 'SETTLEMENT';

export interface TaxResult {
  /** The original transaction amount used as tax basis (USD) */
  taxBasis: number;
  /** Description of the applied tax rule */
  taxRule: string;
  /** Tax rate as a decimal (e.g. 0.005 = 0.5%) */
  taxRate: number;
  /** Tax rate as human-readable string */
  taxRateDisplay: string;
  /** Total tax amount withheld (USD) */
  taxAmount: number;
  /** Net amount after tax (USD) */
  netSettlement: number;
  /** Regulatory description */
  description: string;
  /** Compliance status */
  complianceStatus: 'COMPLIANT' | 'REVIEW_REQUIRED' | 'FLAGGED';
}

// Tax rate constants
const TAX_RATES = {
  FX_SWAP: {
    rate: 0.005,         // 0.5%
    rule: 'Cross-border Levy',
    description: 'EU Cross-border FX levy applied to all currency conversions under MiCA regulatory framework. Rate: 0.5% of transaction value.',
  },
  TREASURY_SWEEP: {
    rate: 0.20,          // 20%
    rule: 'Projected Withholding Tax',
    description: 'Projected withholding tax on USYC T-Bill yield income. Applied at 20% on realized yield gains per institutional treasury reporting requirements.',
  },
  SETTLEMENT: {
    rate: 0.001,         // 0.1%
    rule: 'Settlement Processing Fee',
    description: 'Cross-chain settlement processing fee for Arc Bridge Kit transfers. Covers bridge validation and finality confirmation costs.',
  },
} as const;

// Threshold for review flagging
const REVIEW_THRESHOLD_USD = 100_000;
const FLAG_THRESHOLD_USD = 500_000;

/**
 * Calculate institutional tax for a given transaction
 * 
 * @param amount - Transaction amount in USD
 * @param type - Transaction type (FX_SWAP, TREASURY_SWEEP, SETTLEMENT)
 * @param yieldGain - For TREASURY_SWEEP: the actual yield gain to tax (optional, defaults to full amount)
 * @returns TaxResult with all tax details
 */
export function calculateInstitutionalTax(
  amount: number,
  type: TaxableTransactionType,
  yieldGain?: number,
): TaxResult {
  const config = TAX_RATES[type];

  // For TREASURY_SWEEP, tax is on the yield gain, not the principal
  const taxBasis = type === 'TREASURY_SWEEP' && yieldGain !== undefined
    ? yieldGain
    : amount;

  const taxAmount = Number((taxBasis * config.rate).toFixed(6));
  const netSettlement = Number((amount - taxAmount).toFixed(6));

  // Determine compliance status based on amount thresholds
  let complianceStatus: TaxResult['complianceStatus'] = 'COMPLIANT';
  if (amount >= FLAG_THRESHOLD_USD) {
    complianceStatus = 'FLAGGED';
  } else if (amount >= REVIEW_THRESHOLD_USD) {
    complianceStatus = 'REVIEW_REQUIRED';
  }

  return {
    taxBasis,
    taxRule: config.rule,
    taxRate: config.rate,
    taxRateDisplay: `${(config.rate * 100).toFixed(1)}%`,
    taxAmount,
    netSettlement,
    description: config.description,
    complianceStatus,
  };
}

/**
 * Calculate tax for multiple transactions (batch)
 */
export function calculateBatchTax(
  transactions: Array<{ amount: number; type: TaxableTransactionType; yieldGain?: number }>
): { results: TaxResult[]; totalTax: number; totalNet: number } {
  const results = transactions.map(tx =>
    calculateInstitutionalTax(tx.amount, tx.type, tx.yieldGain)
  );
  
  const totalTax = results.reduce((sum, r) => sum + r.taxAmount, 0);
  const totalNet = results.reduce((sum, r) => sum + r.netSettlement, 0);
  
  return { results, totalTax, totalNet };
}

/**
 * Get a human-readable AI reasoning summary for the audit trail
 */
export function generateAIReasoningSummary(
  type: TaxableTransactionType,
  amount: number,
  taxResult: TaxResult,
): string {
  switch (type) {
    case 'FX_SWAP':
      return `Cross-border FX conversion of $${amount.toLocaleString()} processed. Applied ${taxResult.taxRateDisplay} EU levy ($${taxResult.taxAmount.toFixed(2)} withheld). Net settlement: $${taxResult.netSettlement.toLocaleString()}. Compliant with MiCA framework.`;
    case 'TREASURY_SWEEP':
      return `Treasury yield sweep processed. Yield gain of $${taxResult.taxBasis.toLocaleString()} subject to ${taxResult.taxRateDisplay} withholding tax ($${taxResult.taxAmount.toFixed(2)} withheld). USYC T-Bill yield is taxed as interest income under institutional reporting.`;
    case 'SETTLEMENT':
      return `Cross-chain settlement of $${amount.toLocaleString()} via Arc Bridge. Processing fee of ${taxResult.taxRateDisplay} ($${taxResult.taxAmount.toFixed(2)}) applied. Settlement routed through optimized bridge path.`;
    default:
      return `Transaction processed. Tax of $${taxResult.taxAmount.toFixed(2)} applied at ${taxResult.taxRateDisplay}.`;
  }
}
