"use client";

import { useState, useEffect } from "react";
import { formatUSDC } from "@/lib/config";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityItem } from "@/types/treasury";

// Simulated data to preview the UI until The Graph/indexers are hooked up
const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "tx-1",
    type: "deposit",
    amount: 50000000000n, // $50,000
    token: "USDC",
    status: "completed",
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600 * 2),
    description: "Fiat funding deposit via CPN",
  },
  {
    id: "tx-2",
    type: "yield",
    amount: 1520000n, // $1.52
    token: "USYC",
    status: "completed",
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600 * 24),
    description: "Daily automated yield rebalance",
  },
  {
    id: "tx-3",
    type: "escrow",
    amount: 2500000000n, // $2,500
    token: "USDC",
    status: "completed",
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600 * 48),
    description: "Smart contract freight escrow locked",
  },
  {
    id: "tx-4",
    type: "settlement",
    amount: 800000000n, // $800
    token: "EURC",
    status: "completed",
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600 * 72),
    description: "Cross border settlement to EURC",
  },
  {
    id: "tx-5",
    type: "withdrawal",
    amount: 1500000000n, // $1,500
    token: "USDC",
    status: "completed",
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600 * 96),
    description: "Fiat withdrawal to matched bank account",
  },
];

function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between py-2 -mx-2 px-2">
      <div className="flex items-center gap-4">
        <Skeleton className="w-8 h-8 rounded-full bg-neutral-800" />
        <div>
          <Skeleton className="h-4 w-48 bg-neutral-800 mb-2" />
          <Skeleton className="h-3 w-24 bg-neutral-800" />
        </div>
      </div>
      <div className="text-right">
        <Skeleton className="h-4 w-20 bg-neutral-800 mb-2" />
        <Skeleton className="h-3 w-12 bg-neutral-800 ml-auto" />
      </div>
    </div>
  );
}

export function TransactionHistory() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading delay for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setActivities(MOCK_ACTIVITIES);
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-medium text-neutral-100">
          Recent Transactions
        </h2>
        <span className="text-xs text-neutral-500">Last 7 days</span>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          // Skeleton loading state
          <>
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
          </>
        ) : activities.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500">No transactions yet</p>
          </div>
        ) : (
          // Transaction list
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between py-2 border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 -mx-2 px-2 rounded transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs
                  ${
                    activity.type === "deposit"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : activity.type === "withdrawal" ||
                          activity.type === "escrow"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {activity.type === "deposit" && "↓"}
                  {activity.type === "withdrawal" && "↑"}
                  {activity.type === "escrow" && "⚿"}
                  {activity.type === "settlement" && "⇄"}
                  {activity.type === "yield" && "✦"}
                  {activity.type === "swap" && "⇌"}
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-500">
                      {new Date(
                        Number(activity.timestamp) * 1000,
                      ).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-600 bg-neutral-900 px-1.5 py-0.5 rounded">
                      {activity.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={`text-sm font-semibold 
                  ${activity.type === "deposit" || activity.type === "yield" ? "text-emerald-400" : "text-neutral-100"}`}
                >
                  {activity.type === "deposit" || activity.type === "yield"
                    ? "+"
                    : "-"}
                  ${formatUSDC(activity.amount)}
                </p>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  {activity.token}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
