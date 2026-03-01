"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { parseUnits } from "viem";
import { CONTRACTS, DECIMALS } from "@/lib/config";
import { ERC20_ABI } from "@/abi";
import { treasuryManagerAbi } from "@/abi/TreasuryManager";
import { settlementRouterAbi } from "@/abi/SettlementRouter";

// ============ Token Hooks ============

/**
 * Native USDC balance (Arc Testnet uses USDC as native gas token)
 */
export function useNativeUSDCBalance(address: `0x${string}` | undefined) {
  return useBalance({
    address,
    query: { enabled: !!address },
  });
}

/**
 * ERC20 USDC balance
 */
export function useUSDCBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useEURCBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.eurc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

/**
 * USYC balance (Hashnote T-Bill token on Arc Testnet)
 */
export function useUSYCBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.usyc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && CONTRACTS.usyc !== "0x0",
      refetchInterval: 10000,
    },
  });
}

export function useApproveToken(tokenAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (spender: `0x${string}`, amount: string, decimals = 6) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, parseUnits(amount, decimals)],
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

// ============ Escrow Hooks (via SettlementRouter) ============

export function useEscrowCount() {
  return useReadContract({
    address: CONTRACTS.settlementRouter,
    abi: settlementRouterAbi,
    functionName: "totalSettled",
  });
}

export function useCreateEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const create = (carrier: `0x${string}`, amount: string, _shipmentId: string, _origin: string, _destination: string) => {
    writeContract({
      address: CONTRACTS.settlementRouter,
      abi: settlementRouterAbi,
      functionName: "initiateSettlement",
      args: [carrier, 5042002n, CONTRACTS.usdc, parseUnits(amount, DECIMALS.USDC), _shipmentId],
    });
  };

  return { create, hash, isPending, isConfirming, isSuccess, error };
}

// ============ Treasury Hooks (via TreasuryManager) ============

export function useTreasuryBalance() {
  return useReadContract({
    address: CONTRACTS.treasuryManager,
    abi: treasuryManagerAbi,
    functionName: "getBalanceSnapshot",
  });
}

export function useTreasuryUsdcBalance() {
  return useReadContract({
    address: CONTRACTS.treasuryManager,
    abi: treasuryManagerAbi,
    functionName: "getAvailableBalance",
  });
}

export function useTreasuryYield() {
  return useReadContract({
    address: CONTRACTS.treasuryManager,
    abi: treasuryManagerAbi,
    functionName: "getCurrentYieldRate",
  });
}

export function useTreasuryAPY() {
  return useReadContract({
    address: CONTRACTS.treasuryManager,
    abi: treasuryManagerAbi,
    functionName: "getCurrentYieldRate",
  });
}

export function useDepositToTreasury() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = (amount: string) => {
    writeContract({
      address: CONTRACTS.treasuryManager,
      abi: treasuryManagerAbi,
      functionName: "depositUsdc",
      args: [parseUnits(amount, DECIMALS.USDC)],
    });
  };

  return { deposit, hash, isPending, isConfirming, isSuccess, error };
}

export function useWithdrawFromTreasury() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = (amount: string, to: `0x${string}`) => {
    writeContract({
      address: CONTRACTS.treasuryManager,
      abi: treasuryManagerAbi,
      functionName: "withdrawUsdc",
      args: [parseUnits(amount, DECIMALS.USDC), to, "withdrawal"],
    });
  };

  return { withdraw, hash, isPending, isConfirming, isSuccess, error };
}

// ============ Settlement Hooks (via SettlementRouter) ============

export function useCurrentFXRate() {
  return useReadContract({
    address: CONTRACTS.settlementRouter,
    abi: settlementRouterAbi,
    functionName: "totalSettled",
  });
}

export function useQuoteUsdcToEurc(amount: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.settlementRouter,
    abi: settlementRouterAbi,
    functionName: "getRouteQuote",
    args: amount ? [5042002n, amount] : undefined,
    query: { enabled: !!amount && amount > 0n },
  });
}

export function useSettlementHistory(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.settlementRouter,
    abi: settlementRouterAbi,
    functionName: "getUserSettlements",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useSettleUsdcToEurc() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const settle = (amount: string, _minEurc: string, recipient: `0x${string}`, reference: string) => {
    writeContract({
      address: CONTRACTS.settlementRouter,
      abi: settlementRouterAbi,
      functionName: "initiateSettlement",
      args: [recipient, 5042002n, CONTRACTS.usdc, parseUnits(amount, DECIMALS.USDC), reference],
    });
  };

  return { settle, hash, isPending, isConfirming, isSuccess, error };
}
