"use client";

import { formatUnits } from "viem";
import {
  usePayroll,
  useMilestones,
  useClaimableAmount,
  useClaimVestedFunds,
  useClaimMilestoneFunds,
  useMarkMilestoneComplete,
  useApproveMilestone,
  useRaiseDispute,
} from "@/hooks/usePayrollArena";
import { PayrollStatus, PayrollType } from "@/types";
import { USDC_DECIMALS } from "@/lib/config";

interface Props {
  payrollId: bigint;
  role: "employer" | "employee";
}

const statusLabels: Record<PayrollStatus, string> = {
  [PayrollStatus.ACTIVE]: "Active",
  [PayrollStatus.DISPUTED]: "Disputed",
  [PayrollStatus.COMPLETED]: "Completed",
  [PayrollStatus.CANCELLED]: "Cancelled",
};

export function PayrollCard({ payrollId, role }: Props) {
  const { data: payroll, isLoading } = usePayroll(payrollId);
  const { data: milestones } = useMilestones(payrollId);
  const { data: claimable } = useClaimableAmount(payrollId);

  const { claim: claimVested, isPending: isClaimingVested } = useClaimVestedFunds();
  const { claim: claimMilestone, isPending: isClaimingMilestone } = useClaimMilestoneFunds();
  const { markComplete, isPending: isMarking } = useMarkMilestoneComplete();
  const { approve: approveMilestone, isPending: isApproving } = useApproveMilestone();
  const { raiseDispute, isPending: isDisputing } = useRaiseDispute();

  if (isLoading || !payroll) {
    return (
      <div className="card">
        <div className="h-4 skeleton w-24 mb-2" />
        <div className="h-4 skeleton w-16" />
      </div>
    );
  }

  const isVesting = payroll.payrollType === PayrollType.VESTING;
  const progress = Number(payroll.claimedAmount * 100n / payroll.totalAmount);

  const handleClaim = () => {
    if (isVesting) {
      claimVested(payrollId);
    } else {
      claimMilestone(payrollId);
    }
  };

  const statusClass = {
    [PayrollStatus.ACTIVE]: "status-active",
    [PayrollStatus.DISPUTED]: "status-disputed",
    [PayrollStatus.COMPLETED]: "status-completed",
    [PayrollStatus.CANCELLED]: "status-cancelled",
  }[payroll.status as PayrollStatus];

  return (
    <div className="card">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-400">#{payrollId.toString()}</span>
          <span className={statusClass}>
            {statusLabels[payroll.status as PayrollStatus]}
          </span>
          <span className="text-xs text-neutral-600">
            {isVesting ? "Vesting" : "Milestone"}
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium tabular-nums">
            {formatUnits(payroll.totalAmount, USDC_DECIMALS)}
          </span>
          <span className="text-neutral-500 text-sm ml-1">USDC</span>
        </div>
      </div>

      {/* Address */}
      <div className="text-xs text-neutral-500 mb-4 font-mono truncate">
        {role === "employer" ? payroll.employee : payroll.employer}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-neutral-500 mb-1">
          <span>Progress</span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-neutral-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-neutral-500 mt-1 tabular-nums">
          {formatUnits(payroll.claimedAmount, USDC_DECIMALS)} claimed
        </div>
      </div>

      {/* Milestones */}
      {!isVesting && milestones && milestones.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Milestones</p>
          <div className="space-y-1">
            {milestones.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-neutral-800/50 row-hover"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      m.approved
                        ? "bg-emerald-500"
                        : m.completed
                        ? "bg-amber-500"
                        : "bg-neutral-600"
                    }`}
                  />
                  <span className="text-sm text-neutral-300 truncate">{m.description}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-neutral-500 tabular-nums">
                    {formatUnits(m.amount, USDC_DECIMALS)}
                  </span>
                  {role === "employee" && !m.completed && payroll.status === PayrollStatus.ACTIVE && (
                    <button
                      onClick={() => markComplete(payrollId, BigInt(i))}
                      disabled={isMarking}
                      className="btn-ghost text-xs h-6 px-2"
                    >
                      Done
                    </button>
                  )}
                  {role === "employer" && m.completed && !m.approved && payroll.status === PayrollStatus.ACTIVE && (
                    <button
                      onClick={() => approveMilestone(payrollId, BigInt(i))}
                      disabled={isApproving}
                      className="btn-secondary text-xs h-6 px-2"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {role === "employee" && claimable && claimable > 0n && payroll.status === PayrollStatus.ACTIVE && (
          <button
            onClick={handleClaim}
            disabled={isClaimingVested || isClaimingMilestone}
            className="btn-primary"
          >
            Claim {formatUnits(claimable, USDC_DECIMALS)}
          </button>
        )}

        {role === "employer" && payroll.status === PayrollStatus.ACTIVE && (
          <button
            onClick={() => raiseDispute(payrollId)}
            disabled={isDisputing}
            className="btn-danger"
          >
            Dispute
          </button>
        )}
      </div>
    </div>
  );
}
