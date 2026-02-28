"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUSDC, formatPercent } from "@/lib/config";
import {
  useUSDCBalance,
  useEURCBalance,
  useTreasuryBalance,
  useTreasuryYield,
  useTreasuryAPY,
  useEscrowCount,
  useBatchCount,
  useCurrentFXRate,
} from "@/hooks/useContracts";

export default function Overview() {
  const { address, isConnected } = useAccount();

  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: eurcBalance } = useEURCBalance(address);
  const { data: treasuryBalance } = useTreasuryBalance();
  const { data: treasuryYield } = useTreasuryYield();
  const { data: apy } = useTreasuryAPY();
  const { data: escrowCount } = useEscrowCount();
  const { data: batchCount } = useBatchCount();
  const { data: fxRate } = useCurrentFXRate();

  if (!isConnected) {
    return (
      <div className="pt-20">
        <h1 className="text-lg font-medium mb-2">LogiTreasury</h1>
        <p className="text-sm text-neutral-500 mb-6">
          European logistics treasury and settlement platform
        </p>
        <ConnectButton />
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
            year: "numeric" 
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
        />
        <KPI 
          label="Yield Accrued" 
          value={treasuryYield ? formatUSDC(treasuryYield) : "0.00"} 
          suffix="USDC"
        />
        <KPI 
          label="Current APY" 
          value={apy ? formatPercent(Number(apy)) : "—"}
        />
        <KPI 
          label="EUR/USD Rate" 
          value={fxRate ? (Number(fxRate) / 1e18).toFixed(4) : "—"}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KPI 
          label="Wallet USDC" 
          value={usdcBalance ? formatUSDC(usdcBalance) : "0.00"} 
        />
        <KPI 
          label="Wallet EURC" 
          value={eurcBalance ? formatUSDC(eurcBalance) : "0.00"} 
        />
        <KPI 
          label="Active Escrows" 
          value={escrowCount?.toString() || "0"} 
        />
        <KPI 
          label="Payroll Batches" 
          value={batchCount?.toString() || "0"} 
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
    </div>
  );
}

function KPI({ 
  label, 
  value, 
  suffix,
  highlight 
}: { 
  label: string; 
  value: string; 
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="card">
      <p className="kpi-label mb-1">{label}</p>
      <p className={`kpi-value ${highlight ? "text-neutral-50" : ""}`}>
        {value}
        {suffix && <span className="text-neutral-500 text-sm ml-1">{suffix}</span>}
      </p>
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
    <a 
      href={href}
      className="card row-hover block"
    >
      <p className="text-sm font-medium text-neutral-200 mb-1">{title}</p>
      <p className="text-xs text-neutral-500">{description}</p>
    </a>
  );
}
