"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUSDC, formatEUR, CONTRACTS } from "@/lib/config";
import {
  useUSDCBalance,
  useEURCBalance,
  useCurrentFXRate,
  useQuoteUsdcToEurc,
  useApproveToken,
  useSettleUsdcToEurc,
  useSettlementHistory,
} from "@/hooks/useContracts";

export default function SettlementPage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: eurcBalance } = useEURCBalance(address);
  const { data: fxRate } = useCurrentFXRate();
  const { data: settlementIds } = useSettlementHistory(address);

  const amountBigInt = amount ? parseUnits(amount, 6) : undefined;
  const { data: quote } = useQuoteUsdcToEurc(amountBigInt);

  const { approve, isPending: isApproving, isSuccess: approved } = useApproveToken(CONTRACTS.usdc);
  const { settle, isPending: isSettling, isConfirming, isSuccess } = useSettleUsdcToEurc();

  const handleApprove = () => {
    if (amount) {
      approve(CONTRACTS.settlement, amount);
    }
  };

  const handleSettle = () => {
    if (amount && quote && address) {
      const minEurc = ((quote[0] * 99n) / 100n).toString(); // 1% slippage
      settle(amount, (Number(minEurc) / 1e6).toString(), address, reference || "Settlement");
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setAmount("");
      setReference("");
    }
  }, [isSuccess]);

  if (!isConnected) {
    return (
      <div className="pt-20">
        <p className="text-sm text-neutral-400 mb-4">Connect wallet to continue</p>
        <ConnectButton />
      </div>
    );
  }

  const rate = fxRate ? (Number(fxRate) / 1e18).toFixed(4) : "—";
  const expectedEurc = quote ? formatEUR(quote[0]) : "0.00";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-neutral-100">Euro Settlement</h1>
        <p className="text-xs text-neutral-500">
          EUR/USD: {rate}
        </p>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="kpi-label mb-1">USDC Balance</p>
          <p className="kpi-value">
            {usdcBalance ? formatUSDC(usdcBalance) : "0.00"}
          </p>
        </div>
        <div className="card">
          <p className="kpi-label mb-1">EURC Balance</p>
          <p className="kpi-value">
            {eurcBalance ? formatEUR(eurcBalance) : "0.00"}
          </p>
        </div>
      </div>

      {/* Swap Card */}
      <div className="card max-w-lg mb-6">
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-4">Convert USDC → EURC</p>

        <div className="space-y-4">
          <div>
            <label className="label">Amount (USDC)</label>
            <input
              type="number"
              placeholder="1000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input tabular-nums"
            />
          </div>

          {amount && (
            <div className="bg-neutral-800/50 rounded-md p-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">You receive</span>
                <span className="text-neutral-100 tabular-nums">{expectedEurc} EURC</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-neutral-600">Rate</span>
                <span className="text-neutral-500">1 USDC = {rate} EURC</span>
              </div>
            </div>
          )}

          <div>
            <label className="label">Reference (optional)</label>
            <input
              type="text"
              placeholder="Invoice #12345"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex gap-2">
            {!approved ? (
              <button
                onClick={handleApprove}
                disabled={!amount || isApproving}
                className="btn-secondary flex-1"
              >
                {isApproving ? "Approving..." : "Approve USDC"}
              </button>
            ) : (
              <button
                onClick={handleSettle}
                disabled={!amount || isSettling || isConfirming}
                className="btn-primary flex-1"
              >
                {isSettling || isConfirming ? "Settling..." : "Convert to EURC"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Settlement History</p>
        {settlementIds && settlementIds.length > 0 ? (
          <p className="text-sm text-neutral-400">{settlementIds.length} settlements</p>
        ) : (
          <p className="text-sm text-neutral-500">No settlements yet</p>
        )}
      </div>
    </div>
  );
}
