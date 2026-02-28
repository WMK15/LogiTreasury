"use client";

import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ui/ConnectWallet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUSDC, formatPercent } from "@/lib/config";
import {
  useNativeUSDCBalance,
  useUSDCBalance,
  useEURCBalance,
  useEscrowCount,
  useBatchCount,
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
  const { balanceSnapshot, yieldMetrics, isLoading: treasuryLoading } = useTreasuryDashboard();
  const { data: escrowCount, isLoading: escrowLoading } = useEscrowCount();
  const { data: batchCount, isLoading: batchLoading } = useBatchCount();
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
          label="Yield Accrued"
          value={treasuryYield ? formatUSDC(treasuryYield) : "0.00"}
          suffix="USDC"
          loading={treasuryLoading}
        />
        <KPI
          label="Current APY"
          value={apy ? formatPercent(Number(apy)) : "—"}
          loading={treasuryLoading}
        />
        <KPI
          label="EUR/USD Rate"
          value={fxRate ? (Number(fxRate) / 1e18).toFixed(4) : "—"}
          loading={ratesLoading}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <KPI
          label="Native USDC"
          value={nativeBalance ? Number(nativeBalance.formatted).toFixed(2) : "0.00"}
          highlight
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
          label="Active Escrows" 
          value={escrowCount?.toString() || "0"} 
          loading={escrowLoading}
        />
        <KPI 
          label="Payroll Batches" 
          value={batchCount?.toString() || "0"} 
          loading={batchLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <QuickAction
          title="Freight Escrow"
          description="Create escrow for high-value shipments with yield accrual"
          href="/escrow"
        />
        <QuickAction
          title="Euro Settlement"
          description="Convert USDC to EURC for European payments"
          href="/settlement"
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
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="card">
      <p className="kpi-label mb-1">{label}</p>
      {loading ? (
        <Skeleton className="h-7 w-24 bg-neutral-800" />
      ) : (
        <p className={`kpi-value ${highlight ? "text-neutral-50" : ""}`}>
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
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a href={href} className="card row-hover block">
      <p className="text-sm font-medium text-neutral-200 mb-1">{title}</p>
      <p className="text-xs text-neutral-500">{description}</p>
    </a>
  );
}
