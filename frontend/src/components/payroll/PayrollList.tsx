"use client";

import { PayrollCard } from "./PayrollCard";

interface Props {
  payrollIds: readonly bigint[];
  role: "employer" | "employee";
}

export function PayrollList({ payrollIds, role }: Props) {
  if (!payrollIds || payrollIds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No payrolls found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payrollIds.map((id) => (
        <PayrollCard key={id.toString()} payrollId={id} role={role} />
      ))}
    </div>
  );
}
