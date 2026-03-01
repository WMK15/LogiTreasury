import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { cpnGatewayAbi } from '@/abi/CPNGateway';
import { parseUnits } from 'viem';
import { CONTRACTS } from '@/lib/config';
import type { BankAccount, FiatDeposit, FiatWithdrawal } from '@/types/treasury';

const CPN_GATEWAY_ADDRESS = CONTRACTS.cpnGateway;

// ============ Read Hooks ============

export function useUserBankAccounts() {
  const { address } = useAccount();

  return useReadContract({
    address: CPN_GATEWAY_ADDRESS,
    abi: cpnGatewayAbi,
    functionName: 'getUserBankAccounts',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useBankAccount(accountId: `0x${string}` | undefined) {
  return useReadContract({
    address: CPN_GATEWAY_ADDRESS,
    abi: cpnGatewayAbi,
    functionName: 'getBankAccount',
    args: accountId ? [accountId] : undefined,
    query: { enabled: !!accountId },
  });
}

export function useUserDeposits() {
  const { address } = useAccount();

  return useReadContract({
    address: CPN_GATEWAY_ADDRESS,
    abi: cpnGatewayAbi,
    functionName: 'getUserDeposits',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useUserWithdrawals() {
  const { address } = useAccount();

  return useReadContract({
    address: CPN_GATEWAY_ADDRESS,
    abi: cpnGatewayAbi,
    functionName: 'getUserWithdrawals',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useDailyLimitsStatus() {
  return useReadContract({
    address: CPN_GATEWAY_ADDRESS,
    abi: cpnGatewayAbi,
    functionName: 'getDailyLimitsStatus',
    query: { refetchInterval: 30000 },
  });
}

// ============ Write Hooks ============

export function useAddBankAccount() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addAccount = (bankName: string, accountNumber: string, routingNumber: string, currency: string, country: string) => {
    writeContract({
      address: CPN_GATEWAY_ADDRESS,
      abi: cpnGatewayAbi,
      functionName: 'addBankAccount',
      args: [bankName, accountNumber, routingNumber, currency, country],
    });
  };

  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['userBankAccounts'] });
  }

  return { addAccount, hash, isPending, isConfirming, isSuccess, error };
}

export function useInitiateDeposit() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const initiate = (bankAccountId: `0x${string}`, fiatAmount: string, currency: string, memo: string) => {
    // Treat fiatAmount as a decimal up to two places, e.g. 100.50 -> 10050 cents
    const amountInCents = BigInt(Math.floor(parseFloat(fiatAmount) * 100));
    writeContract({
      address: CPN_GATEWAY_ADDRESS,
      abi: cpnGatewayAbi,
      functionName: 'initiateDeposit',
      args: [bankAccountId, amountInCents, currency, memo],
    });
  };

  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['userDeposits'] });
  }

  return { initiate, hash, isPending, isConfirming, isSuccess, error };
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const request = (bankAccountId: `0x${string}`, usdcAmount: string, memo: string) => {
    const amountWei = parseUnits(usdcAmount, 6);
    writeContract({
      address: CPN_GATEWAY_ADDRESS,
      abi: cpnGatewayAbi,
      functionName: 'requestWithdrawal',
      args: [bankAccountId, amountWei, memo],
    });
  };

  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['userWithdrawals'] });
  }

  return { request, hash, isPending, isConfirming, isSuccess, error };
}
