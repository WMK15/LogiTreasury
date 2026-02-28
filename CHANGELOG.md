# Changelog

All notable changes to the ArcLogistics Treasury project are documented here.

---

## [Unreleased] - Hackathon Final Sprint

### Planned
- **Real USYC Integration** - Connect to Hashnote USYC on Arc Testnet via usyc.dev.hashnote.com
- **StableFX API Integration** - Implement RFQ flow with Circle StableFX API
- **Escrow GPS/Signature Toggles** - Demo simulation for delivery verification
- **Fiat Demo Mode** - Pre-populated mock bank account for CPN demo
- **Deep Savings Counter** - Prominent yield display

---

## [0.4.3] - 2026-02-28

### Added
- **Skeleton loading animations** - Added pulse loading skeletons across all pages:
  - Homepage KPIs show skeleton while data loads
  - Transaction history with skeleton rows
  - Escrow page with card skeletons
  - Settlement page with balance and rate skeletons
  - Payroll page with KPI skeletons
  - Fiat page with limits skeletons
  - Treasury page fully wired to hooks with skeletons

### Fixed
- **Treasury page** - Now wired to actual `useTreasuryDashboard` hook instead of hardcoded values
  - Shows real balance, liquid, yield accrued, APY
  - Shows both native USDC and ERC20 USDC balances
  - Allocation bar reflects actual yield percentage

---

## [0.4.2] - 2026-02-28

### Added
- **Native USDC balance support** - Arc Testnet uses USDC as native gas token:
  - Added `useNativeUSDCBalance` hook using Wagmi's `useBalance`
  - Homepage now shows both Native USDC (gas token) and ERC20 USDC (MockUSDC)
  - 5-column KPI layout: Native USDC, ERC20 USDC, EURC, Escrows, Batches

### Changed
- **Network mode** - Switched to Arc Testnet (`NEXT_PUBLIC_NETWORK_MODE=testnet`)

---

## [0.4.1] - 2026-02-28

### Fixed
- **TypeScript build errors**:
  - Fixed duplicate `swap` property in `useFX.ts` return object (destructured to avoid collision)
  - Fixed enum imports in service files - `DepositStatus`, `WithdrawalStatus`, `SwapDirection`, `SettlementStatus` now imported as values (not `import type`) since they're used as runtime values
  - `tsconfig.json` target set to `ES2020` for BigInt literal support

---

## [0.4.0] - 2026-02-28

### Added
- **shadcn/ui integration** - Proper component library setup:
  - `components.json` configuration file
  - CSS variables for theming in `globals.css`
  - Core components: Button, Card, Input, Label, Badge, Dialog, Tabs, DropdownMenu, Skeleton, Tooltip
  - Radix UI primitives as foundation

- **StableFX API support** - Server-side API key configuration:
  - `STABLEFX_API_KEY` environment variable
  - `STABLEFX_API_URL` endpoint configuration
  - `CIRCLE_API_KEY` for CPN integration

### Changed
- **Frontend restructure** - Moved from `src/` to root-level folders:
  - `src/app/` → `app/`
  - `src/components/` → `components/`
  - `src/hooks/` → `hooks/`
  - `src/lib/` → `lib/`
  - `src/abi/` → `abi/`
  - `src/types/` → `types/`

- **Config updates**:
  - `tsconfig.json` - Updated `@/*` alias from `./src/*` to `./*`
  - `tailwind.config.ts` - Removed `./src/` prefix from content paths
  - `tailwind.config.ts` - Added shadcn CSS variable colors and animations

- **Dependencies**:
  - Added `class-variance-authority` for component variants
  - Added `@radix-ui/*` packages for primitives
  - Added `lucide-react` for icons
  - Added `tailwindcss-animate` for animations

- **Environment files**:
  - Updated `.env.example` with full configuration template
  - Added API key placeholders for StableFX and Circle

### Removed
- **RainbowKit** - Fully removed (was already not in use)
- **`src/` folder** - Flattened to root structure

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
| 0.4.0 | 2026-02-28 | shadcn/ui setup, folder restructure, StableFX API support |
| 0.3.0 | 2026-02-28 | Treasury suite (5 new contracts), local deployment |
| 0.2.0 | 2026-02-27 | Dashboard components, services, hooks, APIs |
| 0.1.0 | 2026-02-26 | Initial setup, core contracts, Arc Testnet deployment |
