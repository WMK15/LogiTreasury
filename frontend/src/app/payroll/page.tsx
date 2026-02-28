"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUSDC, CONTRACTS } from "@/lib/config";
import {
  useUSDCBalance,
  useBatchCount,
  useTotalPaidUsdc,
  useInitiatorBatches,
  useApproveToken,
  useBatchPayUsdc,
} from "@/hooks/useContracts";

interface Recipient {
  wallet: string;
  amount: string;
  reference: string;
}

export default function PayrollPage() {
  const { address, isConnected } = useAccount();
  const [batchRef, setBatchRef] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([
    { wallet: "", amount: "", reference: "" }
  ]);

  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: batchCount } = useBatchCount();
  const { data: totalPaid } = useTotalPaidUsdc();
  const { data: myBatches } = useInitiatorBatches(address);

  const { approve, isPending: isApproving, isSuccess: approved } = useApproveToken(CONTRACTS.usdc);
  const { pay, isPending: isPaying, isConfirming, isSuccess } = useBatchPayUsdc();

  const addRecipient = () => {
    setRecipients([...recipients, { wallet: "", amount: "", reference: "" }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const totalAmount = recipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const handleApprove = () => {
    if (totalAmount > 0) {
      approve(CONTRACTS.batchPayroll, totalAmount.toString());
    }
  };

  const handlePay = () => {
    const formatted = recipients
      .filter(r => r.wallet && r.amount)
      .map(r => ({
        wallet: r.wallet as `0x${string}`,
        amount: parseUnits(r.amount, 6),
        reference: r.reference || "",
      }));
    
    if (formatted.length > 0) {
      pay(formatted, batchRef || `Batch-${Date.now()}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="pt-20">
        <p className="text-sm text-neutral-400 mb-4">Connect wallet to continue</p>
        <ConnectButton />
      </div>
    );
  }

  if (isSuccess) {
    setRecipients([{ wallet: "", amount: "", reference: "" }]);
    setBatchRef("");
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-neutral-100">Batch Payroll</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="kpi-label mb-1">Wallet Balance</p>
          <p className="kpi-value">{usdcBalance ? formatUSDC(usdcBalance) : "0"}</p>
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Total Batches</p>
          <p className="kpi-value">{batchCount?.toString() || "0"}</p>
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Total Paid</p>
          <p className="kpi-value">{totalPaid ? formatUSDC(totalPaid) : "0"}</p>
        </div>
      </div>

      {/* Batch Form */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">New Batch Payment</p>
          <button
            onClick={addRecipient}
            className="text-xs text-neutral-400 hover:text-neutral-200"
          >
            + Add Recipient
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {recipients.map((r, index) => (
            <div key={index} className="flex gap-2 items-center bg-neutral-800/30 p-2 rounded-md">
              <span className="text-neutral-600 text-xs w-4">{index + 1}</span>
              <input
                type="text"
                placeholder="0x..."
                value={r.wallet}
                onChange={(e) => updateRecipient(index, "wallet", e.target.value)}
                className="input flex-1 font-mono text-xs"
              />
              <input
                type="number"
                placeholder="Amount"
                value={r.amount}
                onChange={(e) => updateRecipient(index, "amount", e.target.value)}
                className="input w-28 tabular-nums"
              />
              <input
                type="text"
                placeholder="Reference"
                value={r.reference}
                onChange={(e) => updateRecipient(index, "reference", e.target.value)}
                className="input w-32"
              />
              {recipients.length > 1 && (
                <button
                  onClick={() => removeRecipient(index)}
                  className="text-neutral-500 hover:text-red-400 text-xs px-2"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Batch reference"
            value={batchRef}
            onChange={(e) => setBatchRef(e.target.value)}
            className="input w-48"
          />
          <p className="text-sm tabular-nums">
            Total: <span className="text-neutral-100">{totalAmount.toFixed(2)}</span> USDC
          </p>
        </div>

        <div className="flex gap-2">
          {!approved ? (
            <button
              onClick={handleApprove}
              disabled={totalAmount === 0 || isApproving}
              className="btn-secondary"
            >
              {isApproving ? "Approving..." : "Approve USDC"}
            </button>
          ) : (
            <button
              onClick={handlePay}
              disabled={totalAmount === 0 || isPaying || isConfirming}
              className="btn-primary"
            >
              {isPaying || isConfirming ? "Processing..." : "Execute Batch"}
            </button>
          )}
        </div>
      </div>

      {/* History */}
      {myBatches && myBatches.length > 0 && (
        <div className="card mt-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Your Batches</p>
          <p className="text-sm text-neutral-400">{myBatches.length} batches executed</p>
        </div>
      )}
    </div>
  );
}
