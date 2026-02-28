"use client";

import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEmployeePayrolls, useUSDCBalance } from "@/hooks/usePayrollArena";
import { PayrollList } from "@/components/payroll/PayrollList";
import { USDC_DECIMALS } from "@/lib/config";

export default function EmployeePage() {
  const { address, isConnected } = useAccount();

  // Read hooks
  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: payrollIds } = useEmployeePayrolls(address);

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold mb-4">Employee Dashboard</h1>
        <p className="text-gray-400 mb-8">Connect your wallet to view and claim payrolls</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Employee Dashboard</h1>

      {/* Balance Overview */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-400 mb-1">Wallet Balance</p>
          <p className="text-2xl font-bold text-primary-400">
            ${usdcBalance ? formatUnits(usdcBalance, USDC_DECIMALS) : "0"} USDC
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400 mb-1">Active Payrolls</p>
          <p className="text-2xl font-bold">{payrollIds?.length || 0}</p>
        </div>
      </div>

      {/* Payroll List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Your Payrolls</h2>
        {payrollIds && payrollIds.length > 0 ? (
          <PayrollList payrollIds={payrollIds} role="employee" />
        ) : (
          <p className="text-gray-500 text-center py-8">
            No payrolls found. Your employer needs to create a payroll for you.
          </p>
        )}
      </div>
    </div>
  );
}
