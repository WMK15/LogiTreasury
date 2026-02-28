"use client";

import { PayrollCard } from "./PayrollCard";

interface Props {
  payrollIds: readonly bigint[];
  role: "employer" | "employee";
}

export function PayrollList({ payrollIds, role }: Props) {
  if (!payrollIds || payrollIds.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-neutral-500">No payrolls</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payrollIds.map((id) => (
        <PayrollCard key={id.toString()} payrollId={id} role={role} />
      ))}
    </div>
  );
}
