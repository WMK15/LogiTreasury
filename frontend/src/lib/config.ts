import { http, createConfig } from "wagmi";
import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

/**
 * Arc Testnet Chain Definition
 * Update values based on actual Arc testnet configuration
 */
export const arcTestnet = defineChain({
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1234"),
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "ARC",
    symbol: "ARC",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.arc.testnet"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.arc.testnet",
    },
  },
  testnet: true,
});

/**
 * Contract Addresses
 */
export const CONTRACT_ADDRESSES = {
  payrollArena: (process.env.NEXT_PUBLIC_PAYROLL_ARENA_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

/**
 * Wagmi + RainbowKit Configuration
 */
export const config = getDefaultConfig({
  appName: "PayrollArena",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: true,
});

/**
 * USDC has 6 decimals
 */
export const USDC_DECIMALS = 6;

/**
 * Time constants in seconds
 */
export const TIME = {
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
  ONE_MONTH: 2592000,
} as const;
