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

const statusClasses: Record<PayrollStatus, string> = {
  [PayrollStatus.ACTIVE]: "status-active",
  [PayrollStatus.DISPUTED]: "status-disputed",
  [PayrollStatus.COMPLETED]: "status-completed",
  [PayrollStatus.CANCELLED]: "status-cancelled",
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
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-6 bg-gray-700 rounded w-1/2"></div>
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

  return (
    <div className="card">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-400">Payroll #{payrollId.toString()}</span>
            <span className={statusClasses[payroll.status as PayrollStatus]}>
              {statusLabels[payroll.status as PayrollStatus]}
            </span>
            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
              {isVesting ? "Vesting" : "Milestone"}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {role === "employer" ? (
              <>To: <code className="text-xs">{payroll.employee}</code></>
            ) : (
              <>From: <code className="text-xs">{payroll.employer}</code></>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            ${formatUnits(payroll.totalAmount, USDC_DECIMALS)}
          </p>
          <p className="text-sm text-gray-400">
            Claimed: ${formatUnits(payroll.claimedAmount, USDC_DECIMALS)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Milestones (if milestone-based) */}
      {!isVesting && milestones && milestones.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Milestones</p>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm bg-gray-800 p-2 rounded"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      m.approved
                        ? "bg-green-500"
                        : m.completed
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    }`}
                  />
                  <span>{m.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">
                    ${formatUnits(m.amount, USDC_DECIMALS)}
                  </span>
                  {/* Employee: Mark Complete */}
                  {role === "employee" && !m.completed && payroll.status === PayrollStatus.ACTIVE && (
                    <button
                      onClick={() => markComplete(payrollId, BigInt(i))}
                      disabled={isMarking}
                      className="text-xs btn-secondary py-1 px-2"
                    >
                      Complete
                    </button>
                  )}
                  {/* Employer: Approve */}
                  {role === "employer" && m.completed && !m.approved && payroll.status === PayrollStatus.ACTIVE && (
                    <button
                      onClick={() => approveMilestone(payrollId, BigInt(i))}
                      disabled={isApproving}
                      className="text-xs btn-primary py-1 px-2"
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
      <div className="flex gap-2 flex-wrap">
        {/* Employee: Claim */}
        {role === "employee" && claimable && claimable > 0n && payroll.status === PayrollStatus.ACTIVE && (
          <button
            onClick={handleClaim}
            disabled={isClaimingVested || isClaimingMilestone}
            className="btn-primary"
          >
            Claim ${formatUnits(claimable, USDC_DECIMALS)} USDC
          </button>
        )}

        {/* Employer: Raise Dispute */}
        {role === "employer" && payroll.status === PayrollStatus.ACTIVE && (
          <button
            onClick={() => raiseDispute(payrollId)}
            disabled={isDisputing}
            className="btn-danger"
          >
            Raise Dispute
          </button>
        )}
      </div>
    </div>
  );
}
