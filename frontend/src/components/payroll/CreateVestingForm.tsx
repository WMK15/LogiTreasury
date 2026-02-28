"use client";

import { useState } from "react";
import { useCreateVestingPayroll } from "@/hooks/usePayrollArena";
import { TIME } from "@/lib/config";

interface Props {
  onSuccess: () => void;
}

export function CreateVestingForm({ onSuccess }: Props) {
  const [formData, setFormData] = useState({
    employee: "",
    amount: "",
    startDate: "",
    endDate: "",
    cliffDays: 7,
    disputeWindowDays: 1,
  });

  const { createPayroll, isPending, isConfirming, isSuccess, error } =
    useCreateVestingPayroll();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startTime = Math.floor(new Date(formData.startDate).getTime() / 1000);
    const endTime = Math.floor(new Date(formData.endDate).getTime() / 1000);

    createPayroll({
      employee: formData.employee as `0x${string}`,
      amount: formData.amount,
      startTime,
      endTime,
      cliffDuration: formData.cliffDays * TIME.ONE_DAY,
      disputeWindow: formData.disputeWindowDays * TIME.ONE_DAY,
    });
  };

  // Reset form on success
  if (isSuccess) {
    onSuccess();
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-6">Create Vesting Payroll</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Employee Address */}
        <div>
          <label className="label">Employee Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={formData.employee}
            onChange={(e) =>
              setFormData({ ...formData, employee: e.target.value })
            }
            className="input"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="label">Total Amount (USDC)</label>
          <input
            type="number"
            placeholder="1000"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="input"
            required
            min="0"
            step="0.01"
          />
        </div>

        {/* Dates */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Vesting Start Date</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Vesting End Date</label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="input"
              required
            />
          </div>
        </div>

        {/* Cliff & Dispute */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Cliff Period (Days)</label>
            <input
              type="number"
              value={formData.cliffDays}
              onChange={(e) =>
                setFormData({ ...formData, cliffDays: parseInt(e.target.value) })
              }
              className="input"
              min="0"
              max="365"
            />
            <p className="text-xs text-gray-500 mt-1">
              No funds claimable until cliff ends
            </p>
          </div>
          <div>
            <label className="label">Dispute Window (Days)</label>
            <input
              type="number"
              value={formData.disputeWindowDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  disputeWindowDays: parseInt(e.target.value),
                })
              }
              className="input"
              min="1"
              max="30"
            />
            <p className="text-xs text-gray-500 mt-1">1-30 days allowed</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
            {error.message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="btn-primary w-full"
        >
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
            ? "Creating Payroll..."
            : "Create Vesting Payroll"}
        </button>
      </form>
    </div>
  );
}
