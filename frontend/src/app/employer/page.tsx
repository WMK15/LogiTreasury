"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useEmployerBalance,
  useEmployerPayrolls,
  useUSDCBalance,
  useApproveUSDC,
  useDeposit,
} from "@/hooks/usePayrollArena";
import { CreateVestingForm } from "@/components/payroll/CreateVestingForm";
import { CreateMilestoneForm } from "@/components/payroll/CreateMilestoneForm";
import { PayrollList } from "@/components/payroll/PayrollList";
import { USDC_DECIMALS } from "@/lib/config";

type Tab = "overview" | "vesting" | "milestone";

export default function EmployerPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [depositAmount, setDepositAmount] = useState("");

  // Read hooks
  const { data: treasuryBalance, refetch: refetchBalance } = useEmployerBalance(address);
  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: payrollIds } = useEmployerPayrolls(address);

  // Write hooks
  const { approve, isPending: isApproving, isSuccess: approveSuccess } = useApproveUSDC();
  const { deposit, isPending: isDepositing, isConfirming } = useDeposit();

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold mb-4">Employer Dashboard</h1>
        <p className="text-gray-400 mb-8">Connect your wallet to manage payrolls</p>
        <ConnectButton />
      </div>
    );
  }

  const handleDeposit = async () => {
    if (!depositAmount) return;
    // First approve, then deposit
    approve(depositAmount);
  };

  const handleDepositAfterApproval = () => {
    if (!depositAmount) return;
    deposit(depositAmount);
    setDepositAmount("");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Employer Dashboard</h1>

      {/* Treasury Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-400 mb-1">Treasury Balance</p>
          <p className="text-2xl font-bold text-primary-400">
            ${treasuryBalance ? formatUnits(treasuryBalance, USDC_DECIMALS) : "0"} USDC
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400 mb-1">Wallet Balance</p>
          <p className="text-2xl font-bold">
            ${usdcBalance ? formatUnits(usdcBalance, USDC_DECIMALS) : "0"} USDC
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400 mb-1">Active Payrolls</p>
          <p className="text-2xl font-bold">{payrollIds?.length || 0}</p>
        </div>
      </div>

      {/* Deposit Section */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Deposit USDC</h2>
        <div className="flex gap-4">
          <input
            type="number"
            placeholder="Amount (USDC)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="input flex-1"
          />
          {!approveSuccess ? (
            <button
              onClick={handleDeposit}
              disabled={!depositAmount || isApproving}
              className="btn-primary"
            >
              {isApproving ? "Approving..." : "1. Approve"}
            </button>
          ) : (
            <button
              onClick={handleDepositAfterApproval}
              disabled={!depositAmount || isDepositing || isConfirming}
              className="btn-primary"
            >
              {isDepositing || isConfirming ? "Depositing..." : "2. Deposit"}
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "overview"
              ? "bg-primary-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          All Payrolls
        </button>
        <button
          onClick={() => setActiveTab("vesting")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "vesting"
              ? "bg-primary-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Create Vesting
        </button>
        <button
          onClick={() => setActiveTab("milestone")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "milestone"
              ? "bg-primary-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Create Milestone
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <PayrollList payrollIds={payrollIds || []} role="employer" />
      )}
      {activeTab === "vesting" && (
        <CreateVestingForm onSuccess={() => {
          setActiveTab("overview");
          refetchBalance();
        }} />
      )}
      {activeTab === "milestone" && (
        <CreateMilestoneForm onSuccess={() => {
          setActiveTab("overview");
          refetchBalance();
        }} />
      )}
    </div>
  );
}
