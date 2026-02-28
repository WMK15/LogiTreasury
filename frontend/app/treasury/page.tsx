"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ui/ConnectWallet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatUSDC,
  formatPercent,
  NETWORK_INFO,
} from "@/lib/config";
import { useTreasuryDashboard } from "@/hooks/useTreasury";
import { useNativeUSDCBalance, useUSDCBalance } from "@/hooks/useContracts";

export default function TreasuryPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  const { data: nativeBalance, isLoading: nativeLoading } = useNativeUSDCBalance(address);
  const { data: usdcBalance, isLoading: usdcLoading } = useUSDCBalance(address);
  const { 
    balanceSnapshot, 
    yieldMetrics, 
    isLoading: treasuryLoading 
  } = useTreasuryDashboard();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle SSR hydration
  if (!mounted) {
    return (
      <div className="pt-20">
        <p className="text-sm text-neutral-400">Loading wallet...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="pt-20">
        <p className="text-sm text-neutral-400 mb-4">
          Connect wallet to continue
        </p>
        <div className="mt-4">
          <ConnectWallet />
        </div>
        <div className="mt-8 text-xs text-neutral-500">
          <p>
            Network: {NETWORK_INFO.chainName} (Chain ID: {NETWORK_INFO.chainId})
          </p>
          <p>Mode: {NETWORK_INFO.mode}</p>
        </div>
      </div>
    );
  }

  const totalBalance = balanceSnapshot?.totalValue;
  const liquidBalance = balanceSnapshot?.liquidUsdc;
  const yieldingBalance = balanceSnapshot?.yieldBearingUsdc;
  const yieldAccrued = yieldMetrics?.unrealizedYield;
  const currentAPY = yieldMetrics?.currentAPY;
  
  // Calculate allocation percentage
  const yieldPercent = totalBalance && yieldingBalance 
    ? Number((yieldingBalance * 100n) / totalBalance) 
    : 0;

  const isLoading = treasuryLoading || nativeLoading || usdcLoading;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-neutral-100">Treasury</h1>
        <ConnectWallet />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="kpi-label mb-1">Total Balance</p>
          {treasuryLoading ? (
            <Skeleton className="h-7 w-28 bg-neutral-800" />
          ) : (
            <p className="kpi-value text-neutral-50">
              {totalBalance ? formatUSDC(totalBalance) : "0.00"}
              <span className="text-neutral-500 text-sm ml-1">USDC</span>
            </p>
          )}
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Liquid</p>
          {treasuryLoading ? (
            <Skeleton className="h-7 w-24 bg-neutral-800" />
          ) : (
            <p className="kpi-value">
              {liquidBalance ? formatUSDC(liquidBalance) : "0.00"}
            </p>
          )}
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Yield Accrued</p>
          {treasuryLoading ? (
            <Skeleton className="h-7 w-20 bg-neutral-800" />
          ) : (
            <p className="kpi-value text-emerald-400">
              +{yieldAccrued ? formatUSDC(yieldAccrued) : "0.00"}
            </p>
          )}
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Current APY</p>
          {treasuryLoading ? (
            <Skeleton className="h-7 w-16 bg-neutral-800" />
          ) : (
            <p className="kpi-value">
              {currentAPY ? formatPercent(Number(currentAPY)) : "—"}
            </p>
          )}
        </div>
      </div>

      {/* Wallet Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="kpi-label mb-1">Native USDC (Gas)</p>
          {nativeLoading ? (
            <Skeleton className="h-7 w-24 bg-neutral-800" />
          ) : (
            <p className="kpi-value">
              {nativeBalance ? Number(nativeBalance.formatted).toFixed(2) : "0.00"}
            </p>
          )}
        </div>
        <div className="card">
          <p className="kpi-label mb-1">ERC20 USDC (MockUSDC)</p>
          {usdcLoading ? (
            <Skeleton className="h-7 w-28 bg-neutral-800" />
          ) : (
            <p className="kpi-value">
              {usdcBalance ? formatUSDC(usdcBalance) : "0.00"}
            </p>
          )}
        </div>
      </div>

      {/* Allocation Bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            Allocation
          </p>
          {treasuryLoading ? (
            <Skeleton className="h-4 w-20 bg-neutral-800" />
          ) : (
            <p className="text-xs text-neutral-400">{yieldPercent}% in yield</p>
          )}
        </div>
        {treasuryLoading ? (
          <Skeleton className="h-2 w-full bg-neutral-800 rounded-full" />
        ) : (
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500/60 transition-all duration-300"
              style={{ width: `${yieldPercent}%` }}
            />
          </div>
        )}
        <div className="flex justify-between text-xs text-neutral-500 mt-2">
          <span>USDC (Liquid)</span>
          <span>USYC (Yielding)</span>
        </div>
      </div>

      {/* Connected Address */}
      <div className="card">
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
          Connected Wallet
        </p>
        <p className="text-sm text-neutral-300 font-mono">{address}</p>
      </div>
    </div>
  );
}
