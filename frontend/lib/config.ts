import { http, createConfig } from "wagmi";
import { defineChain } from "viem";
import { injected, walletConnect } from "wagmi/connectors";

/**
 * Network Mode - 'local' for Hardhat, 'testnet' for Arc Testnet
 */
const NETWORK_MODE = process.env.NEXT_PUBLIC_NETWORK_MODE || "local";
const isLocal = NETWORK_MODE === "local";

/**
 * Local Hardhat Chain Definition
 */
export const localHardhat = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_LOCAL_RPC_URL || "http://127.0.0.1:8545"],
    },
  },
  testnet: true,
});

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
 * Active chain based on network mode
 */
export const activeChain = isLocal ? localHardhat : arcTestnet;

/**
 * Contract Addresses - switches based on network mode
 */
export const CONTRACTS = isLocal ? {
  // Local Hardhat addresses
  usdc: (process.env.NEXT_PUBLIC_LOCAL_USDC_ADDRESS || "0x0") as `0x${string}`,
  eurc: (process.env.NEXT_PUBLIC_LOCAL_EURC_ADDRESS || "0x0") as `0x${string}`,
  usyc: (process.env.NEXT_PUBLIC_LOCAL_USYC_ADDRESS || "0x0") as `0x${string}`,
  stableFx: (process.env.NEXT_PUBLIC_LOCAL_STABLEFX_ADDRESS || "0x0") as `0x${string}`,
  treasuryManager: (process.env.NEXT_PUBLIC_LOCAL_TREASURY_MANAGER_ADDRESS || "0x0") as `0x${string}`,
  yieldVaultAdapter: (process.env.NEXT_PUBLIC_LOCAL_YIELD_VAULT_ADAPTER_ADDRESS || "0x0") as `0x${string}`,
  fxEngine: (process.env.NEXT_PUBLIC_LOCAL_FX_ENGINE_ADDRESS || "0x0") as `0x${string}`,
  settlementRouter: (process.env.NEXT_PUBLIC_LOCAL_SETTLEMENT_ROUTER_ADDRESS || "0x0") as `0x${string}`,
  cpnGateway: (process.env.NEXT_PUBLIC_LOCAL_CPN_GATEWAY_ADDRESS || "0x0") as `0x${string}`,
  // Legacy addresses (keep for backwards compat)
  treasury: (process.env.NEXT_PUBLIC_LOCAL_TREASURY_MANAGER_ADDRESS || "0x0") as `0x${string}`,
  freightEscrow: "0x0" as `0x${string}`,
  settlement: (process.env.NEXT_PUBLIC_LOCAL_SETTLEMENT_ROUTER_ADDRESS || "0x0") as `0x${string}`,
  batchPayroll: "0x0" as `0x${string}`,
} as const : {
  // Arc Testnet addresses
  usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x0") as `0x${string}`,
  eurc: (process.env.NEXT_PUBLIC_EURC_ADDRESS || "0x0") as `0x${string}`,
  usyc: (process.env.NEXT_PUBLIC_USYC_ADDRESS || "0x0") as `0x${string}`,
  stableFx: (process.env.NEXT_PUBLIC_STABLEFX_ADDRESS || "0x0") as `0x${string}`,
  treasuryManager: (process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "0x0") as `0x${string}`,
  yieldVaultAdapter: "0x0" as `0x${string}`,
  fxEngine: "0x0" as `0x${string}`,
  settlementRouter: (process.env.NEXT_PUBLIC_SETTLEMENT_ADDRESS || "0x0") as `0x${string}`,
  cpnGateway: "0x0" as `0x${string}`,
  // Legacy addresses
  treasury: (process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "0x0") as `0x${string}`,
  freightEscrow: (process.env.NEXT_PUBLIC_FREIGHT_ESCROW_ADDRESS || "0x0") as `0x${string}`,
  settlement: (process.env.NEXT_PUBLIC_SETTLEMENT_ADDRESS || "0x0") as `0x${string}`,
  batchPayroll: (process.env.NEXT_PUBLIC_BATCH_PAYROLL_ADDRESS || "0x0") as `0x${string}`,
} as const;

/**
 * Wagmi Configuration
 */
export const config = createConfig({
  chains: [activeChain],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
    }),
  ],
  transports: {
    [activeChain.id]: http(),
  } as Record<number, ReturnType<typeof http>>,
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

/**
 * Network info
 */
export const NETWORK_INFO = {
  mode: NETWORK_MODE,
  isLocal,
  chainId: activeChain.id,
  chainName: activeChain.name,
};
