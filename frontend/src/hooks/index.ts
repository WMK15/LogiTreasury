/**
 * Hooks Index
 * Clean exports for all treasury hooks
 */

// Treasury Hooks
export {
  useBalanceSnapshot,
  useAvailableBalance,
  useCurrentYieldRate,
  useYieldConfig,
  useYieldMetrics,
  useNeedsRebalancing,
  useUnifiedBalance,
  useDepositUsdc,
  useWithdrawUsdc,
  useSweepToYield,
  useHarvestYield,
  useRebalance,
  useRedeemFromYield,
  useTreasuryDashboard,
} from './useTreasury';

// FX Hooks
export {
  useCurrentRates,
  usePreviewSwap,
  useFXExposure,
  useQuote,
  useUserQuotes,
  useSwapCount,
  useRequestUsdcToEurcQuote,
  useRequestEurcToUsdcQuote,
  useAcceptQuote,
  useExecuteQuote,
  useDirectSwap,
  useFXDashboard,
  useSwapWithPreview,
} from './useFX';

// Settlement Hooks
export {
  useSupportedChains,
  useChainConfig,
  useIsChainSupported,
  useRouteQuote,
  useOptimalRoute,
  useSettlement,
  useUserSettlements,
  useBatchSettlement,
  useChainVolume,
  useInitiateSettlement,
  useInitiateBatchSettlement,
  useSettlementWithQuote,
  useAllChainConfigs,
} from './useSettlement';

// Legacy hooks
export * from './useContracts';
