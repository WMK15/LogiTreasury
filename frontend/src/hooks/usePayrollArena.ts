"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { PAYROLL_ARENA_ABI, ERC20_ABI } from "@/abi/PayrollArena";
import { CONTRACT_ADDRESSES, USDC_DECIMALS } from "@/lib/config";
import type { PayrollEntry, Milestone } from "@/types";

/**
 * Hook to read employer balance
 */
export function useEmployerBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.payrollArena,
    abi: PAYROLL_ARENA_ABI,
    functionName: "employerBalance",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Hook to read payroll details
 */
export function usePayroll(payrollId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.payrollArena,
    abi: PAYROLL_ARENA_ABI,
    functionName: "getPayroll",
    args: payrollId !== undefined ? [payrollId] : undefined,
    query: {
      enabled: payrollId !== undefined,
    },
  });
}

/**
 * Hook to read milestones for a payroll
 */
export function useMilestones(payrollId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.payrollArena,
    abi: PAYROLL_ARENA_ABI,
    functionName: "getMilestones",
    args: payrollId !== undefined ? [payrollId] : undefined,
    query: {
      enabled: payrollId !== undefined,
    },
  });
}

/**
 * Hook to read claimable amount
 */
export function useClaimableAmount(payrollId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.payrollArena,
    abi: PAYROLL_ARENA_ABI,
    functionName: "getClaimableAmount",
    args: payrollId !== undefined ? [payrollId] : undefined,
    query: {
      enabled: payrollId !== undefined,
    },
  });
}

/**
 * Hook to get employer's payroll IDs
 */
export function useEmployerPayrolls(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.payrollArena,
    abi: PAYROLL_ARENA_ABI,
    functionName: "getEmployerPayrolls",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Hook to get employee's payroll IDs
 */
export function useEmployeePayrolls(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.payrollArena,
    abi: PAYROLL_ARENA_ABI,
    functionName: "getEmployeePayrolls",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Hook to read USDC balance
 */
export function useUSDCBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Hook to read USDC allowance
 */
export function useUSDCAllowance(owner: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: owner ? [owner, CONTRACT_ADDRESSES.payrollArena] : undefined,
    query: {
      enabled: !!owner,
    },
  });
}

/**
 * Hook for USDC approval
 */
export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (amount: string) => {
    const amountInWei = parseUnits(amount, USDC_DECIMALS);
    writeContract({
      address: CONTRACT_ADDRESSES.usdc,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES.payrollArena, amountInWei],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to deposit USDC into PayrollArena
 */
export function useDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = (amount: string) => {
    const amountInWei = parseUnits(amount, USDC_DECIMALS);
    writeContract({
      address: CONTRACT_ADDRESSES.payrollArena,
      abi: PAYROLL_ARENA_ABI,
      functionName: "deposit",
      args: [amountInWei],
    });
  };

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
 * Hook to create a vesting payroll
 */
export function useCreateVestingPayroll() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createPayroll = (params: {
    employee: `0x${string}`;
    amount: string;
    startTime: number;
    endTime: number;
    cliffDuration: number;
    disputeWindow: number;
  }) => {
    const amountInWei = parseUnits(params.amount, USDC_DECIMALS);
    writeContract({
      address: CONTRACT_ADDRESSES.payrollArena,
      abi: PAYROLL_ARENA_ABI,
      functionName: "createVestingPayroll",
      args: [
        params.employee,
        amountInWei,
        BigInt(params.startTime),
        BigInt(params.endTime),
        BigInt(params.cliffDuration),
        BigInt(params.disputeWindow),
      ],
    });
  };

  return {
    createPayroll,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to create a milestone payroll
 */
export function useCreateMilestonePayroll() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createPayroll = (params: {
    employee: `0x${string}`;
    totalAmount: string;
    descriptions: string[];
    amounts: string[];
    disputeWindow: number;
  }) => {
    const totalInWei = parseUnits(params.totalAmount, USDC_DECIMALS);
    const amountsInWei = params.amounts.map((a) => parseUnits(a, USDC_DECIMALS));

    writeContract({
      address: CONTRACT_ADDRESSES.payrollArena,
      abi: PAYROLL_ARENA_ABI,
      functionName: "createMilestonePayroll",
      args: [
        params.employee,
        totalInWei,
        params.descriptions,
        amountsInWei,
        BigInt(params.disputeWindow),
      ],
    });
  };

  return {
    createPayroll,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to claim vested funds
 */
export function useClaimVestedFunds() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = (payrollId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.payrollArena,
      abi: PAYROLL_ARENA_ABI,
      functionName: "claimVestedFunds",
      args: [payrollId],
    });
  };

  return {
    claim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to claim milestone funds
 */
export function useClaimMilestoneFunds() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = (payrollId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.payrollArena,
      abi: PAYROLL_ARENA_ABI,
      functionName: "claimMilestoneFunds",
      args: [payrollId],
    });
  };

  return {
    claim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to mark milestone complete (employee)
 */
export function useMarkMilestoneComplete() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const markComplete = (payrollId: bigint, milestoneIndex: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.payrollArena,
      abi: PAYROLL_ARENA_ABI,
      functionName: "markMilestoneComplete",
      args: [payrollId, milestoneIndex],
    });
  };

  return {
    markComplete,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to approve milestone (employer)
 */
export function useApproveMilestone() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (payrollId: bigint, milestoneIndex: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.payrollArena,
      abi: PAYROLL_ARENA_ABI,
      functionName: "approveMilestone",
      args: [payrollId, milestoneIndex],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to raise dispute (employer)
 */
export function useRaiseDispute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const raiseDispute = (payrollId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.payrollArena,
      abi: PAYROLL_ARENA_ABI,
      functionName: "raiseDispute",
      args: [payrollId],
    });
  };

  return {
    raiseDispute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to resolve dispute (employer)
 */
export function useResolveDispute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const resolveDispute = (payrollId: bigint, releaseToEmployee: boolean) => {
    writeContract({
      address: CONTRACT_ADDRESSES.payrollArena,
      abi: PAYROLL_ARENA_ABI,
      functionName: "resolveDispute",
      args: [payrollId, releaseToEmployee],
    });
  };

  return {
    resolveDispute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
