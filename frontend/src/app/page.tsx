"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="max-w-2xl mx-auto pt-16">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-xl font-medium text-neutral-100 mb-2">
          Programmable Payroll
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Conditional USDC escrow with vesting schedules, milestone releases, and dispute resolution.
        </p>
      </div>

      {!isConnected ? (
        <ConnectButton />
      ) : (
        <div className="flex gap-2">
          <Link href="/employer" className="btn-primary">
            Employer
          </Link>
          <Link href="/employee" className="btn-secondary">
            Employee
          </Link>
        </div>
      )}

      {/* Features */}
      <div className="mt-16 grid gap-4">
        <Feature
          title="Vesting"
          description="Linear unlock with configurable cliff periods"
        />
        <Feature
          title="Milestones"
          description="Release funds on deliverable completion"
        />
        <Feature
          title="Disputes"
          description="Freeze and resolve payment conflicts"
        />
      </div>

      {/* Steps */}
      <div className="mt-12 pt-8 border-t border-neutral-800">
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-4">How it works</p>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <StepItem n="1" label="Deposit" />
          <StepItem n="2" label="Create" />
          <StepItem n="3" label="Track" />
          <StepItem n="4" label="Claim" />
        </div>
      </div>
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-neutral-800/50 last:border-0">
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 mt-1.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-neutral-200">{title}</p>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

function StepItem({ n, label }: { n: string; label: string }) {
  return (
    <div className="text-center">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-neutral-400 text-xs font-medium mb-1.5">
        {n}
      </span>
      <p className="text-neutral-400">{label}</p>
    </div>
  );
}
