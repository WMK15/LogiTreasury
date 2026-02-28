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
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold mb-4">Treasury Overview</h1>
        <p className="text-gray-400 mb-8">Connect your wallet to view treasury status</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Treasury Overview</h1>

      {/* Contract Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Contract Addresses</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">PayrollArena:</span>
            <code className="text-primary-400">{CONTRACT_ADDRESSES.payrollArena}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">USDC:</span>
            <code className="text-primary-400">{CONTRACT_ADDRESSES.usdc}</code>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-sm text-gray-400 mb-1">Your Treasury Balance</h3>
          <p className="text-3xl font-bold text-primary-400">
            ${treasuryBalance ? formatUnits(treasuryBalance, USDC_DECIMALS) : "0"}
          </p>
          <p className="text-xs text-gray-500 mt-1">USDC deposited in contract</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-400 mb-1">Wallet USDC Balance</h3>
          <p className="text-3xl font-bold">
            ${usdcBalance ? formatUnits(usdcBalance, USDC_DECIMALS) : "0"}
          </p>
          <p className="text-xs text-gray-500 mt-1">USDC in your wallet</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">As Employer</h3>
          <div className="space-y-3">
            <StatRow label="Total Payrolls Created" value={employerPayrolls?.length || 0} />
            <StatRow label="Active" value="-" />
            <StatRow label="Completed" value="-" />
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">As Employee</h3>
          <div className="space-y-3">
            <StatRow label="Total Payrolls Received" value={employeePayrolls?.length || 0} />
            <StatRow label="Claimable" value="-" />
            <StatRow label="Total Claimed" value="-" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
