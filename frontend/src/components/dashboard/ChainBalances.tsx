'use client';

/**
 * Chain Balances Component
 * Displays balances across supported chains (Circle Gateway unified view)
 */

import React from 'react';
import { formatUnits } from 'viem';
import { useSupportedChains, useChainVolume } from '@/hooks/useSettlement';
import { CHAIN_METADATA } from '@/lib/services/settlement.service';

interface ChainBalanceData {
  chainId: number;
  name: string;
  color: string;
  balance: bigint;
  volume: bigint;
}

export function ChainBalances() {
  const { data: chains, isLoading } = useSupportedChains();

  // Mock balance data (in production, would come from Circle Gateway)
  const chainBalances: ChainBalanceData[] = [
    { chainId: 5042002, name: 'Arc Testnet', color: '#6366f1', balance: 500000000000n, volume: 1500000000000n },
    { chainId: 1, name: 'Ethereum', color: '#627eea', balance: 250000000000n, volume: 750000000000n },
    { chainId: 42161, name: 'Arbitrum', color: '#28a0f0', balance: 180000000000n, volume: 450000000000n },
    { chainId: 137, name: 'Polygon', color: '#8247e5', balance: 120000000000n, volume: 300000000000n },
    { chainId: 8453, name: 'Base', color: '#0052ff', balance: 75000000000n, volume: 200000000000n },
  ];

  const totalBalance = chainBalances.reduce((sum, c) => sum + c.balance, 0n);

  const formatBalance = (value: bigint) => {
    return `$${Number(formatUnits(value, 6)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Multi-Chain Balances</h3>
        <div className="text-sm text-gray-400">
          Circle Gateway
        </div>
      </div>

      {/* Visual Distribution */}
      <div className="flex h-4 rounded-full overflow-hidden mb-6">
        {chainBalances.map((chain) => {
          const percentage = totalBalance > 0n 
            ? Number((chain.balance * 100n) / totalBalance) 
            : 0;
          return (
            <div
              key={chain.chainId}
              className="transition-all duration-500"
              style={{ 
                width: `${percentage}%`, 
                backgroundColor: chain.color,
                minWidth: percentage > 0 ? '2px' : '0'
              }}
              title={`${chain.name}: ${formatBalance(chain.balance)}`}
            />
          );
        })}
      </div>

      {/* Chain List */}
      <div className="space-y-3">
        {chainBalances.map((chain) => (
          <div 
            key={chain.chainId}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: chain.color }}
              />
              <div>
                <p className="text-white font-medium">{chain.name}</p>
                <p className="text-xs text-gray-500">Chain ID: {chain.chainId}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{formatBalance(chain.balance)}</p>
              <p className="text-xs text-gray-500">Vol: {formatBalance(chain.volume)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between">
        <span className="text-gray-400 font-medium">Total Unified Balance</span>
        <span className="text-white font-semibold">{formatBalance(totalBalance)}</span>
      </div>
    </div>
  );
}
