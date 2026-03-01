"use client";

import { useState, useEffect } from "react";
import { formatUSDC } from "@/lib/config";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSettlementHistory,
  type SettlementRecord,
} from "@/app/actions/getSettlementHistory";

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
  const [activities, setActivities] = useState<SettlementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hardcoding test company for demo
    getSettlementHistory("11111111-1111-1111-1111-111111111111", [
      "SETTLEMENT",
      "FX_SWAP",
      "TREASURY_SWEEP",
    ])
      .then((data) => {
        setActivities(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load txs", err);
        setIsLoading(false);
      });
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
                    activity.type === "Cross-chain" ||
                    activity.type === "Escrow Release"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {activity.type === "FX Settlement" && "⇄"}
                  {activity.type === "Cross-chain" && "⇌"}
                  {activity.type === "Escrow Release" && "⚿"}
                  {!["FX Settlement", "Cross-chain", "Escrow Release"].includes(
                    activity.type,
                  ) && "✦"}
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    {activity.type} ({activity.from} → {activity.to})
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-500">
                      {activity.date}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-600 bg-neutral-900 px-1.5 py-0.5 rounded">
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={`text-sm font-semibold 
                  ${activity.status === "Completed" ? "text-emerald-400" : "text-amber-400"}`}
                >
                  ${activity.amount.toLocaleString()}
                </p>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  {["FX Settlement", "Yield Sweep"].includes(activity.type)
                    ? activity.to
                    : activity.from}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
