"use client";

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

export default function Overview() {
  const { address, isConnected } = useAccount();

  const { data: nativeBalance, isLoading: nativeLoading } = useNativeUSDCBalance(address);
  const { data: usdcBalance, isLoading: usdcLoading } = useUSDCBalance(address);
  const { data: eurcBalance, isLoading: eurcLoading } = useEURCBalance(address);
  const { data: usycBalance, isLoading: usycLoading } = useUSYCBalance(address);
  const { balanceSnapshot, yieldMetrics, isLoading: treasuryLoading } = useTreasuryDashboard();
  const { data: escrowCount, isLoading: escrowLoading } = useEscrowCount();
  const { data: rates, isLoading: ratesLoading } = useCurrentRates();

  const treasuryBalance = balanceSnapshot?.totalValue;
  const treasuryYield = yieldMetrics?.unrealizedYield;
  const apy = yieldMetrics?.currentAPY;
  const fxRate = (rates as RateSnapshot)?.usdcToEurcRate;

  if (!isConnected) {
    return (
      <div className="pt-20">
        <h1 className="text-lg font-medium mb-2">LogiTreasury</h1>
        <p className="text-sm text-neutral-500 mb-6">
          European logistics treasury and settlement platform
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-neutral-100">Overview</h1>
        <p className="text-xs text-neutral-500">
          {new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Deep Savings Hero Card */}
      <div className="card bg-gradient-to-br from-emerald-900/30 to-neutral-900 border-emerald-800/30 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 text-lg">✦</span>
              <p className="text-xs text-emerald-400 uppercase tracking-wider font-medium">
                Deep Savings - No Capital Sits Idle
              </p>
            </div>
            <div className="flex items-baseline gap-4">
              {usycLoading ? (
                <Skeleton className="h-10 w-32 bg-emerald-800/30" />
              ) : (
                <p className="text-3xl font-bold text-emerald-400">
                  {usycBalance ? formatUSDC(usycBalance as bigint) : "0.00"}
                  <span className="text-lg font-normal text-emerald-500 ml-2">USYC</span>
                </p>
              )}
              <div className="text-sm text-neutral-400">
                Earning <span className="text-emerald-400 font-medium">~4.5% APY</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Yield-bearing T-Bill backed stablecoin via Hashnote
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500 mb-1">Yield Accrued</p>
            {treasuryLoading ? (
              <Skeleton className="h-8 w-24 bg-emerald-800/30" />
            ) : (
              <p className="text-2xl font-bold text-emerald-400">
                +${treasuryYield ? formatUSDC(treasuryYield) : "0.00"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPI
          label="Treasury Balance"
          value={treasuryBalance ? formatUSDC(treasuryBalance) : "0.00"}
          suffix="USDC"
          highlight
          loading={treasuryLoading}
        />
        <KPI
          label="Current APY"
          value={apy ? formatPercent(Number(apy)) : "4.50%"}
          loading={treasuryLoading}
          accent="emerald"
        />
        <KPI
          label="EUR/USD Rate"
          value={fxRate ? (Number(fxRate) / 1e18).toFixed(4) : "0.9200"}
          loading={ratesLoading}
        />
        <KPI 
          label="Active Escrows" 
          value={escrowCount?.toString() || "0"} 
          loading={escrowLoading}
        />
      </div>

      {/* Wallet Balances */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KPI
          label="Native USDC (Gas)"
          value={nativeBalance ? Number(nativeBalance.formatted).toFixed(2) : "0.00"}
          loading={nativeLoading}
        />
        <KPI
          label="ERC20 USDC"
          value={usdcBalance ? formatUSDC(usdcBalance) : "0.00"}
          loading={usdcLoading}
        />
        <KPI
          label="Wallet EURC"
          value={eurcBalance ? formatUSDC(eurcBalance) : "0.00"}
          loading={eurcLoading}
        />
        <KPI
          label="USYC Holdings"
          value={usycBalance ? formatUSDC(usycBalance as bigint) : "0.00"}
          loading={usycLoading}
          accent="emerald"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <QuickAction
          title="Freight Escrow"
          description="Create yield-bearing escrow for shipments"
          href="/escrow"
          icon="◈"
        />
        <QuickAction
          title="FX Settlement"
          description="Convert USDC ↔ EURC instantly"
          href="/settlement"
          icon="⬡"
        />
        <QuickAction
          title="Treasury"
          description="Manage yield allocation"
          href="/treasury"
          icon="◇"
        />
      </div>

      <div className="mt-8">
        <TransactionHistory />
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  suffix,
  highlight,
  loading,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
  loading?: boolean;
  accent?: "emerald" | "amber" | "blue";
}) {
  const accentClass = accent === "emerald" 
    ? "text-emerald-400" 
    : accent === "amber" 
      ? "text-amber-400" 
      : accent === "blue" 
        ? "text-blue-400" 
        : "";

  return (
    <div className="card">
      <p className="kpi-label mb-1">{label}</p>
      {loading ? (
        <Skeleton className="h-7 w-24 bg-neutral-800" />
      ) : (
        <p className={`kpi-value ${highlight ? "text-neutral-50" : ""} ${accentClass}`}>
          {value}
          {suffix && (
            <span className="text-neutral-500 text-sm ml-1">{suffix}</span>
          )}
        </p>
      )}
    </div>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <a href={href} className="card row-hover block">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-neutral-500">{icon}</span>
        <p className="text-sm font-medium text-neutral-200">{title}</p>
      </div>
      <p className="text-xs text-neutral-500">{description}</p>
    </a>
  );
}
