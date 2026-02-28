"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  useUserBankAccounts,
  useDailyLimitsStatus,
  useAddBankAccount,
  useInitiateDeposit,
  useRequestWithdrawal,
} from "@/hooks";
import { formatUSDC } from "@/lib/config";
import { toast } from "sonner";

export default function FiatPage() {
  const { isConnected } = useAccount();

  const { data: bankAccounts } = useUserBankAccounts();
  const { data: limits } = useDailyLimitsStatus();

  const {
    addAccount,
    isPending: isAdding,
    isSuccess: isAddSuccess,
    error: addError,
  } = useAddBankAccount();
  const {
    initiate: deposit,
    isPending: isDepositing,
    isSuccess: isDepSuccess,
    error: depError,
  } = useInitiateDeposit();
  const {
    request: withdraw,
    isPending: isWithdrawing,
    isSuccess: isWithSuccess,
    error: withError,
  } = useRequestWithdrawal();

  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (isAddSuccess) toast.success("Bank account linked successfully!");
    if (addError) toast.error(`Failed to link account: ${addError.message}`);
  }, [isAddSuccess, addError]);

  useEffect(() => {
    if (isDepSuccess) toast.success("Fiat deposit initiated successfully!");
    if (depError) toast.error(`Deposit failed: ${depError.message}`);
  }, [isDepSuccess, depError]);

  useEffect(() => {
    if (isWithSuccess) toast.success("Fiat withdrawal requested!");
    if (withError) toast.error(`Withdrawal failed: ${withError.message}`);
  }, [isWithSuccess, withError]);

  if (!isConnected) {
    return (
      <div className="p-8">Please connect wallet to view fiat integration.</div>
    );
  }

  const handleDeposit = () => {
    if (bankAccounts && bankAccounts.length > 0) {
      deposit(bankAccounts[0], amount, "USD", "Deposit via CPN");
    }
  };

  const handleWithdrawal = () => {
    if (bankAccounts && bankAccounts.length > 0) {
      withdraw(bankAccounts[0], amount, "Withdraw via CPN");
    }
  };

  const hasBankAccount = bankAccounts && bankAccounts.length > 0;

  return (
    <div className="max-w-4xl max-h-screen overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Fiat Integration (CPN)</h1>
        <p className="text-neutral-400">
          Manage Circle Payments Network fiat on/off ramps.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card col-span-2 space-y-4">
          <h2 className="text-lg font-medium">Transact</h2>
          <div className="flex gap-4 border-b border-neutral-800 pb-2">
            <button
              className={`pb-2 px-2 text-sm ${activeTab === "deposit" ? "text-white border-b-2 border-white" : "text-neutral-500"}`}
              onClick={() => setActiveTab("deposit")}
            >
              Deposit (Fiat → USDC)
            </button>
            <button
              className={`pb-2 px-2 text-sm ${activeTab === "withdraw" ? "text-white border-b-2 border-white" : "text-neutral-500"}`}
              onClick={() => setActiveTab("withdraw")}
            >
              Withdraw (USDC → Fiat)
            </button>
          </div>

          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Bank Account
              </label>
              {hasBankAccount ? (
                <div className="p-3 border border-neutral-800 rounded bg-neutral-900 text-sm">
                  Primary Account Linked
                </div>
              ) : (
                <button
                  onClick={() =>
                    addAccount("Test Bank", "1234", "ROUTING", "USD", "US")
                  }
                  disabled={isAdding}
                  className="w-full text-sm py-3 border border-neutral-700 rounded hover:bg-neutral-800"
                >
                  {isAdding ? "Adding..." : "Link Bank Account"}
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white"
                placeholder="0.00"
              />
            </div>

            <button
              onClick={
                activeTab === "deposit" ? handleDeposit : handleWithdrawal
              }
              disabled={
                !hasBankAccount || !amount || isDepositing || isWithdrawing
              }
              className="w-full bg-white text-black font-medium py-3 rounded hover:bg-neutral-200 disabled:opacity-50"
            >
              {isDepositing || isWithdrawing
                ? "Processing..."
                : activeTab === "deposit"
                  ? "Initiate Deposit (Off-chain Wire)"
                  : "Request Withdrawal (USDC → Fiat)"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-sm font-medium mb-4">
              Daily Transaction Limits
            </h2>
            {limits ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Deposit Remaining</span>
                  <span>${formatUSDC(limits[0] as bigint)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Withdraw Remaining</span>
                  <span>${formatUSDC(limits[1] as bigint)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">Loading limits...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
