"use client";

import { useState } from "react";
import { useCreateMilestonePayroll } from "@/hooks/usePayrollArena";
import { TIME } from "@/lib/config";

interface Props {
  onSuccess: () => void;
}

interface MilestoneInput {
  description: string;
  amount: string;
}

export function CreateMilestoneForm({ onSuccess }: Props) {
  const [employee, setEmployee] = useState("");
  const [disputeWindowDays, setDisputeWindowDays] = useState(1);
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: "", amount: "" },
  ]);

  const { createPayroll, isPending, isConfirming, isSuccess, error } =
    useCreateMilestonePayroll();

  const addMilestone = () => {
    if (milestones.length < 20) {
      setMilestones([...milestones, { description: "", amount: "" }]);
    }
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (
    index: number,
    field: keyof MilestoneInput,
    value: string
  ) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const totalAmount = milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const descriptions = milestones.map((m) => m.description);
    const amounts = milestones.map((m) => m.amount);

    createPayroll({
      employee: employee as `0x${string}`,
      totalAmount: totalAmount.toString(),
      descriptions,
      amounts,
      disputeWindow: disputeWindowDays * TIME.ONE_DAY,
    });
  };

  if (isSuccess) {
    onSuccess();
  }

  return (
    <div className="card">
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-4">New Milestone Payroll</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Employee</label>
          <input
            type="text"
            placeholder="0x..."
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            className="input font-mono"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="label mb-0">Milestones</label>
            <button
              type="button"
              onClick={addMilestone}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              + Add
            </button>
          </div>

          <div className="space-y-2">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="flex gap-2 items-center bg-neutral-800/50 p-2 rounded-md"
              >
                <span className="text-neutral-600 text-xs w-4">{index + 1}</span>
                <input
                  type="text"
                  placeholder="Description"
                  value={milestone.description}
                  onChange={(e) =>
                    updateMilestone(index, "description", e.target.value)
                  }
                  className="input flex-1"
                  required
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={milestone.amount}
                  onChange={(e) =>
                    updateMilestone(index, "amount", e.target.value)
                  }
                  className="input w-28 tabular-nums"
                  required
                  min="0"
                  step="0.01"
                />
                {milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="text-neutral-500 hover:text-red-400 transition-colors text-xs px-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="text-right mt-2 text-sm tabular-nums">
            <span className="text-neutral-500">Total:</span>{" "}
            <span className="text-neutral-200">{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <label className="label">Dispute window (days)</label>
          <input
            type="number"
            value={disputeWindowDays}
            onChange={(e) => setDisputeWindowDays(parseInt(e.target.value))}
            className="input w-24 tabular-nums"
            min="1"
            max="30"
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">
            {error.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || isConfirming || totalAmount === 0}
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
