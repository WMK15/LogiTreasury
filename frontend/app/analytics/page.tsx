"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ui/ConnectWallet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUSDC, formatPercent } from "@/lib/config";
import {
  useUSDCBalance,
  useEURCBalance,
  useUSYCBalance,
} from "@/hooks/useContracts";
import { useTreasuryDashboard } from "@/hooks/useTreasury";
import { useFXExposure } from "@/hooks/useFX";
import { AuditTrail } from "@/components/analytics/AuditTrail";

// ============ Mock Yield Chart Data ============

const MOCK_YIELD_HISTORY = [
  { day: "Feb 01", cumulative: 0, daily: 0 },
  { day: "Feb 03", cumulative: 12.5, daily: 6.25 },
  { day: "Feb 05", cumulative: 31.2, daily: 9.35 },
  { day: "Feb 07", cumulative: 55.8, daily: 12.3 },
  { day: "Feb 09", cumulative: 84.1, daily: 14.15 },
  { day: "Feb 11", cumulative: 118.6, daily: 17.25 },
  { day: "Feb 13", cumulative: 156.3, daily: 18.85 },
  { day: "Feb 15", cumulative: 198.7, daily: 21.2 },
  { day: "Feb 17", cumulative: 245.2, daily: 23.25 },
  { day: "Feb 19", cumulative: 298.9, daily: 26.85 },
  { day: "Feb 21", cumulative: 358.4, daily: 29.75 },
  { day: "Feb 23", cumulative: 425.1, daily: 33.35 },
  { day: "Feb 25", cumulative: 498.6, daily: 36.75 },
  { day: "Feb 27", cumulative: 578.9, daily: 40.15 },
  { day: "Feb 28", cumulative: 620.4, daily: 41.5 },
];

// ============ Currency Risk Data ============

const CURRENCY_RISKS = [
  {
    symbol: "USDC",
    name: "USD Coin",
    description:
      "Circle-issued USD stablecoin. 1:1 backed by US dollar reserves and short-term US Treasury bonds.",
    riskLevel: "LOW",
    riskColor: "emerald",
    volatility: "±0.01%",
    pegRisk: "Minimal — regulated US entity, monthly attestations by Deloitte",
    yieldPotential: "0% native (can convert to USYC for 4.8% APY)",
    useCase: "Primary operational currency for cross-border logistics payments",
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    description:
      "Circle-issued EUR stablecoin. 1:1 backed by euro-denominated reserves under MiCA regulation.",
    riskLevel: "LOW",
    riskColor: "blue",
    volatility: "±0.02%",
    pegRisk:
      "Minimal — MiCA-compliant e-money token, regulated by Banque de France",
    yieldPotential: "0% native — held for EU settlement obligations",
    useCase: "EU supplier payments, freight carrier settlements, port fees",
  },
  {
    symbol: "USYC",
    name: "Hashnote US Yield Coin",
    description:
      "Yield-bearing token backed by short-duration US Treasury Bills. Earns ~4.8% APY passively.",
    riskLevel: "LOW-MEDIUM",
    riskColor: "amber",
    volatility: "±0.05%",
    pegRisk:
      "Low — backed by T-Bills, but subject to interest rate risk and redemption delays",
    yieldPotential: "~4.8% APY from short-duration US Treasury Bills",
    useCase: "Idle capital optimization — no cash sits idle",
  },
];

// ============ Component ============

export default function AnalyticsPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: usdcBalance, isLoading: usdcLoading } = useUSDCBalance(address);
  const { data: eurcBalance, isLoading: eurcLoading } = useEURCBalance(address);
  const { data: usycBalance, isLoading: usycLoading } = useUSYCBalance(address);
  const { yieldMetrics, isLoading: treasuryLoading } = useTreasuryDashboard();
  const { data: fxExposure } = useFXExposure();

  // Calculate allocations
  const usdcValue = usdcBalance ? Number(usdcBalance) / 1e6 : 128_500;
  const eurcValue = eurcBalance ? Number(eurcBalance) / 1e6 : 42_300;
  const usycValue = usycBalance ? Number(usycBalance as bigint) / 1e6 : 85_000;
  const totalAssets = usdcValue + eurcValue + usycValue || 1;
  const usdcPct = ((usdcValue / totalAssets) * 100).toFixed(1);
  const eurcPct = ((eurcValue / totalAssets) * 100).toFixed(1);
  const usycPct = ((usycValue / totalAssets) * 100).toFixed(1);

  // Yield data
  const currentAPY = yieldMetrics?.currentAPY
    ? formatPercent(Number(yieldMetrics.currentAPY))
    : "4.80%";
  const totalYieldEarned = yieldMetrics?.unrealizedYield
    ? formatUSDC(yieldMetrics.unrealizedYield)
    : "620.40";
  const monthlyProjection = (usycValue * 0.048) / 12;

  if (!mounted) {
    return (
      <div className="pt-20">
        <Skeleton className="h-6 w-48 bg-neutral-800 mb-4" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="pt-20">
        <p className="text-sm text-neutral-400 mb-4">
          Connect wallet to continue
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-neutral-100">Analytics</h1>
        <p className="text-xs text-neutral-500">
          Treasury intelligence & compliance
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 1. FX EXPOSURE SUMMARY                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="card mb-6">
        <h2 className="text-sm font-medium text-neutral-100 mb-1">
          FX Exposure Summary
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          Currency allocation and risk profile for your logistics treasury
        </p>

        {/* Allocation Bar */}
        <div className="h-3 rounded-full overflow-hidden flex mb-3">
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${usdcPct}%` }}
          />
          <div
            className="bg-purple-500 transition-all duration-500"
            style={{ width: `${eurcPct}%` }}
          />
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${usycPct}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mb-4 text-[10px] text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            USDC {usdcPct}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            EURC {eurcPct}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            USYC {usycPct}%
          </span>
        </div>

        {/* Currency Risk Cards */}
        <div className="grid grid-cols-3 gap-3">
          {CURRENCY_RISKS.map((currency) => {
            const balance =
              currency.symbol === "USDC"
                ? usdcValue
                : currency.symbol === "EURC"
                  ? eurcValue
                  : usycValue;
            const pct =
              currency.symbol === "USDC"
                ? usdcPct
                : currency.symbol === "EURC"
                  ? eurcPct
                  : usycPct;

            return (
              <div
                key={currency.symbol}
                className="bg-neutral-900/60 rounded-md p-3 border border-neutral-800/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-200">
                    {currency.symbol}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium ${
                      currency.riskColor === "emerald"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : currency.riskColor === "blue"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {currency.riskLevel}
                  </span>
                </div>
                <p className="text-lg font-bold text-neutral-100 tabular-nums mb-1">
                  $
                  {balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[10px] text-neutral-600 mb-2">
                  {pct}% of portfolio
                </p>
                <div className="space-y-1.5 text-[10px]">
                  <div>
                    <span className="text-neutral-500">Volatility:</span>{" "}
                    <span className="text-neutral-400">
                      {currency.volatility}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Peg Risk:</span>{" "}
                    <span className="text-neutral-400">{currency.pegRisk}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Yield:</span>{" "}
                    <span
                      className={
                        currency.symbol === "USYC"
                          ? "text-emerald-400"
                          : "text-neutral-400"
                      }
                    >
                      {currency.yieldPotential}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Use:</span>{" "}
                    <span className="text-neutral-400">{currency.useCase}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 2. USYC YIELD OVER TIME                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-neutral-100">
              USYC Yield Over Time
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Cumulative earnings from T-Bill backed yield
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-neutral-500">Current APY</p>
              <p className="text-sm font-medium text-emerald-400">
                {currentAPY}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-neutral-500">Total Earned</p>
              <p className="text-sm font-medium text-emerald-400">
                ${totalYieldEarned}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-neutral-500">Monthly Est.</p>
              <p className="text-sm font-medium text-emerald-400">
                +${monthlyProjection.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* ASCII-style Chart (no chart library needed) */}
        <div className="bg-neutral-900/60 rounded-md p-4">
          <div className="flex items-end gap-1 h-32">
            {MOCK_YIELD_HISTORY.map((point, i) => {
              const maxVal =
                MOCK_YIELD_HISTORY[MOCK_YIELD_HISTORY.length - 1].cumulative;
              const heightPct =
                maxVal > 0 ? (point.cumulative / maxVal) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full flex items-end"
                    style={{ height: "100px" }}
                  >
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all duration-300 hover:opacity-80 relative group"
                      style={{
                        height: `${heightPct}%`,
                        minHeight: point.cumulative > 0 ? "2px" : "0",
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-neutral-800 rounded px-2 py-1 text-[10px] text-neutral-200 whitespace-nowrap z-10">
                        ${point.cumulative.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {i % 3 === 0 && (
                    <span className="text-[8px] text-neutral-600 truncate">
                      {point.day.split(" ")[1]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-neutral-600">
            <span>Feb 01</span>
            <span>Feb 28</span>
          </div>
        </div>

        {/* Yield breakdown */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="text-center">
            <p className="text-[10px] text-neutral-500">USYC Position</p>
            <p className="text-sm font-medium text-neutral-200 tabular-nums">
              ${usycValue.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-neutral-500">Daily Yield</p>
            <p className="text-sm font-medium text-emerald-400 tabular-nums">
              +${((usycValue * 0.048) / 365).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-neutral-500">Weekly Yield</p>
            <p className="text-sm font-medium text-emerald-400 tabular-nums">
              +${((usycValue * 0.048) / 52).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-neutral-500">Yearly Yield</p>
            <p className="text-sm font-medium text-emerald-400 tabular-nums">
              +${(usycValue * 0.048).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 3. AUDIT TRAIL                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AuditTrail />
    </div>
  );
}
