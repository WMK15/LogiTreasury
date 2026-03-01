/**
 * Settlement Hooks
 * React hooks for cross-chain settlement operations
 */

import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { settlementRouterAbi } from '@/abi/SettlementRouter';
import { parseUnits } from 'viem';
import type { Settlement, BatchSettlement, ChainConfig, RouteQuote } from '@/types/treasury';

import { CONTRACTS } from '@/lib/config';

const ROUTER_ADDRESS = CONTRACTS.settlementRouter;

// ============ Read Hooks ============

/**
 * Get supported chains
 */
export function useSupportedChains() {
  return useReadContract({
    address: ROUTER_ADDRESS,
    abi: settlementRouterAbi,
    functionName: 'getSupportedChains',
  });
}

/**
 * Get chain configuration
 */
export function useChainConfig(chainId: number) {
  return useReadContract({
    address: ROUTER_ADDRESS,
    abi: settlementRouterAbi,
    functionName: 'getChainConfig',
    args: [BigInt(chainId)],
    query: {
      enabled: chainId > 0,
    },
  });
}

/**
 * Check if chain is supported
 */
export function useIsChainSupported(chainId: number) {
  return useReadContract({
    address: ROUTER_ADDRESS,
    abi: settlementRouterAbi,
    functionName: 'isChainSupported',
    args: [BigInt(chainId)],
    query: {
      enabled: chainId > 0,
    },
  });
}

/**
 * Get route quote
 */
export function useRouteQuote(destChain: number, amount: string) {
  const amountWei = amount ? parseUnits(amount, 6) : 0n;
  
  return useReadContract({
    address: ROUTER_ADDRESS,
    abi: settlementRouterAbi,
    functionName: 'getRouteQuote',
    args: [BigInt(destChain), amountWei],
    query: {
      enabled: destChain > 0 && amountWei > 0n,
      refetchInterval: 30000,
    },
  });
}

/**
 * Get optimal route
 */
export function useOptimalRoute(destChain: number, amount: string) {
  const amountWei = amount ? parseUnits(amount, 6) : 0n;
  
  return useReadContract({
    address: ROUTER_ADDRESS,
    abi: settlementRouterAbi,
    functionName: 'getOptimalRoute',
    args: [BigInt(destChain), amountWei],
    query: {
      enabled: destChain > 0 && amountWei > 0n,
    },
  });
}

/**
 * Get settlement details
 */
export function useSettlement(settlementId: `0x${string}` | undefined) {
  return useReadContract({
    address: ROUTER_ADDRESS,
    abi: settlementRouterAbi,
    functionName: 'getSettlement',
    args: settlementId ? [settlementId] : undefined,
    query: {
      enabled: !!settlementId,
      refetchInterval: 10000, // Poll for status updates
    },
  });
}

/**
 * Get user's settlements
 */
export function useUserSettlements() {
  const { address } = useAccount();
  
  return useReadContract({
    address: ROUTER_ADDRESS,
    abi: settlementRouterAbi,
    functionName: 'getUserSettlements',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get batch settlement details
 */
export function useBatchSettlement(batchId: `0x${string}` | undefined) {
  return useReadContract({
    address: ROUTER_ADDRESS,
    abi: settlementRouterAbi,
    functionName: 'getBatchSettlement',
    args: batchId ? [batchId] : undefined,
    query: {
      enabled: !!batchId,
      refetchInterval: 10000,
    },
  });
}

/**
 * Get chain volume
 */
export function useChainVolume(chainId: number) {
  return useReadContract({
    address: ROUTER_ADDRESS,
    abi: settlementRouterAbi,
    functionName: 'getChainVolume',
    args: [BigInt(chainId)],
    query: {
      enabled: chainId > 0,
    },
  });
}

// ============ Write Hooks ============

/**
 * Initiate settlement
 */
export function useInitiateSettlement() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const initiate = async (
    recipient: `0x${string}`,
    destChain: number,
    token: `0x${string}`,
    amount: string,
    memo: string
  ) => {
    const amountWei = parseUnits(amount, 6);
    
    writeContract({
      address: ROUTER_ADDRESS,
      abi: settlementRouterAbi,
      functionName: 'initiateSettlement',
      args: [recipient, BigInt(destChain), token, amountWei, memo],
    });
  };
  
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['userSettlements'] });
    queryClient.invalidateQueries({ queryKey: ['chainVolume'] });
  }
  
  return {
    initiate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Initiate batch settlement
 */
export function useInitiateBatchSettlement() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const initiateBatch = async (
    destChain: number,
    token: `0x${string}`,
    recipients: `0x${string}`[],
    amounts: string[]
  ) => {
    const amountsWei = amounts.map(a => parseUnits(a, 6));
    
    writeContract({
      address: ROUTER_ADDRESS,
      abi: settlementRouterAbi,
      functionName: 'initiateBatchSettlement',
      args: [BigInt(destChain), token, recipients, amountsWei],
    });
  };
  
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['userSettlements'] });
    queryClient.invalidateQueries({ queryKey: ['chainVolume'] });
  }
  
  return {
    initiateBatch,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============ Composite Hooks ============

/**
 * Settlement with quote
 */
export function useSettlementWithQuote(destChain: number, amount: string) {
  const quote = useRouteQuote(destChain, amount);
  const { initiate, ...rest } = useInitiateSettlement();
  
  return {
    quote: quote.data as RouteQuote | undefined,
    isLoadingQuote: quote.isLoading,
    initiate,
    ...rest,
  };
}

/**
 * All chain configs
 */
export function useAllChainConfigs() {
  const { data: chains } = useSupportedChains();
  
  // This would need to be implemented with multiple queries
  // For now, return the chain IDs
  return {
    chainIds: chains as bigint[] | undefined,
  };
}
