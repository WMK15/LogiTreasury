/**
 * FX Hooks
 * React hooks for StableFX operations
 */

import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { fxExecutionEngineAbi } from '@/abi/FXExecutionEngine';
import { parseUnits } from 'viem';
import { SwapDirection, type FXQuote, type FXExposure, type RateSnapshot } from '@/types/treasury';

import { CONTRACTS } from '@/lib/config';

const FX_ENGINE_ADDRESS = CONTRACTS.fxEngine;

// ============ Read Hooks ============

/**
 * Get current FX rates
 */
export function useCurrentRates() {
  return useReadContract({
    address: FX_ENGINE_ADDRESS,
    abi: fxExecutionEngineAbi,
    functionName: 'getCurrentRates',
    query: {
      refetchInterval: 10000, // Refresh every 10s for real-time rates
    },
  });
}

/**
 * Preview swap output
 */
export function usePreviewSwap(direction: SwapDirection, amount: string) {
  const amountWei = amount ? parseUnits(amount, 6) : 0n;
  
  return useReadContract({
    address: FX_ENGINE_ADDRESS,
    abi: fxExecutionEngineAbi,
    functionName: 'previewSwap',
    args: [direction, amountWei],
    query: {
      enabled: amountWei > 0n,
      refetchInterval: 5000,
    },
  });
}

/**
 * Get FX exposure
 */
export function useFXExposure() {
  return useReadContract({
    address: FX_ENGINE_ADDRESS,
    abi: fxExecutionEngineAbi,
    functionName: 'getExposure',
    query: {
      refetchInterval: 30000,
    },
  });
}

/**
 * Get quote details
 */
export function useQuote(quoteId: `0x${string}` | undefined) {
  return useReadContract({
    address: FX_ENGINE_ADDRESS,
    abi: fxExecutionEngineAbi,
    functionName: 'getQuote',
    args: quoteId ? [quoteId] : undefined,
    query: {
      enabled: !!quoteId,
    },
  });
}

/**
 * Get user's quotes
 */
export function useUserQuotes() {
  const { address } = useAccount();
  
  return useReadContract({
    address: FX_ENGINE_ADDRESS,
    abi: fxExecutionEngineAbi,
    functionName: 'getUserQuotes',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get swap count
 */
export function useSwapCount() {
  return useReadContract({
    address: FX_ENGINE_ADDRESS,
    abi: fxExecutionEngineAbi,
    functionName: 'getSwapCount',
  });
}

// ============ Write Hooks ============

/**
 * Request USDC to EURC quote
 */
export function useRequestUsdcToEurcQuote() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const requestQuote = async (amount: string) => {
    const amountWei = parseUnits(amount, 6);
    
    writeContract({
      address: FX_ENGINE_ADDRESS,
      abi: fxExecutionEngineAbi,
      functionName: 'requestUsdcToEurcQuote',
      args: [amountWei],
    });
  };
  
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['userQuotes'] });
  }
  
  return {
    requestQuote,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Request EURC to USDC quote
 */
export function useRequestEurcToUsdcQuote() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const requestQuote = async (amount: string) => {
    const amountWei = parseUnits(amount, 6);
    
    writeContract({
      address: FX_ENGINE_ADDRESS,
      abi: fxExecutionEngineAbi,
      functionName: 'requestEurcToUsdcQuote',
      args: [amountWei],
    });
  };
  
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['userQuotes'] });
  }
  
  return {
    requestQuote,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Accept quote
 */
export function useAcceptQuote() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const accept = async (quoteId: `0x${string}`) => {
    writeContract({
      address: FX_ENGINE_ADDRESS,
      abi: fxExecutionEngineAbi,
      functionName: 'acceptQuote',
      args: [quoteId],
    });
  };
  
  return {
    accept,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Execute quote
 */
export function useExecuteQuote() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const execute = async (quoteId: `0x${string}`) => {
    writeContract({
      address: FX_ENGINE_ADDRESS,
      abi: fxExecutionEngineAbi,
      functionName: 'executeQuote',
      args: [quoteId],
    });
  };
  
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['fxExposure'] });
    queryClient.invalidateQueries({ queryKey: ['swapCount'] });
  }
  
  return {
    execute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Direct swap (no RFQ)
 */
export function useDirectSwap() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const swap = async (direction: SwapDirection, amount: string, minOutput: string) => {
    const amountWei = parseUnits(amount, 6);
    const minOutputWei = parseUnits(minOutput, 6);
    
    writeContract({
      address: FX_ENGINE_ADDRESS,
      abi: fxExecutionEngineAbi,
      functionName: 'directSwap',
      args: [direction, amountWei, minOutputWei],
    });
  };
  
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['fxExposure'] });
    queryClient.invalidateQueries({ queryKey: ['currentRates'] });
  }
  
  return {
    swap,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============ Composite Hooks ============

/**
 * Combined FX dashboard data
 */
export function useFXDashboard() {
  const rates = useCurrentRates();
  const exposure = useFXExposure();
  const swapCount = useSwapCount();
  
  return {
    rates: rates.data as RateSnapshot | undefined,
    exposure: exposure.data as FXExposure | undefined,
    swapCount: swapCount.data as bigint | undefined,
    isLoading: rates.isLoading || exposure.isLoading,
    isError: rates.isError || exposure.isError,
    refetch: () => {
      rates.refetch();
      exposure.refetch();
      swapCount.refetch();
    },
  };
}

/**
 * Swap with preview
 */
export function useSwapWithPreview(direction: SwapDirection, amount: string) {
  const preview = usePreviewSwap(direction, amount);
  const { swap: executeSwap, ...swapState } = useDirectSwap();
  
  // Calculate min output with 0.5% slippage
  const minOutput = preview.data 
    ? ((preview.data as bigint) * 9950n / 10000n).toString()
    : '0';
  
  return {
    preview: preview.data as bigint | undefined,
    minOutput,
    isLoadingPreview: preview.isLoading,
    swap: () => executeSwap(direction, amount, minOutput),
    ...swapState,
  };
}
