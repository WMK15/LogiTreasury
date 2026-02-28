"use client";

import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEmployeePayrolls, useUSDCBalance } from "@/hooks/usePayrollArena";
import { PayrollList } from "@/components/payroll/PayrollList";
import { USDC_DECIMALS } from "@/lib/config";

export default function EmployeePage() {
  const { address, isConnected } = useAccount();

  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: payrollIds } = useEmployeePayrolls(address);

  if (!isConnected) {
    return (
      <div className="pt-16">
        <p className="text-sm text-neutral-400 mb-4">Connect wallet to continue</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-neutral-100">Employee</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <KPI 
          label="Balance" 
          value={usdcBalance ? formatUnits(usdcBalance, USDC_DECIMALS) : "0"} 
          suffix="USDC"
        />
        <KPI 
          label="Payrolls" 
          value={payrollIds?.length?.toString() || "0"} 
        />
      </div>

      {/* Payrolls */}
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Payrolls</p>
        {payrollIds && payrollIds.length > 0 ? (
          <PayrollList payrollIds={payrollIds} role="employee" />
        ) : (
          <div className="card">
            <p className="text-sm text-neutral-500">No payrolls</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="card">
      <p className="kpi-label mb-1">{label}</p>
      <p className="kpi-value">
        {value}
        {suffix && <span className="text-neutral-500 text-sm ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
