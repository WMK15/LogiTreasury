"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
          PayrollArena
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Programmable payroll & conditional USDC escrow for the decentralized workforce.
          Vesting schedules, milestone-based releases, and built-in dispute resolution.
        </p>

        {!isConnected ? (
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        ) : (
          <div className="flex gap-4 justify-center">
            <Link href="/employer" className="btn-primary text-lg px-8 py-3">
              Employer Dashboard
            </Link>
            <Link href="/employee" className="btn-secondary text-lg px-8 py-3">
              Employee Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <FeatureCard
          title="Vesting Schedules"
          description="Linear vesting with configurable cliff periods. Funds unlock gradually over time."
          icon="📅"
        />
        <FeatureCard
          title="Milestone Releases"
          description="Pay based on completed deliverables. Approve milestones to release funds."
          icon="🎯"
        />
        <FeatureCard
          title="Dispute Resolution"
          description="Built-in dispute mechanism to freeze and resolve payment conflicts."
          icon="⚖️"
        />
      </div>

      {/* How It Works */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Step number={1} title="Deposit USDC" description="Employer deposits funds into treasury" />
          <Step number={2} title="Create Payroll" description="Set up vesting or milestone schedule" />
          <Step number={3} title="Track Progress" description="Monitor vesting or approve milestones" />
          <Step number={4} title="Claim Funds" description="Employee claims unlocked USDC" />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="card hover:border-primary-500/50 transition-colors">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
        {number}
      </div>
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
