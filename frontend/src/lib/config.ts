import { http } from "wagmi";
import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

/**
 * Arc Testnet Chain Definition
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: process.env.NEXT_PUBLIC_EXPLORER_URL || "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

/**
 * Contract Addresses
 */
export const CONTRACTS = {
  usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x0") as `0x${string}`,
  eurc: (process.env.NEXT_PUBLIC_EURC_ADDRESS || "0x0") as `0x${string}`,
  usyc: (process.env.NEXT_PUBLIC_USYC_ADDRESS || "0x0") as `0x${string}`,
  stableFx: (process.env.NEXT_PUBLIC_STABLEFX_ADDRESS || "0x0") as `0x${string}`,
  freightEscrow: (process.env.NEXT_PUBLIC_FREIGHT_ESCROW_ADDRESS || "0x0") as `0x${string}`,
  treasury: (process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "0x0") as `0x${string}`,
  settlement: (process.env.NEXT_PUBLIC_SETTLEMENT_ADDRESS || "0x0") as `0x${string}`,
  batchPayroll: (process.env.NEXT_PUBLIC_BATCH_PAYROLL_ADDRESS || "0x0") as `0x${string}`,
} as const;

/**
 * Wagmi + RainbowKit Configuration
 */
export const config = getDefaultConfig({
  appName: "LogiTreasury",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: true,
});

/**
 * Token decimals
 */
export const DECIMALS = {
  USDC: 6,
  EURC: 6,
  USYC: 6,
} as const;

/**
 * Format helpers
 */
export function formatUSDC(value: bigint): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) / 1e6);
}

export function formatEUR(value: bigint): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) / 1e6);
}

export function formatPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
