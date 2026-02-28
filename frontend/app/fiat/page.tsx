"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUSDC } from "@/lib/config";
import { useNativeUSDCBalance } from "@/hooks/useContracts";
import { toast } from "sonner";

// Demo mode - simulated bank account and limits
const DEMO_BANK_ACCOUNT = {
  id: "demo-account-001",
  bankName: "Deutsche Bank",
  accountNumber: "****4821",
  routingNumber: "DEUTDEFF",
  currency: "EUR",
  country: "DE",
  status: "verified",
};

const DEMO_LIMITS = {
  dailyDepositLimit: 100000000000n, // $100,000
  dailyWithdrawLimit: 50000000000n, // $50,000
  depositUsed: 0n,
  withdrawUsed: 0n,
};

export default function FiatPage() {
  const { address, isConnected } = useAccount();
  const { data: nativeBalance, isLoading: balanceLoading } = useNativeUSDCBalance(address);

  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Array<{
    id: string;
    type: "deposit" | "withdraw";
    amount: string;
    status: "pending" | "completed";
    timestamp: Date;
  }>>([]);

  if (!isConnected) {
    return (
      <div className="pt-20">
        <p className="text-sm text-neutral-400">
          Connect wallet to view fiat integration.
        </p>
      </div>
    );
  }

  const handleTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newTx = {
      id: `tx-${Date.now()}`,
      type: activeTab,
      amount,
      status: "completed" as const,
      timestamp: new Date(),
    };
    
    setTransactions(prev => [newTx, ...prev]);
    setAmount("");
    setIsProcessing(false);
    
    toast.success(
      activeTab === "deposit" 
        ? `Deposit of $${amount} initiated! Funds will arrive in 1-2 business days.`
        : `Withdrawal of $${amount} requested! Wire transfer initiated.`
    );
  };

  const depositRemaining = DEMO_LIMITS.dailyDepositLimit - DEMO_LIMITS.depositUsed;
  const withdrawRemaining = DEMO_LIMITS.dailyWithdrawLimit - DEMO_LIMITS.withdrawUsed;

  return (
    <div className="max-w-4xl">
      {/* Header with Demo Badge */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Fiat Integration (CPN)</h1>
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded">
            Demo Mode
          </span>
        </div>
        <p className="text-neutral-400">
          Circle Payments Network fiat on/off ramps for European logistics settlements.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Main Transaction Card */}
        <div className="card col-span-2 space-y-4">
          <h2 className="text-lg font-medium">Transact</h2>
          
          {/* Tabs */}
          <div className="flex gap-4 border-b border-neutral-800 pb-2">
            <button
              className={`pb-2 px-2 text-sm transition-colors ${
                activeTab === "deposit" 
                  ? "text-white border-b-2 border-emerald-500" 
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
              onClick={() => setActiveTab("deposit")}
            >
              Deposit (Fiat → USDC)
            </button>
            <button
              className={`pb-2 px-2 text-sm transition-colors ${
                activeTab === "withdraw" 
                  ? "text-white border-b-2 border-amber-500" 
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
              onClick={() => setActiveTab("withdraw")}
            >
              Withdraw (USDC → Fiat)
            </button>
          </div>

          <div className="space-y-4 pt-4">
            {/* Linked Bank Account */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Linked Bank Account
              </label>
              <div className="p-4 border border-neutral-800 rounded-lg bg-neutral-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 text-lg">🏦</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-200">
                        {DEMO_BANK_ACCOUNT.bankName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {DEMO_BANK_ACCOUNT.accountNumber} • {DEMO_BANK_ACCOUNT.routingNumber}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Amount ({activeTab === "deposit" ? "EUR" : "USDC"})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  {activeTab === "deposit" ? "€" : "$"}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 pl-8 text-white text-lg tabular-nums"
                  placeholder="0.00"
                />
              </div>
              {amount && (
                <p className="text-xs text-neutral-500 mt-1">
                  {activeTab === "deposit" 
                    ? `≈ $${(parseFloat(amount) * 1.08).toFixed(2)} USDC (estimated)`
                    : `≈ €${(parseFloat(amount) * 0.92).toFixed(2)} EUR (estimated)`
                  }
                </p>
              )}
            </div>

            {/* Transaction Button */}
            <button
              onClick={handleTransaction}
              disabled={!amount || isProcessing}
              className={`w-full font-medium py-3 rounded-lg transition-colors disabled:opacity-50 ${
                activeTab === "deposit"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-amber-600 hover:bg-amber-500 text-white"
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : activeTab === "deposit" ? (
                "Initiate Deposit (Wire Transfer)"
              ) : (
                "Request Withdrawal (1-2 days)"
              )}
            </button>

            {/* Info Note */}
            <p className="text-xs text-neutral-500 text-center">
              {activeTab === "deposit"
                ? "Wire transfers typically settle within 1-2 business days."
                : "Withdrawals are processed same-day for verified accounts."
              }
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Wallet Balance */}
          <div className="card">
            <h2 className="text-sm font-medium mb-3">Wallet Balance</h2>
            {balanceLoading ? (
              <Skeleton className="h-8 w-28 bg-neutral-800" />
            ) : (
              <p className="text-2xl font-bold text-neutral-100">
                {nativeBalance ? Number(nativeBalance.formatted).toFixed(2) : "0.00"}
                <span className="text-sm font-normal text-neutral-500 ml-1">USDC</span>
              </p>
            )}
          </div>

          {/* Daily Limits */}
          <div className="card">
            <h2 className="text-sm font-medium mb-4">Daily Limits</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-neutral-400">Deposit</span>
                  <span className="text-emerald-400">${formatUSDC(depositRemaining)}</span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/60 w-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-neutral-400">Withdraw</span>
                  <span className="text-amber-400">${formatUSDC(withdrawRemaining)}</span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500/60 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* CPN Info */}
          <div className="card bg-blue-500/5 border-blue-500/20">
            <h2 className="text-sm font-medium mb-2 text-blue-400">Circle CPN</h2>
            <p className="text-xs text-neutral-400">
              Circle Payments Network enables instant fiat↔USDC conversions with institutional-grade compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-neutral-800/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    tx.type === "deposit" 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {tx.type === "deposit" ? "↓" : "↑"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-200">
                      {tx.type === "deposit" ? "Fiat Deposit" : "Fiat Withdrawal"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {tx.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    tx.type === "deposit" ? "text-emerald-400" : "text-neutral-100"
                  }`}>
                    {tx.type === "deposit" ? "+" : "-"}${tx.amount}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
