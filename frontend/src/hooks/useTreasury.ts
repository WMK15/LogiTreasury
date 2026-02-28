/**
 * Treasury Hooks
 * React hooks for treasury operations using wagmi
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { treasuryManagerAbi } from '@/abi/TreasuryManager';
import { yieldVaultAdapterAbi } from '@/abi/YieldVaultAdapter';
import { parseUnits } from 'viem';
import type { BalanceSnapshot, YieldMetrics, YieldConfig } from '@/types/treasury';

import { CONTRACTS } from '@/lib/config';

const TREASURY_ADDRESS = CONTRACTS.treasuryManager;
const YIELD_ADAPTER_ADDRESS = CONTRACTS.yieldVaultAdapter;

// ============ Read Hooks ============

/**
 * Get complete balance snapshot
 */
export function useBalanceSnapshot() {
  const { address } = useAccount();
  
  return useReadContract({
    address: TREASURY_ADDRESS,
    abi: treasuryManagerAbi,
    functionName: 'getBalanceSnapshot',
    query: {
      enabled: !!address,
      refetchInterval: 30000, // Refresh every 30s
    },
  });
}

/**
 * Get available balance
 */
export function useAvailableBalance() {
  const { address } = useAccount();
  
  return useReadContract({
    address: TREASURY_ADDRESS,
    abi: treasuryManagerAbi,
    functionName: 'getAvailableBalance',
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });
}

/**
 * Get current yield rate
 */
export function useCurrentYieldRate() {
  return useReadContract({
    address: TREASURY_ADDRESS,
    abi: treasuryManagerAbi,
    functionName: 'getCurrentYieldRate',
    query: {
      refetchInterval: 60000, // Refresh every minute
    },
  });
}

/**
 * Get yield configuration
 */
export function useYieldConfig() {
  return useReadContract({
    address: TREASURY_ADDRESS,
    abi: treasuryManagerAbi,
    functionName: 'getYieldConfig',
  });
}

/**
 * Get yield metrics from adapter
 */
export function useYieldMetrics() {
  return useReadContract({
    address: YIELD_ADAPTER_ADDRESS,
    abi: yieldVaultAdapterAbi,
    functionName: 'getYieldMetrics',
    query: {
      refetchInterval: 30000,
    },
  });
}

/**
 * Check if rebalancing is needed
 */
export function useNeedsRebalancing() {
  return useReadContract({
    address: TREASURY_ADDRESS,
    abi: treasuryManagerAbi,
    functionName: 'needsRebalancing',
    query: {
      refetchInterval: 60000,
    },
  });
}

/**
 * Get unified balance across chains
 */
export function useUnifiedBalance() {
  return useReadContract({
    address: TREASURY_ADDRESS,
    abi: treasuryManagerAbi,
    functionName: 'getUnifiedBalance',
    query: {
      refetchInterval: 30000,
    },
  });
}

// ============ Write Hooks ============

/**
 * Deposit USDC hook
 */
export function useDepositUsdc() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const deposit = async (amount: string) => {
    const amountWei = parseUnits(amount, 6);
    
    writeContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'depositUsdc',
      args: [amountWei],
    });
  };
  
  // Invalidate queries on success
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['balanceSnapshot'] });
    queryClient.invalidateQueries({ queryKey: ['availableBalance'] });
  }
  
  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Withdraw USDC hook
 */
export function useWithdrawUsdc() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const withdraw = async (amount: string, recipient: `0x${string}`, memo: string) => {
    const amountWei = parseUnits(amount, 6);
    
    writeContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'withdrawUsdc',
      args: [amountWei, recipient, memo],
    });
  };
  
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['balanceSnapshot'] });
    queryClient.invalidateQueries({ queryKey: ['availableBalance'] });
  }
  
  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Sweep to yield hook
 */
export function useSweepToYield() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const sweep = async () => {
    writeContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'sweepToYield',
    });
  };
  
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['balanceSnapshot'] });
    queryClient.invalidateQueries({ queryKey: ['yieldMetrics'] });
  }
  
  return {
    sweep,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Harvest yield hook
 */
export function useHarvestYield() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const harvest = async () => {
    writeContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'harvestYield',
    });
  };
  
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['yieldMetrics'] });
  }
  
  return {
    harvest,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Rebalance hook
 */
export function useRebalance() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const rebalance = async () => {
    writeContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'rebalance',
    });
  };
  
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['balanceSnapshot'] });
    queryClient.invalidateQueries({ queryKey: ['yieldMetrics'] });
    queryClient.invalidateQueries({ queryKey: ['needsRebalancing'] });
  }
  
  return {
    rebalance,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Redeem from yield hook
 */
export function useRedeemFromYield() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const redeem = async (amount: string) => {
    const amountWei = parseUnits(amount, 6);
    
    writeContract({
      address: TREASURY_ADDRESS,
      abi: treasuryManagerAbi,
      functionName: 'redeemFromYield',
      args: [amountWei],
    });
  };
  
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['balanceSnapshot'] });
    queryClient.invalidateQueries({ queryKey: ['yieldMetrics'] });
  }
  
  return {
    redeem,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============ Composite Hooks ============

/**
 * Combined treasury dashboard data
 */
export function useTreasuryDashboard() {
  const balanceSnapshot = useBalanceSnapshot();
  const yieldMetrics = useYieldMetrics();
  const yieldRate = useCurrentYieldRate();
  const needsRebalancing = useNeedsRebalancing();
  
  return {
    balanceSnapshot: balanceSnapshot.data as BalanceSnapshot | undefined,
    yieldMetrics: yieldMetrics.data as YieldMetrics | undefined,
    yieldRate: yieldRate.data as bigint | undefined,
    needsRebalancing: needsRebalancing.data as boolean | undefined,
    isLoading: balanceSnapshot.isLoading || yieldMetrics.isLoading,
    isError: balanceSnapshot.isError || yieldMetrics.isError,
    refetch: () => {
      balanceSnapshot.refetch();
      yieldMetrics.refetch();
      yieldRate.refetch();
      needsRebalancing.refetch();
    },
  };
}
