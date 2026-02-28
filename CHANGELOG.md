# Changelog

All notable changes to the ArcLogistics Treasury project are documented here.

---

## [0.3.0] - 2026-02-28

### Added
- **TreasuryManager contract** - Central treasury orchestration with:
  - Unified balance view across chains
  - Auto-sweep idle capital to USYC
  - Multi-operator role-based access
  - Large withdrawal approval queue
  - Escrow integration hooks
  
- **YieldVaultAdapter contract** - USYC integration with:
  - Deposit/redeem functionality
  - Cost basis tracking for accurate yield calculation
  - Unrealized/realized yield metrics
  - Current APY fetching

- **FXExecutionEngine contract** - StableFX RFQ integration with:
  - USDC to EURC and EURC to USDC swaps
  - Quote request/accept/execute workflow
  - Slippage protection
  - FX exposure monitoring
  - Rate history tracking

- **SettlementRouter contract** - Arc Bridge Kit integration with:
  - Multi-chain routing (Arc, Ethereum, Arbitrum, Polygon, Base)
  - Batch settlement support
  - Route optimization
  - Fee calculation
  - Settlement status tracking

- **CPNGateway contract** - Circle Payments Network integration with:
  - Fiat deposit flow (bank to USDC)
  - Fiat withdrawal flow (USDC to bank)
  - Bank account management
  - Reconciliation records
  - Compliance audit trail

- **Deployment script** - `scripts/deploy-treasury-suite.ts` for deploying all new contracts

- **Frontend config** - Support for both local Hardhat and Arc Testnet via `NETWORK_MODE`

### Fixed
- **FXExecutionEngine** - Corrected IStableFX method calls:
  - `swap()` now uses correct 5-parameter signature
  - `getExchangeRate()` replaces non-existent `getRate()`
  - `quote()` used correctly for previews

### Changed
- Frontend config now dynamically switches contract addresses based on network mode
- Added `NETWORK_INFO` export for displaying current network in UI

---

## [0.2.0] - 2026-02-27

### Added
- **Dashboard components**:
  - DashboardLayout
  - BalanceOverview
  - YieldCard
  - FXWidget
  - ChainBalances
  - StatsCard

- **Frontend services**:
  - treasury.service.ts
  - fx.service.ts
  - settlement.service.ts
  - cpn.service.ts

- **Frontend hooks**:
  - useTreasury.ts
  - useFX.ts
  - useSettlement.ts

- **API routes**:
  - /api/treasury/balance
  - /api/treasury/yield
  - /api/fx/rates
  - /api/fx/quote
  - /api/settlement/chains
  - /api/settlement/route

- **Contract ABIs** for frontend integration

- **Type definitions** in `types/treasury.ts`

- **Documentation**:
  - ARCHITECTURE.md with system diagrams
  - Updated README.md

### Changed
- Added `clsx` and `tailwind-merge` dependencies
- Created `cn()` utility function

---

## [0.1.0] - 2026-02-26

### Added
- **Initial project setup**
- **FreightEscrow contract** - Escrow for freight payments with:
  - Escrow creation and funding
  - Delivery confirmation
  - Dispute handling
  - Yield generation on locked funds

- **Treasury contract** - Basic treasury with:
  - USDC deposits/withdrawals
  - USYC yield integration

- **Settlement contract** - FX settlement with:
  - USDC to EURC conversion
  - StableFX integration

- **BatchPayroll contract** - Batch payments with:
  - Multi-recipient USDC payments
  - Multi-recipient EURC payments

- **Mock contracts**:
  - MockUSDC
  - MockEURC
  - MockUSYC
  - MockStableFX

- **Frontend scaffolding**:
  - Next.js 14 with App Router
  - TailwindCSS setup
  - RainbowKit + Wagmi integration
  - Basic page structure

- **Deployment to Arc Testnet**:
  - All mock tokens deployed
  - Original contracts deployed

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.3.0 | 2026-02-28 | Treasury suite (5 new contracts), local deployment |
| 0.2.0 | 2026-02-27 | Dashboard components, services, hooks, APIs |
| 0.1.0 | 2026-02-26 | Initial setup, core contracts, Arc Testnet deployment |
