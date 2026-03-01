'use client';

/**
 * Balance Overview Component
 * Displays unified treasury balance breakdown
 */

import React from 'react';
import { formatUnits } from 'viem';
import { useTreasuryDashboard } from '@/hooks/useTreasury';
import { StatsCard } from './StatsCard';

export function BalanceOverview() {
  const { balanceSnapshot, yieldMetrics, yieldRate, needsRebalancing, isLoading } = useTreasuryDashboard();

  const formatBalance = (value: bigint | undefined) => {
    if (!value) return '$0.00';
    return `$${Number(formatUnits(value, 6)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatAPY = (rate: bigint | undefined) => {
    if (!rate) return '0.00%';
    return `${(Number(rate) / 100).toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-6 animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Balance"
          value={formatBalance(balanceSnapshot?.totalValue)}
          subtitle="Unified across all chains"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatsCard
          title="Liquid USDC"
          value={formatBalance(balanceSnapshot?.liquidUsdc)}
          subtitle="Immediately available"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        
        <StatsCard
          title="Yield (USYC)"
          value={formatBalance(balanceSnapshot?.yieldBearingUsdc)}
          subtitle={`APY: ${formatAPY(yieldRate)}`}
          trend={{
            value: formatBalance(balanceSnapshot?.unrealizedYield),
            isPositive: true,
          }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        
        <StatsCard
          title="Locked in Escrow"
          value={formatBalance(balanceSnapshot?.lockedInEscrow)}
          subtitle="Active freight escrows"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />
      </div>

      {/* Rebalance Alert */}
      {needsRebalancing && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-yellow-500 font-medium">Treasury Rebalancing Recommended</p>
              <p className="text-yellow-600 text-sm">Idle capital detected. Sweep to USYC to earn yield.</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors">
            Rebalance Now
          </button>
        </div>
      )}

      {/* Balance Breakdown */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Balance Allocation</h3>
        <div className="space-y-4">
          <BalanceBar 
            label="Liquid USDC" 
            value={balanceSnapshot?.liquidUsdc || 0n}
            total={balanceSnapshot?.totalValue || 1n}
            color="bg-blue-500"
          />
          <BalanceBar 
            label="USYC (Yield)" 
            value={balanceSnapshot?.yieldBearingUsdc || 0n}
            total={balanceSnapshot?.totalValue || 1n}
            color="bg-green-500"
          />
          <BalanceBar 
            label="Escrow Locked" 
            value={balanceSnapshot?.lockedInEscrow || 0n}
            total={balanceSnapshot?.totalValue || 1n}
            color="bg-orange-500"
          />
          <BalanceBar 
            label="Pending Settlement" 
            value={balanceSnapshot?.pendingSettlement || 0n}
            total={balanceSnapshot?.totalValue || 1n}
            color="bg-purple-500"
          />
        </div>
      </div>
    </div>
  );
}

interface BalanceBarProps {
  label: string;
  value: bigint;
  total: bigint;
  color: string;
}

function BalanceBar({ label, value, total, color }: BalanceBarProps) {
  const percentage = total > 0n ? Number((value * 100n) / total) : 0;
  const formattedValue = `$${Number(formatUnits(value, 6)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{formattedValue} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
