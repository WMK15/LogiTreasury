"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isSupabaseConfigured,
  getAuditTrailWithTransactions,
} from "@/lib/supabase";
import type { AuditTrailEntry, Transaction } from "@/lib/supabase";

// ============ Mock Data (testnet-realistic values) ============

const MOCK_AUDIT_DATA: (AuditTrailEntry & { transaction: Transaction })[] = [
  {
    id: "audit-1",
    tx_id: "tx-1",
    action_type: "Cross-border Levy",
    tax_basis_usd: 25,
    tax_rate_applied: 0.005,
    total_tax_withheld: 0.13,
    ai_reasoning_summary:
      "EU MiCA cross-border levy applied to USDC→EURC conversion. Rate: 0.5% of $25.00 transaction value. Compliant with European regulatory framework.",
    compliance_status: "COMPLIANT",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    transaction: {
      id: "tx-1",
      company_id: "demo",
      type: "FX_SWAP",
      from_currency: "USDC",
      to_currency: "EURC",
      amount: 25,
      fiat_value_usd: 25,
      tx_hash:
        "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
      status: "COMPLETED",
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: "audit-2",
    tx_id: "tx-2",
    action_type: "Yield Withholding",
    tax_basis_usd: 0.2,
    tax_rate_applied: 0.2,
    total_tax_withheld: 0.04,
    ai_reasoning_summary:
      "Projected withholding tax on USYC T-Bill yield. $0.20 monthly yield on $50 sweep subject to 20% institutional withholding rate.",
    compliance_status: "COMPLIANT",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    transaction: {
      id: "tx-2",
      company_id: "demo",
      type: "TREASURY_SWEEP",
      from_currency: "USDC",
      to_currency: "USYC",
      amount: 50,
      fiat_value_usd: 50,
      tx_hash:
        "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      status: "COMPLETED",
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: "audit-3",
    tx_id: "tx-3",
    action_type: "Settlement Fee",
    tax_basis_usd: 15,
    tax_rate_applied: 0.001,
    total_tax_withheld: 0.015,
    ai_reasoning_summary:
      "Cross-chain settlement processing fee for EURC→EUR conversion via Arc Bridge Kit. 0.1% fee on $15.00 settlement.",
    compliance_status: "COMPLIANT",
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    transaction: {
      id: "tx-3",
      company_id: "demo",
      type: "SETTLEMENT",
      from_currency: "EURC",
      to_currency: "EUR",
      amount: 15,
      fiat_value_usd: 16.3,
      tx_hash:
        "0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
      status: "COMPLETED",
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: "audit-4",
    tx_id: "tx-4",
    action_type: "Cross-border Levy",
    tax_basis_usd: 10.87,
    tax_rate_applied: 0.005,
    total_tax_withheld: 0.054,
    ai_reasoning_summary:
      "EU MiCA cross-border levy applied to EURC→USDC reverse conversion. Rate: 0.5% of $10.87 equivalent value.",
    compliance_status: "COMPLIANT",
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    transaction: {
      id: "tx-4",
      company_id: "demo",
      type: "FX_SWAP",
      from_currency: "EURC",
      to_currency: "USDC",
      amount: 10,
      fiat_value_usd: 10.87,
      tx_hash:
        "0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcde1",
      status: "COMPLETED",
      created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: "audit-5",
    tx_id: "tx-5",
    action_type: "Yield Withholding",
    tax_basis_usd: 0.14,
    tax_rate_applied: 0.2,
    total_tax_withheld: 0.028,
    ai_reasoning_summary:
      "Projected withholding tax on USYC T-Bill yield. $0.14 monthly yield on $35 sweep subject to 20% institutional withholding rate.",
    compliance_status: "COMPLIANT",
    created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    transaction: {
      id: "tx-5",
      company_id: "demo",
      type: "TREASURY_SWEEP",
      from_currency: "USDC",
      to_currency: "USYC",
      amount: 35,
      fiat_value_usd: 35,
      tx_hash:
        "0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      status: "COMPLETED",
      created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: "audit-6",
    tx_id: "tx-6",
    action_type: "Cross-border Levy",
    tax_basis_usd: 8.5,
    tax_rate_applied: 0.005,
    total_tax_withheld: 0.043,
    ai_reasoning_summary:
      "EU MiCA cross-border levy applied to USDC→EURC conversion for EU payables. Rate: 0.5% of $8.50 value.",
    compliance_status: "COMPLIANT",
    created_at: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    transaction: {
      id: "tx-6",
      company_id: "demo",
      type: "FX_SWAP",
      from_currency: "USDC",
      to_currency: "EURC",
      amount: 8.5,
      fiat_value_usd: 8.5,
      tx_hash:
        "0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
      status: "COMPLETED",
      created_at: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    },
  },
];

// ============ Component ============

const EXPLORER_URL = "https://testnet.arcscan.app";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortenHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

function ComplianceBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLIANT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REVIEW_REQUIRED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    FLAGGED: "bg-red-500/10 text-red-400 border-red-500/20",
    EXEMPT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium border ${styles[status] || styles.COMPLIANT}`}
    >
      {status === "REVIEW_REQUIRED" ? "Review" : status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    FX_SWAP: "bg-blue-500/10 text-blue-400",
    TREASURY_SWEEP: "bg-emerald-500/10 text-emerald-400",
    SETTLEMENT: "bg-purple-500/10 text-purple-400",
  };

  const labels: Record<string, string> = {
    FX_SWAP: "FX Swap",
    TREASURY_SWEEP: "Yield Sweep",
    SETTLEMENT: "Settlement",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${styles[type] || ""}`}
    >
      {labels[type] || type}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-20 bg-neutral-800" />
          <Skeleton className="h-4 w-16 bg-neutral-800" />
          <Skeleton className="h-4 w-24 bg-neutral-800" />
          <Skeleton className="h-4 w-16 bg-neutral-800" />
          <Skeleton className="h-4 w-16 bg-neutral-800" />
          <Skeleton className="h-4 w-20 bg-neutral-800" />
          <Skeleton className="h-4 w-16 bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}

export function AuditTrail() {
  const [entries, setEntries] = useState<
    (AuditTrailEntry & { transaction: Transaction })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const data = await getAuditTrailWithTransactions();
          const validEntries = data.filter(
            (e) => e.transaction,
          ) as (AuditTrailEntry & { transaction: Transaction })[];
          setEntries(validEntries.length > 0 ? validEntries : MOCK_AUDIT_DATA);
        } else {
          setEntries(MOCK_AUDIT_DATA);
        }
      } catch {
        setEntries(MOCK_AUDIT_DATA);
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(loadData, 800);
    return () => clearTimeout(timer);
  }, []);

  const totalTaxWithheld = entries.reduce(
    (sum, e) => sum + e.total_tax_withheld,
    0,
  );
  const totalTransactionValue = entries.reduce(
    (sum, e) => sum + (e.transaction?.fiat_value_usd || 0),
    0,
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-neutral-100">Audit Trail</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Tax and compliance records for all treasury operations
          </p>
        </div>
        {!isLoading && (
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-neutral-500">Total Volume: </span>
              <span className="text-neutral-200 font-medium">
                ${totalTransactionValue.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">Total Tax: </span>
              <span className="text-amber-400 font-medium">
                ${totalTaxWithheld.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-neutral-500">No audit entries found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                  Conversion
                </th>
                <th className="text-right py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-right py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                  Tax Rate
                </th>
                <th className="text-right py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                  Tax
                </th>
                <th className="text-center py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right py-2 px-2 text-neutral-500 font-medium uppercase tracking-wider">
                  Explorer
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <>
                  <tr
                    key={entry.id}
                    className={`border-b border-neutral-800/50 hover:bg-neutral-800/30 cursor-pointer transition-colors ${entry.transaction.to_currency === "USYC" ? "bg-emerald-950/10" : ""}`}
                    onClick={() =>
                      setExpandedRow(expandedRow === entry.id ? null : entry.id)
                    }
                  >
                    <td className="py-2.5 px-2 text-neutral-300">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="py-2.5 px-2">
                      <TypeBadge type={entry.transaction.type} />
                    </td>
                    <td className="py-2.5 px-2 text-neutral-400">
                      {entry.transaction.from_currency} →{" "}
                      {entry.transaction.to_currency === "USYC" ? (
                        <span className="text-emerald-400 font-medium">
                          USYC
                        </span>
                      ) : (
                        entry.transaction.to_currency
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right text-neutral-200 font-mono">
                      ${entry.transaction.fiat_value_usd.toLocaleString()}
                    </td>
                    <td
                      className="py-2.5 px-2 text-right text-neutral-400 font-mono"
                      title={`Basis: $${entry.tax_basis_usd.toLocaleString()}`}
                    >
                      {(entry.tax_rate_applied * 100).toFixed(1)}%
                      <span className="block text-[8px] text-neutral-600 mt-0.5">
                        Basis: ${entry.tax_basis_usd.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-amber-400 font-mono font-medium">
                      ${entry.total_tax_withheld.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <ComplianceBadge status={entry.compliance_status} />
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {entry.transaction.tx_hash && (
                        <a
                          href={`${EXPLORER_URL}/tx/${entry.transaction.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline font-mono"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {shortenHash(entry.transaction.tx_hash)}
                        </a>
                      )}
                    </td>
                  </tr>
                  {expandedRow === entry.id && (
                    <tr
                      key={`${entry.id}-detail`}
                      className="bg-neutral-900/50"
                    >
                      <td colSpan={8} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className="text-emerald-400 mt-0.5">✦</span>
                          <div>
                            <p className="text-xs text-emerald-400 uppercase tracking-wider font-medium mb-1">
                              AI Compliance Analysis
                            </p>
                            <p className="text-xs text-neutral-300 leading-relaxed">
                              {entry.ai_reasoning_summary}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-500">
                              <span>
                                Tax Basis: $
                                {entry.tax_basis_usd.toLocaleString()}
                              </span>
                              <span>Action: {entry.action_type}</span>
                              <span>
                                Net: $
                                {(
                                  entry.transaction.fiat_value_usd -
                                  entry.total_tax_withheld
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
