"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ui/ConnectWallet";
import {
  formatUSDC,
  formatPercent,
  CONTRACTS,
  NETWORK_INFO,
} from "@/lib/config";

export default function TreasuryPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

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
          <p className="kpi-value text-neutral-50">
            0.00
            <span className="text-neutral-500 text-sm ml-1">USDC</span>
          </p>
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Liquid</p>
          <p className="kpi-value">0.00</p>
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Yield Accrued</p>
          <p className="kpi-value text-emerald-400">+0.00</p>
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Current APY</p>
          <p className="kpi-value">--</p>
        </div>
      </div>

      {/* Allocation Bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            Allocation
          </p>
          <p className="text-xs text-neutral-400">0% in yield</p>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500/60 transition-all duration-300"
            style={{ width: "0%" }}
          />
        </div>
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
