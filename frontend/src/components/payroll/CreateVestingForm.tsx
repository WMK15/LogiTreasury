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

  if (isSuccess) {
    onSuccess();
  }

  return (
    <div className="card">
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-4">New Vesting Payroll</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Employee</label>
          <input
            type="text"
            placeholder="0x..."
            value={formData.employee}
            onChange={(e) =>
              setFormData({ ...formData, employee: e.target.value })
            }
            className="input font-mono"
            required
          />
        </div>

        <div>
          <label className="label">Amount</label>
          <input
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="input tabular-nums"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start</label>
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
            <label className="label">End</label>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cliff (days)</label>
            <input
              type="number"
              value={formData.cliffDays}
              onChange={(e) =>
                setFormData({ ...formData, cliffDays: parseInt(e.target.value) })
              }
              className="input tabular-nums"
              min="0"
              max="365"
            />
          </div>
          <div>
            <label className="label">Dispute window (days)</label>
            <input
              type="number"
              value={formData.disputeWindowDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  disputeWindowDays: parseInt(e.target.value),
                })
              }
              className="input tabular-nums"
              min="1"
              max="30"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">
            {error.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="btn-primary w-full"
        >
          {isPending
            ? "Confirm..."
            : isConfirming
            ? "Creating..."
            : "Create"}
        </button>
      </form>
    </div>
  );
}
