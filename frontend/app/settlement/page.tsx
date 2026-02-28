"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { ConnectWallet } from "@/components/ui/ConnectWallet";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useStableFXRates, useStableFXQuote } from "@/hooks/useFX";

export default function SettlementPage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const { data: usdcBalance, isLoading: usdcLoading } = useUSDCBalance(address);
  const { data: eurcBalance, isLoading: eurcLoading } = useEURCBalance(address);
  const { data: fxRate, isLoading: rateLoading } = useCurrentFXRate();
  const { data: settlementIds, isLoading: historyLoading } = useSettlementHistory(address);

  // StableFX live rates
  const { data: stableFXData, isLoading: stableFXLoading, dataUpdatedAt } = useStableFXRates();
  const { data: stableFXQuote } = useStableFXQuote('USDC', 'EURC', amount || undefined);

  const amountBigInt = amount ? parseUnits(amount, 6) : undefined;
  const { data: quote } = useQuoteUsdcToEurc(amountBigInt);

  const {
    approve,
    isPending: isApproving,
    isSuccess: approved,
  } = useApproveToken(CONTRACTS.usdc);
  const {
    settle,
    isPending: isSettling,
    isConfirming,
    isSuccess,
  } = useSettleUsdcToEurc();

  const handleApprove = () => {
    if (amount) {
      approve(CONTRACTS.settlement, amount);
    }
  };

  const handleSettle = () => {
    if (amount && quote && address) {
      const minEurc = ((quote[0] * 99n) / 100n).toString(); // 1% slippage
      settle(
        amount,
        (Number(minEurc) / 1e6).toString(),
        address,
        reference || "Settlement",
      );
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
        <p className="text-sm text-neutral-400 mb-4">
          Connect wallet to continue
        </p>
        <ConnectWallet />
      </div>
    );
  }

  // Use StableFX rate if available, fallback to on-chain rate
  const stableFXRate = stableFXData?.data?.rates?.USDC_EURC?.rate;
  const rate = stableFXRate || (fxRate ? (Number(fxRate) / 1e18).toFixed(4) : "—");
  const isDemoMode = stableFXData?.data?.isDemoMode;
  const provider = stableFXData?.data?.provider || 'On-chain';
  
  // Use StableFX quote if available
  const expectedEurc = stableFXQuote?.data?.targetAmount 
    ? parseFloat(stableFXQuote.data.targetAmount).toFixed(2)
    : quote ? formatEUR(quote[0]) : "0.00";

  // Calculate time since last update
  const lastUpdateSecs = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1000) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-neutral-100">
          Euro Settlement
        </h1>
        <div className="flex items-center gap-3">
          {/* Live Rate Indicator */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stableFXLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-xs text-neutral-500">
              {stableFXLoading ? 'Updating...' : `Live ${lastUpdateSecs}s ago`}
            </span>
          </div>
          {rateLoading && !stableFXRate ? (
            <Skeleton className="h-4 w-24 bg-neutral-800" />
          ) : (
            <p className="text-xs text-neutral-400">
              EUR/USD: <span className="text-neutral-100 font-medium">{rate}</span>
            </p>
          )}
        </div>
      </div>

      {/* StableFX Provider Banner */}
      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg px-4 py-2 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">⬡</span>
          <p className="text-sm text-blue-300">
            Powered by <span className="font-medium">{provider}</span>
            {isDemoMode && <span className="text-blue-400/60 ml-2">(Demo Mode)</span>}
          </p>
        </div>
        <p className="text-xs text-blue-400/60">
          Spread: {stableFXData?.data?.rates?.USDC_EURC?.spread || '0.15%'}
        </p>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="kpi-label mb-1">USDC Balance</p>
          {usdcLoading ? (
            <Skeleton className="h-7 w-28 bg-neutral-800" />
          ) : (
            <p className="kpi-value">
              {usdcBalance ? formatUSDC(usdcBalance) : "0.00"}
            </p>
          )}
        </div>
        <div className="card">
          <p className="kpi-label mb-1">EURC Balance</p>
          {eurcLoading ? (
            <Skeleton className="h-7 w-28 bg-neutral-800" />
          ) : (
            <p className="kpi-value">
              {eurcBalance ? formatEUR(eurcBalance) : "0.00"}
            </p>
          )}
        </div>
      </div>

      {/* Swap Card */}
      <div className="card max-w-lg mb-6">
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-4">
          Convert USDC → EURC
        </p>

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
                <span className="text-neutral-100 tabular-nums font-medium">
                  {expectedEurc} EURC
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-neutral-600">Rate</span>
                <span className="text-neutral-500">1 USDC = {rate} EURC</span>
              </div>
              {stableFXQuote?.data?.expiresAt && (
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-neutral-600">Quote expires</span>
                  <QuoteCountdown expiresAt={stableFXQuote.data.expiresAt} />
                </div>
              )}
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
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">
          Settlement History
        </p>
        {historyLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-neutral-800" />
            <Skeleton className="h-4 w-24 bg-neutral-800" />
          </div>
        ) : settlementIds && settlementIds.length > 0 ? (
          <p className="text-sm text-neutral-400">
            {settlementIds.length} settlements
          </p>
        ) : (
          <p className="text-sm text-neutral-500">No settlements yet</p>
        )}
      </div>
    </div>
  );
}

// Quote expiration countdown component
function QuoteCountdown({ expiresAt }: { expiresAt: string }) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const updateCountdown = () => {
      const expiry = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setSecondsLeft(diff);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (secondsLeft <= 0) {
    return <span className="text-red-400">Expired</span>;
  }

  return (
    <span className={`tabular-nums ${secondsLeft <= 10 ? 'text-amber-400' : 'text-neutral-500'}`}>
      {secondsLeft}s
    </span>
  );
}
