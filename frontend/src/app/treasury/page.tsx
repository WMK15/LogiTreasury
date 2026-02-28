"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUSDC, formatPercent, CONTRACTS } from "@/lib/config";
import {
  useUSDCBalance,
  useTreasuryBalance,
  useTreasuryUsdcBalance,
  useTreasuryUsycShares,
  useTreasuryYield,
  useTreasuryAPY,
  useApproveToken,
  useDepositToTreasury,
  useWithdrawFromTreasury,
} from "@/hooks/useContracts";

export default function TreasuryPage() {
  const { address, isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: walletBalance } = useUSDCBalance(address);
  const { data: totalBalance } = useTreasuryBalance();
  const { data: liquidBalance } = useTreasuryUsdcBalance();
  const { data: usycShares } = useTreasuryUsycShares();
  const { data: yieldAccrued } = useTreasuryYield();
  const { data: apy } = useTreasuryAPY();

  const { approve, isPending: isApproving, isSuccess: approved } = useApproveToken(CONTRACTS.usdc);
  const { deposit, isPending: isDepositing, isConfirming: isDepositConfirming } = useDepositToTreasury();
  const { withdraw, isPending: isWithdrawing, isConfirming: isWithdrawConfirming } = useWithdrawFromTreasury();

  if (!isConnected) {
    return (
      <div className="pt-20">
        <p className="text-sm text-neutral-400 mb-4">Connect wallet to continue</p>
        <ConnectButton />
      </div>
    );
  }

  const handleApprove = () => {
    if (depositAmount) {
      approve(CONTRACTS.treasury, depositAmount);
    }
  };

  const handleDeposit = () => {
    if (depositAmount) {
      deposit(depositAmount);
      setDepositAmount("");
    }
  };

  const handleWithdraw = () => {
    if (withdrawAmount && address) {
      withdraw(withdrawAmount, address);
      setWithdrawAmount("");
    }
  };

  const yieldingPct = totalBalance && totalBalance > 0n && usycShares
    ? Number((usycShares * 100n) / totalBalance)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-neutral-100">Treasury</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="kpi-label mb-1">Total Balance</p>
          <p className="kpi-value text-neutral-50">
            {totalBalance ? formatUSDC(totalBalance) : "0.00"}
            <span className="text-neutral-500 text-sm ml-1">USDC</span>
          </p>
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Liquid</p>
          <p className="kpi-value">
            {liquidBalance ? formatUSDC(liquidBalance) : "0.00"}
          </p>
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Yield Accrued</p>
          <p className="kpi-value text-emerald-400">
            +{yieldAccrued ? formatUSDC(yieldAccrued) : "0.00"}
          </p>
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Current APY</p>
          <p className="kpi-value">
            {apy ? formatPercent(Number(apy)) : "—"}
          </p>
        </div>
      </div>

      {/* Allocation Bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Allocation</p>
          <p className="text-xs text-neutral-400">{yieldingPct}% in yield</p>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500/60 transition-all duration-300"
            style={{ width: `${yieldingPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-neutral-500 mt-2">
          <span>USDC (Liquid)</span>
          <span>USYC (Yielding)</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        {/* Deposit */}
        <div className="card">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Deposit</p>
          <p className="text-xs text-neutral-400 mb-2">
            Wallet: {walletBalance ? formatUSDC(walletBalance) : "0"} USDC
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="input flex-1 tabular-nums"
            />
            {!approved ? (
              <button
                onClick={handleApprove}
                disabled={!depositAmount || isApproving}
                className="btn-secondary"
              >
                {isApproving ? "..." : "Approve"}
              </button>
            ) : (
              <button
                onClick={handleDeposit}
                disabled={!depositAmount || isDepositing || isDepositConfirming}
                className="btn-primary"
              >
                {isDepositing || isDepositConfirming ? "..." : "Deposit"}
              </button>
            )}
          </div>
        </div>

        {/* Withdraw */}
        <div className="card">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Withdraw</p>
          <p className="text-xs text-neutral-400 mb-2">
            Available: {totalBalance ? formatUSDC(totalBalance) : "0"} USDC
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="input flex-1 tabular-nums"
            />
            <button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || isWithdrawing || isWithdrawConfirming}
              className="btn-secondary"
            >
              {isWithdrawing || isWithdrawConfirming ? "..." : "Withdraw"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
