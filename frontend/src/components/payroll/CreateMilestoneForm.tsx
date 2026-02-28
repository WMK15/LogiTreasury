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
      <h2 className="text-xl font-semibold mb-6">Create Milestone Payroll</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Employee Address */}
        <div>
          <label className="label">Employee Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            className="input"
            required
          />
        </div>

        {/* Milestones */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="label mb-0">Milestones</label>
            <button
              type="button"
              onClick={addMilestone}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              + Add Milestone
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="flex gap-3 items-start bg-gray-800 p-3 rounded-lg"
              >
                <span className="text-gray-500 text-sm mt-2">#{index + 1}</span>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Milestone description"
                    value={milestone.description}
                    onChange={(e) =>
                      updateMilestone(index, "description", e.target.value)
                    }
                    className="input mb-2"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Amount (USDC)"
                    value={milestone.amount}
                    onChange={(e) =>
                      updateMilestone(index, "amount", e.target.value)
                    }
                    className="input"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                {milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="text-red-400 hover:text-red-300 mt-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="text-right mt-2 text-sm">
            Total:{" "}
            <span className="font-semibold text-primary-400">
              ${totalAmount.toFixed(2)} USDC
            </span>
          </div>
        </div>

        {/* Dispute Window */}
        <div>
          <label className="label">Dispute Window (Days)</label>
          <input
            type="number"
            value={disputeWindowDays}
            onChange={(e) => setDisputeWindowDays(parseInt(e.target.value))}
            className="input"
            min="1"
            max="30"
          />
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
          disabled={isPending || isConfirming || totalAmount === 0}
          className="btn-primary w-full"
        >
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
            ? "Creating Payroll..."
            : "Create Milestone Payroll"}
        </button>
      </form>
    </div>
  );
}
