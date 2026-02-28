"use client";

import { useState, useEffect, useTransition } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ui/ConnectWallet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUSDC, formatPercent } from "@/lib/config";
import {
  useNativeUSDCBalance,
  useUSDCBalance,
  useEURCBalance,
  useUSYCBalance,
  useEscrowCount,
} from "@/hooks/useContracts";
import { useTreasuryDashboard } from "@/hooks/useTreasury";
import { useCurrentRates } from "@/hooks/useFX";
import { RateSnapshot } from "@/types/treasury";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import {
  getTreasuryAdvice,
  type TreasuryRecommendation,
} from "@/app/actions/getTreasuryAdvice";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [recommendation, setRecommendation] =
    useState<TreasuryRecommendation | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();

  const { data: nativeBalance, isLoading: nativeLoading } =
    useNativeUSDCBalance(address);
  const { data: usdcBalance, isLoading: usdcLoading } = useUSDCBalance(address);
  const { data: eurcBalance, isLoading: eurcLoading } = useEURCBalance(address);
  const { data: usycBalance, isLoading: usycLoading } = useUSYCBalance(address);
  const {
    balanceSnapshot,
    yieldMetrics,
    isLoading: treasuryLoading,
  } = useTreasuryDashboard();
  const { data: escrowCount, isLoading: escrowLoading } = useEscrowCount();
  const { data: rates, isLoading: ratesLoading } = useCurrentRates();

  // Mock bank balance for demo
  const bankBalance = 245_000;
  const treasuryBalance = balanceSnapshot?.totalValue;
  const apy = yieldMetrics?.currentAPY;
  const fxRate = (rates as RateSnapshot)?.usdcToEurcRate;
  const yieldAccrued = yieldMetrics?.unrealizedYield;

  // Total liquidity = bank + onchain
  const onchainUsdcValue = nativeBalance ? Number(nativeBalance.formatted) : 0;
  const erc20UsdcValue = usdcBalance ? Number(usdcBalance) / 1e6 : 0;
  const eurcValue = eurcBalance ? Number(eurcBalance) / 1e6 : 0;
  const usycValue = usycBalance ? Number(usycBalance as bigint) / 1e6 : 0;
  const totalOnchain =
    onchainUsdcValue + erc20UsdcValue + eurcValue + usycValue;
  const totalLiquidity = bankBalance + totalOnchain;

  // Load AI recommendation
  useEffect(() => {
    if (aiEnabled) {
      startTransition(async () => {
        const advice = await getTreasuryAdvice();
        setRecommendation(advice);
      });
    }
  }, [aiEnabled]);

  if (!mounted) {
    return (
      <div className="pt-20">
        <Skeleton className="h-6 w-48 bg-neutral-800 mb-4" />
        <Skeleton className="h-4 w-64 bg-neutral-800 mb-6" />
        <Skeleton className="h-10 w-32 bg-neutral-800" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="pt-20">
        <h1 className="text-lg font-medium mb-2">LogiTreasury</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Enterprise logistics treasury & settlement platform
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-neutral-100">Dashboard</h1>
        <p className="text-xs text-neutral-500">
          {new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 1. TOTAL LIQUIDITY HERO + DRILL-DOWN                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="card bg-gradient-to-br from-blue-950/40 to-neutral-900 border-blue-800/20 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-400 uppercase tracking-wider font-medium mb-2">
              Total Liquidity
            </p>
            {treasuryLoading || nativeLoading || usdcLoading ? (
              <Skeleton className="h-10 w-40 bg-blue-800/30" />
            ) : (
              <p className="text-3xl font-bold text-neutral-50">
                $
                {totalLiquidity.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            )}
            <p className="text-xs text-neutral-500 mt-1">
              Bank + On-chain combined
            </p>
          </div>
          <button
            onClick={() => setDrillDownOpen(!drillDownOpen)}
            className="btn-secondary text-xs"
          >
            {drillDownOpen ? "Hide" : "Drill Down"} ▾
          </button>
        </div>

        {/* Drill-down breakdown */}
        {drillDownOpen && (
          <div className="mt-4 pt-4 border-t border-blue-800/20">
            <div className="grid grid-cols-2 gap-4">
              {/* Bank Liquid */}
              <div className="bg-neutral-900/60 rounded-md p-3">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">
                  💳 Bank Liquid (CPN)
                </p>
                <p className="text-lg font-medium text-neutral-200 tabular-nums">
                  ${bankBalance.toLocaleString()}
                </p>
                <p className="text-[10px] text-neutral-600 mt-1">
                  Deutsche Bank • EUR account
                </p>
              </div>

              {/* Onchain Breakdown */}
              <div className="bg-neutral-900/60 rounded-md p-3">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">
                  ⛓ On-chain Assets
                </p>
                <p className="text-lg font-medium text-neutral-200 tabular-nums">
                  $
                  {totalOnchain.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-500">Native USDC</span>
                    <span className="text-neutral-400 tabular-nums">
                      {nativeLoading
                        ? "..."
                        : `$${onchainUsdcValue.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-500">ERC20 USDC</span>
                    <span className="text-neutral-400 tabular-nums">
                      {usdcLoading ? "..." : `$${erc20UsdcValue.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-500">EURC</span>
                    <span className="text-neutral-400 tabular-nums">
                      {eurcLoading ? "..." : `$${eurcValue.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-emerald-500">USYC (Yield)</span>
                    <span className="text-emerald-400 tabular-nums">
                      {usycLoading ? "..." : `$${usycValue.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 2. SMART RECOMMENDATIONS / AI ENGINE                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✦</span>
            <p className="text-xs text-neutral-200 font-medium">
              Smart Recommendations
            </p>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
              AI
            </span>
          </div>
          {/* Toggle */}
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
              aiEnabled ? "bg-emerald-500" : "bg-neutral-700"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                aiEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {aiEnabled && (
          <>
            {isPending || !recommendation ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full bg-neutral-800" />
                <Skeleton className="h-4 w-3/4 bg-neutral-800" />
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <Skeleton className="h-24 bg-neutral-800 rounded-md" />
                  <Skeleton className="h-24 bg-neutral-800 rounded-md" />
                  <Skeleton className="h-24 bg-neutral-800 rounded-md" />
                </div>
              </div>
            ) : (
              <>
                {/* AI Reasoning */}
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  {recommendation.reasoning}
                </p>

                {/* Recommendation Cards */}
                <div className="grid grid-cols-3 gap-3">
                  {recommendation.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className={`rounded-md p-3 border ${
                        rec.urgency === "HIGH"
                          ? "bg-emerald-950/30 border-emerald-800/30"
                          : rec.urgency === "MEDIUM"
                            ? "bg-blue-950/30 border-blue-800/30"
                            : "bg-neutral-900 border-neutral-800"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-medium ${
                            rec.urgency === "HIGH"
                              ? "text-emerald-400"
                              : rec.urgency === "MEDIUM"
                                ? "text-blue-400"
                                : "text-neutral-500"
                          }`}
                        >
                          {rec.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-200 font-medium mb-1">
                        {rec.action === "SWEEP_TO_USYC"
                          ? "Convert to USYC"
                          : rec.action === "FX_CONVERSION"
                            ? "Convert via StableFX"
                            : "Hold Liquid"}
                      </p>
                      <p className="text-lg font-bold text-neutral-100 tabular-nums mb-1">
                        ${rec.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {rec.expectedReturn}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Projected Earnings Summary */}
                {recommendation.shouldSweep && (
                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <p className="text-xs text-neutral-500">
                      Projected earnings if recommendations applied:
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-neutral-500">Monthly</p>
                        <p className="text-sm font-medium text-emerald-400">
                          +${recommendation.projectedMonthlyYield.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-neutral-500">Annual</p>
                        <p className="text-sm font-medium text-emerald-400">
                          +$
                          {recommendation.projectedAnnualYield.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 3. QUICK STATS ROW                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="kpi-label mb-1">Treasury Balance</p>
          {treasuryLoading ? (
            <Skeleton className="h-7 w-24 bg-neutral-800" />
          ) : (
            <p className="kpi-value text-neutral-50">
              {treasuryBalance ? formatUSDC(treasuryBalance) : "0.00"}
              <span className="text-neutral-500 text-sm ml-1">USDC</span>
            </p>
          )}
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Current APY</p>
          {treasuryLoading ? (
            <Skeleton className="h-7 w-16 bg-neutral-800" />
          ) : (
            <p className="kpi-value text-emerald-400">
              {apy ? formatPercent(Number(apy)) : "4.80%"}
            </p>
          )}
        </div>
        <div className="card">
          <p className="kpi-label mb-1">EUR/USD Rate</p>
          {ratesLoading ? (
            <Skeleton className="h-7 w-16 bg-neutral-800" />
          ) : (
            <p className="kpi-value">
              {fxRate ? (Number(fxRate) / 1e18).toFixed(4) : "0.9200"}
            </p>
          )}
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Active Escrows</p>
          {escrowLoading ? (
            <Skeleton className="h-7 w-8 bg-neutral-800" />
          ) : (
            <p className="kpi-value">{escrowCount?.toString() || "0"}</p>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 4. YIELD EARNED HIGHLIGHT                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="card bg-gradient-to-br from-emerald-900/20 to-neutral-900 border-emerald-800/20 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 text-sm">✦</span>
              <p className="text-xs text-emerald-400 uppercase tracking-wider font-medium">
                Deep Savings — No Capital Sits Idle
              </p>
            </div>
            <div className="flex items-baseline gap-4">
              {usycLoading ? (
                <Skeleton className="h-8 w-28 bg-emerald-800/30" />
              ) : (
                <p className="text-2xl font-bold text-emerald-400">
                  {formatUSDC((usycBalance as bigint) || 0n)}
                  <span className="text-base font-normal text-emerald-500 ml-2">
                    USYC
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500 mb-1">Yield Accrued</p>
            {treasuryLoading ? (
              <Skeleton className="h-6 w-20 bg-emerald-800/30" />
            ) : (
              <p className="text-xl font-bold text-emerald-400">
                +${yieldAccrued ? formatUSDC(yieldAccrued) : "0.00"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 5. RECENT TRANSACTIONS                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <TransactionHistory />
    </div>
  );
}
