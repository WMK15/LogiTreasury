"use client";

import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useEmployerBalance,
  useEmployerPayrolls,
  useEmployeePayrolls,
  useUSDCBalance,
} from "@/hooks/usePayrollArena";
import { USDC_DECIMALS, CONTRACT_ADDRESSES } from "@/lib/config";

export default function TreasuryPage() {
  const { address, isConnected } = useAccount();

  const { data: treasuryBalance } = useEmployerBalance(address);
  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: employerPayrolls } = useEmployerPayrolls(address);
  const { data: employeePayrolls } = useEmployeePayrolls(address);

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
        <h1 className="text-sm font-medium text-neutral-100">Treasury</h1>
      </div>

      {/* Contracts */}
      <div className="card mb-6">
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Contracts</p>
        <div className="space-y-2 text-sm">
          <Row label="PayrollArena" value={CONTRACT_ADDRESSES.payrollArena} mono />
          <Row label="USDC" value={CONTRACT_ADDRESSES.usdc} mono />
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="kpi-label mb-1">Treasury</p>
          <p className="kpi-value">
            {treasuryBalance ? formatUnits(treasuryBalance, USDC_DECIMALS) : "0"}
            <span className="text-neutral-500 text-sm ml-1">USDC</span>
          </p>
        </div>
        <div className="card">
          <p className="kpi-label mb-1">Wallet</p>
          <p className="kpi-value">
            {usdcBalance ? formatUnits(usdcBalance, USDC_DECIMALS) : "0"}
            <span className="text-neutral-500 text-sm ml-1">USDC</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">As Employer</p>
          <div className="space-y-2">
            <Row label="Total" value={employerPayrolls?.length || 0} />
            <Row label="Active" value="—" />
            <Row label="Completed" value="—" />
          </div>
        </div>
        <div className="card">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">As Employee</p>
          <div className="space-y-2">
            <Row label="Total" value={employeePayrolls?.length || 0} />
            <Row label="Claimable" value="—" />
            <Row label="Claimed" value="—" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ 
  label, 
  value, 
  mono 
}: { 
  label: string; 
  value: string | number; 
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className={`text-neutral-200 ${mono ? "font-mono text-xs" : "tabular-nums"}`}>
        {value}
      </span>
    </div>
  );
}
