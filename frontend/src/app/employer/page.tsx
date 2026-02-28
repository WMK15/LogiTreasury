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

  const { data: treasuryBalance, refetch: refetchBalance } = useEmployerBalance(address);
  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: payrollIds } = useEmployerPayrolls(address);

  const { approve, isPending: isApproving, isSuccess: approveSuccess } = useApproveUSDC();
  const { deposit, isPending: isDepositing, isConfirming } = useDeposit();

  if (!isConnected) {
    return (
      <div className="pt-16">
        <p className="text-sm text-neutral-400 mb-4">Connect wallet to continue</p>
        <ConnectButton />
      </div>
    );
  }

  const handleDeposit = async () => {
    if (!depositAmount) return;
    approve(depositAmount);
  };

  const handleDepositAfterApproval = () => {
    if (!depositAmount) return;
    deposit(depositAmount);
    setDepositAmount("");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-neutral-100">Employer</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KPI 
          label="Treasury" 
          value={treasuryBalance ? formatUnits(treasuryBalance, USDC_DECIMALS) : "0"} 
          suffix="USDC"
        />
        <KPI 
          label="Wallet" 
          value={usdcBalance ? formatUnits(usdcBalance, USDC_DECIMALS) : "0"} 
          suffix="USDC"
        />
        <KPI 
          label="Payrolls" 
          value={payrollIds?.length?.toString() || "0"} 
        />
      </div>

      {/* Deposit */}
      <div className="card mb-6">
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Amount"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="input flex-1 max-w-[200px]"
          />
          {!approveSuccess ? (
            <button
              onClick={handleDeposit}
              disabled={!depositAmount || isApproving}
              className="btn-secondary"
            >
              {isApproving ? "Approving..." : "Approve"}
            </button>
          ) : (
            <button
              onClick={handleDepositAfterApproval}
              disabled={!depositAmount || isDepositing || isConfirming}
              className="btn-primary"
            >
              {isDepositing || isConfirming ? "Depositing..." : "Deposit"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <TabButton 
          active={activeTab === "overview"} 
          onClick={() => setActiveTab("overview")}
        >
          Payrolls
        </TabButton>
        <TabButton 
          active={activeTab === "vesting"} 
          onClick={() => setActiveTab("vesting")}
        >
          + Vesting
        </TabButton>
        <TabButton 
          active={activeTab === "milestone"} 
          onClick={() => setActiveTab("milestone")}
        >
          + Milestone
        </TabButton>
      </div>

      {/* Content */}
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

function TabButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={active ? "tab-active" : "tab-inactive"}
    >
      {children}
    </button>
  );
}
