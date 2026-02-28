"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { parseUnits } from "viem";
import { CONTRACTS, DECIMALS } from "@/lib/config";
import { ERC20_ABI, FREIGHT_ESCROW_ABI, TREASURY_ABI, SETTLEMENT_ABI } from "@/abi";

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
 * ERC20 USDC balance (MockUSDC on testnet)
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
 * USYC balance (Real Hashnote USYC on Arc Testnet)
 * Contract: 0x9fdF14c5B14173D74C08Af27AebFf39240dC105A
 */
export function useUSYCBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.usyc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && CONTRACTS.usyc !== "0x0",
      refetchInterval: 10000, // Refresh every 10s
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

// ============ Escrow Hooks ============

export function useEscrowCount() {
  return useReadContract({
    address: CONTRACTS.freightEscrow,
    abi: FREIGHT_ESCROW_ABI,
    functionName: "escrowCount",
  });
}

export function useShipment(escrowId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.freightEscrow,
    abi: FREIGHT_ESCROW_ABI,
    functionName: "getShipment",
    args: escrowId !== undefined ? [escrowId] : undefined,
    query: { enabled: escrowId !== undefined },
  });
}

export function useShipperEscrows(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.freightEscrow,
    abi: FREIGHT_ESCROW_ABI,
    functionName: "getShipperEscrows",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useCarrierEscrows(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.freightEscrow,
    abi: FREIGHT_ESCROW_ABI,
    functionName: "getCarrierEscrows",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useEscrowYield(escrowId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.freightEscrow,
    abi: FREIGHT_ESCROW_ABI,
    functionName: "getCurrentYield",
    args: escrowId !== undefined ? [escrowId] : undefined,
    query: { enabled: escrowId !== undefined },
  });
}

export function useCreateEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const create = (carrier: `0x${string}`, amount: string, shipmentId: string, origin: string, destination: string) => {
    writeContract({
      address: CONTRACTS.freightEscrow,
      abi: FREIGHT_ESCROW_ABI,
      functionName: "createEscrow",
      args: [carrier, parseUnits(amount, DECIMALS.USDC), shipmentId, origin, destination],
    });
  };

  return { create, hash, isPending, isConfirming, isSuccess, error };
}

export function useFundEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const fund = (escrowId: bigint) => {
    writeContract({
      address: CONTRACTS.freightEscrow,
      abi: FREIGHT_ESCROW_ABI,
      functionName: "fundEscrow",
      args: [escrowId],
    });
  };

  return { fund, hash, isPending, isConfirming, isSuccess, error };
}

export function useConfirmDelivery() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const confirm = (escrowId: bigint) => {
    writeContract({
      address: CONTRACTS.freightEscrow,
      abi: FREIGHT_ESCROW_ABI,
      functionName: "confirmDelivery",
      args: [escrowId],
    });
  };

  return { confirm, hash, isPending, isConfirming, isSuccess, error };
}

export function useReleaseFunds() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const release = (escrowId: bigint) => {
    writeContract({
      address: CONTRACTS.freightEscrow,
      abi: FREIGHT_ESCROW_ABI,
      functionName: "releaseFunds",
      args: [escrowId],
    });
  };

  return { release, hash, isPending, isConfirming, isSuccess, error };
}

// ============ Treasury Hooks ============

export function useTreasuryBalance() {
  return useReadContract({
    address: CONTRACTS.treasury,
    abi: TREASURY_ABI,
    functionName: "getTotalBalance",
  });
}

export function useTreasuryUsdcBalance() {
  return useReadContract({
    address: CONTRACTS.treasury,
    abi: TREASURY_ABI,
    functionName: "usdcBalance",
  });
}

export function useTreasuryUsycShares() {
  return useReadContract({
    address: CONTRACTS.treasury,
    abi: TREASURY_ABI,
    functionName: "usycShares",
  });
}

export function useTreasuryYield() {
  return useReadContract({
    address: CONTRACTS.treasury,
    abi: TREASURY_ABI,
    functionName: "getCurrentYield",
  });
}

export function useTreasuryAPY() {
  return useReadContract({
    address: CONTRACTS.treasury,
    abi: TREASURY_ABI,
    functionName: "getCurrentAPY",
  });
}

export function useDepositToTreasury() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = (amount: string) => {
    writeContract({
      address: CONTRACTS.treasury,
      abi: TREASURY_ABI,
      functionName: "deposit",
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
      address: CONTRACTS.treasury,
      abi: TREASURY_ABI,
      functionName: "withdraw",
      args: [parseUnits(amount, DECIMALS.USDC), to],
    });
  };

  return { withdraw, hash, isPending, isConfirming, isSuccess, error };
}

// ============ Settlement Hooks ============

export function useCurrentFXRate() {
  return useReadContract({
    address: CONTRACTS.settlement,
    abi: SETTLEMENT_ABI,
    functionName: "getCurrentRate",
  });
}

export function useQuoteUsdcToEurc(amount: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.settlement,
    abi: SETTLEMENT_ABI,
    functionName: "quoteUsdcToEurc",
    args: amount ? [amount] : undefined,
    query: { enabled: !!amount && amount > 0n },
  });
}

export function useSettlementHistory(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.settlement,
    abi: SETTLEMENT_ABI,
    functionName: "getUserSettlements",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useSettleUsdcToEurc() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const settle = (amount: string, minEurc: string, recipient: `0x${string}`, reference: string) => {
    writeContract({
      address: CONTRACTS.settlement,
      abi: SETTLEMENT_ABI,
      functionName: "settleUsdcToEurc",
      args: [parseUnits(amount, DECIMALS.USDC), parseUnits(minEurc, DECIMALS.EURC), recipient, reference],
    });
  };

  return { settle, hash, isPending, isConfirming, isSuccess, error };
}


