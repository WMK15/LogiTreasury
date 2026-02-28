'use client';

/**
 * Yield Card Component
 * Displays USYC yield information and actions
 */

import React from 'react';
import { formatUnits } from 'viem';
import { useYieldMetrics, useCurrentYieldRate, useSweepToYield, useHarvestYield } from '@/hooks/useTreasury';

export function YieldCard() {
  const { data: metrics, isLoading: metricsLoading } = useYieldMetrics();
  const { data: yieldRate, isLoading: rateLoading } = useCurrentYieldRate();
  const { sweep, isPending: sweeping, isConfirming: confirmingSweep } = useSweepToYield();
  const { harvest, isPending: harvesting, isConfirming: confirmingHarvest } = useHarvestYield();

  const formatValue = (value: bigint | undefined) => {
    if (!value) return '$0.00';
    return `$${Number(formatUnits(value, 6)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatAPY = (rate: bigint | undefined) => {
    if (!rate) return '0.00%';
    return `${(Number(rate) / 100).toFixed(2)}%`;
  };

  const isLoading = metricsLoading || rateLoading;

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-800 rounded"></div>
          <div className="h-12 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">USYC Yield</h3>
        <div className="flex items-center px-3 py-1 bg-green-900/30 border border-green-800 rounded-full">
          <span className="text-green-400 text-sm font-medium">
            {formatAPY(yieldRate as bigint)} APY
          </span>
        </div>
      </div>

      {/* Yield Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Current Value</p>
          <p className="text-xl font-semibold text-white">
            {formatValue((metrics as any)?.currentValue)}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Shares</p>
          <p className="text-xl font-semibold text-white">
            {formatValue((metrics as any)?.currentShares)}
          </p>
        </div>
      </div>

      {/* Yield Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-400">Unrealized Yield</span>
          <span className="text-green-400 font-medium">
            +{formatValue((metrics as any)?.unrealizedYield)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Realized Yield</span>
          <span className="text-white">
            {formatValue((metrics as any)?.realizedYield)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Total Deposited</span>
          <span className="text-white">
            {formatValue((metrics as any)?.totalDeposited)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={() => sweep()}
          disabled={sweeping || confirmingSweep}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {sweeping || confirmingSweep ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sweeping...
            </span>
          ) : (
            'Sweep to Yield'
          )}
        </button>
        <button
          onClick={() => harvest()}
          disabled={harvesting || confirmingHarvest}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {harvesting || confirmingHarvest ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Harvesting...
            </span>
          ) : (
            'Harvest Yield'
          )}
        </button>
      </div>
    </div>
  );
}
