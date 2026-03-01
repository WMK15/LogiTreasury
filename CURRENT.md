# ArcLogistics Treasury - Current State

> Last Updated: February 28, 2026

## Overview

**ArcLogistics Treasury** (LogiTreasury) is an enterprise-grade unified logistics treasury and payout engine for European logistics companies. The system ensures no capital sits idle through automated yield optimization, instant FX conversion, cross-chain settlement, and fiat integration.

## Project Structure

```
PayrollArena/
├── contracts/                    # Solidity smart contracts
│   ├── src/
│   │   ├── core/                # TreasuryManager
│   │   ├── adapters/            # YieldVaultAdapter (USYC)
│   │   ├── fx/                  # FXExecutionEngine (StableFX)
│   │   ├── bridge/              # SettlementRouter (Arc Bridge Kit)
│   │   └── fiat/                # CPNGateway (Circle CPN)
│   ├── interfaces/              # Contract interfaces (IERC20, IEURC, IStableFX, IUSYC)
│   ├── scripts/                 # deploy-treasury-suite.ts
│   └── test/                    # TreasuryManager.test.ts
├── frontend/                    # Next.js 14 frontend
│   ├── app/                     # App router pages (/, /analytics, /settlements)
│   ├── components/              # React components (shadcn/ui)
│   ├── hooks/                   # Custom hooks (useContracts, useTreasury, useFX, etc.)
│   ├── lib/                     # Utilities, config, Supabase client
│   ├── abi/                     # Treasury Suite ABIs + ERC20
│   └── types/                   # TypeScript types
├── supabase/                    # migration.sql
├── CURRENT.md                   # This file
├── CHANGELOG.md                 # Version history
├── README.md                    # Project documentation
└── ARCHITECTURE.md              # System architecture
```

---

## Smart Contracts (Treasury Suite)

| Contract              | Location                                       | Status   | Description                                                 |
| --------------------- | ---------------------------------------------- | -------- | ----------------------------------------------------------- |
| **TreasuryManager**   | `contracts/src/core/TreasuryManager.sol`       | Deployed | Central orchestration, unified balance, auto-sweep to yield |
| **YieldVaultAdapter** | `contracts/src/adapters/YieldVaultAdapter.sol` | Deployed | USYC integration, yield tracking, cost basis                |
| **FXExecutionEngine** | `contracts/src/fx/FXExecutionEngine.sol`       | Deployed | StableFX RFQ, USDC/EURC swaps, exposure monitoring          |
| **SettlementRouter**  | `contracts/src/bridge/SettlementRouter.sol`    | Deployed | Arc Bridge Kit, multi-chain routing                         |
| **CPNGateway**        | `contracts/src/fiat/CPNGateway.sol`            | Deployed | Circle Payments Network, fiat on/off ramp                   |

> Legacy contracts (FreightEscrow, Treasury, Settlement, BatchPayroll) and mock tokens (MockUSDC/EURC/USYC/StableFX) were removed in the final cleanup. The frontend now uses real on-chain tokens.

---

## Deployed Addresses

### Arc Testnet (Chain ID: 5042002)

```
# Treasury Suite
TreasuryManager:    0xB535b93cF7C249CE99965c22e952EFa322b2e4f9
YieldVaultAdapter:  0x9cD4aD9E9CD6d796e67a1369926ED50349137EA9
FXExecutionEngine:  0x63129e847496AA9931B48A827F82C45ddaDBd289
SettlementRouter:   0x6Ab2464aBd8205A1581C7011e0EeD104a11E905D
CPNGateway:         0x43b3910E08c10551B0E0B0630dEA3d27a0d3995c

# Tokens (Real / Testnet)
USDC:               Native gas token (Arc Testnet)
USYC:               0x9fdF14c5B14173D74C08Af27AebFf39240dC105A (Hashnote)
EURC:               via env NEXT_PUBLIC_EURC_ADDRESS
```

---

## Frontend

### Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui components
- Wagmi v2 + Viem (custom wallet connection)
- React Query
- Supabase (audit trail, companies, transactions)

### Pages

| Route          | Status  | Description                                                      |
| -------------- | ------- | ---------------------------------------------------------------- |
| `/`            | Working | Dashboard — total liquidity, wallet balances, AI recommendations |
| `/analytics`   | Working | FX exposure, USYC yield over time, audit trail                   |
| `/settlements` | Working | Payment obligations, locked funds, release history               |

### Key Components

| Component     | Location                              | Purpose                           |
| ------------- | ------------------------------------- | --------------------------------- |
| Sidebar       | `components/ui/Sidebar.tsx`           | Navigation (3 pages)              |
| AuditTrail    | `components/analytics/AuditTrail.tsx` | Tax & compliance records          |
| EscrowCard    | `components/escrow/EscrowCard.tsx`    | Settlement card with verification |
| ConnectWallet | `components/ui/ConnectWallet.tsx`     | Wallet connection (shadcn/ui)     |

### Hooks

| Hook               | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `useContracts.ts`  | Token balances (native + ERC20), escrow, settlement |
| `useTreasury.ts`   | Treasury manager operations                         |
| `useFX.ts`         | FX engine swaps                                     |
| `useSettlement.ts` | Cross-chain settlement                              |
| `useCPN.ts`        | Fiat on/off ramp                                    |

### ABIs

| ABI File               | Contract           |
| ---------------------- | ------------------ |
| `TreasuryManager.ts`   | TreasuryManager    |
| `YieldVaultAdapter.ts` | YieldVaultAdapter  |
| `FXExecutionEngine.ts` | FXExecutionEngine  |
| `SettlementRouter.ts`  | SettlementRouter   |
| `CPNGateway.ts`        | CPNGateway         |
| `index.ts`             | ERC20 standard ABI |

---

## Configuration

### Environment Variables

```bash
# Network mode: 'local' or 'testnet'
NEXT_PUBLIC_NETWORK_MODE=testnet

# Arc Testnet
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network

# Contract addresses
NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_YIELD_ADAPTER_ADDRESS=0x...
NEXT_PUBLIC_FX_ENGINE_ADDRESS=0x...
NEXT_PUBLIC_SETTLEMENT_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_CPN_GATEWAY_ADDRESS=0x...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-project-id>
```

### Running Locally

```bash
# Start frontend
cd frontend
npm run dev
```

---

## Key Integrations

| Integration        | Contract          | Purpose                        |
| ------------------ | ----------------- | ------------------------------ |
| **USYC**           | YieldVaultAdapter | Yield on idle capital          |
| **StableFX**       | FXExecutionEngine | Real-time USDC/EURC conversion |
| **Arc Bridge Kit** | SettlementRouter  | Cross-chain settlements        |
| **CPN**            | CPNGateway        | Fiat on/off ramp               |
| **Circle Gateway** | TreasuryManager   | Unified balance view           |

---

## Known Issues

1. **Arc Testnet native currency** — Arc uses USDC as native gas token (not ETH). App supports both native USDC and ERC20 tokens.
2. **Transaction history** — Fully wired to Supabase live data via `getSettlementHistory` Server Action.
3. **Supabase** — Audit trail and Dashboard actively querying `companies`, `transactions`, `audit_trail`, `bank_accounts`, and `asset_balances` tables.

---

## Integration Status

| Integration       | Status  | Notes                                    |
| ----------------- | ------- | ---------------------------------------- |
| **USYC (Yield)**  | ✅ Real | Hashnote USYC on Arc Testnet             |
| **StableFX (FX)** | ⚠️ Mock | Have API key, need to implement RFQ flow |
| **CPN (Fiat)**    | ✅ Real | Live connected to Supabase fiat reserves |
| **Arc Bridge**    | ✅ Real | Transaction list wired to Supabase db    |
