# ArcLogistics Treasury - Current State

> Last Updated: February 28, 2026

## Overview

**ArcLogistics Treasury** is an enterprise-grade unified logistics treasury and payout engine for European logistics companies. The system ensures no capital sits idle through automated yield optimization, instant FX conversion, cross-chain settlement, and fiat integration.

## Project Structure

```
PayrollArena/
├── contracts/                    # Solidity smart contracts
│   ├── src/
│   │   ├── core/                # Core treasury contracts
│   │   ├── adapters/            # Protocol adapters
│   │   ├── fx/                  # FX execution
│   │   ├── bridge/              # Cross-chain settlement
│   │   ├── fiat/                # Fiat integration
│   │   └── mocks/               # Mock contracts
│   ├── interfaces/              # Contract interfaces
│   ├── scripts/                 # Deployment scripts
│   └── test/                    # Contract tests
├── frontend/                    # Next.js 14 frontend
│   ├── app/                     # App router pages
│   ├── components/              # React components (shadcn/ui)
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilities & config
│   ├── abi/                     # Contract ABIs
│   ├── types/                   # TypeScript types
│   ├── components.json          # shadcn/ui config
│   └── public/                  # Static assets
├── CURRENT.md                   # This file
├── CHANGELOG.md                 # Version history
├── AGENTS.md                    # AI agent instructions
├── README.md                    # Project documentation
└── ARCHITECTURE.md              # System architecture
```

---

## Smart Contracts

### Treasury Suite (NEW)

| Contract              | Location                                       | Status   | Description                                                 |
| --------------------- | ---------------------------------------------- | -------- | ----------------------------------------------------------- |
| **TreasuryManager**   | `contracts/src/core/TreasuryManager.sol`       | Deployed | Central orchestration, unified balance, auto-sweep to yield |
| **YieldVaultAdapter** | `contracts/src/adapters/YieldVaultAdapter.sol` | Deployed | USYC integration, yield tracking, cost basis                |
| **FXExecutionEngine** | `contracts/src/fx/FXExecutionEngine.sol`       | Deployed | StableFX RFQ, USDC/EURC swaps, exposure monitoring          |
| **SettlementRouter**  | `contracts/src/bridge/SettlementRouter.sol`    | Deployed | Arc Bridge Kit, multi-chain routing                         |
| **CPNGateway**        | `contracts/src/fiat/CPNGateway.sol`            | Deployed | Circle Payments Network, fiat on/off ramp                   |

### Original Contracts

| Contract          | Location                          | Status   | Description                            |
| ----------------- | --------------------------------- | -------- | -------------------------------------- |
| **FreightEscrow** | `contracts/src/FreightEscrow.sol` | Deployed | Escrow for freight payments with yield |
| **Treasury**      | `contracts/src/Treasury.sol`      | Deployed | Basic treasury with USYC               |
| **Settlement**    | `contracts/src/Settlement.sol`    | Deployed | USDC to EURC settlement                |
| **BatchPayroll**  | `contracts/src/BatchPayroll.sol`  | Deployed | Batch payment processing               |

### Mock Contracts

| Contract     | Purpose                          |
| ------------ | -------------------------------- |
| MockUSDC     | ERC20 test token with mint       |
| MockEURC     | ERC20 test token with mint       |
| MockUSYC     | Simulated yield vault (4.5% APY) |
| MockStableFX | Simulated FX (0.92 EUR/USD rate) |

---

## Deployed Addresses

### Local Hardhat (Chain ID: 31337)

```
# Tokens
MockUSDC:           0x5FbDB2315678afecb367f032d93F642f64180aa3
MockEURC:           0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
MockUSYC:           0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
MockStableFX:       0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

# Treasury Suite
TreasuryManager:    0x610178dA211FEF7D417bC0e6FeD39F05609AD788
YieldVaultAdapter:  0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
FXExecutionEngine:  0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
SettlementRouter:   0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0
CPNGateway:         0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
```

### Arc Testnet (Chain ID: 5042002)

```
# Tokens (deployed)
MockUSDC:     0x5D2EF4689bd78E78aC6f25cBAb601B74a16597cB
MockEURC:     0x889dbe4EdD1A8b83BB34dD10CBc0e30725490dC9
MockUSYC:     0xfE7E6B7C10C59796Ed887774f83d80aa3865366D
MockStableFX: 0x1743B520179E2dbAabBC8587661CC5b7bE42f7c4

# Treasury Suite
TreasuryManager:    0xB535b93cF7C249CE99965c22e952EFa322b2e4f9
YieldVaultAdapter:  0x9cD4aD9E9CD6d796e67a1369926ED50349137EA9
FXExecutionEngine:  0x63129e847496AA9931B48A827F82C45ddaDBd289
SettlementRouter:   0x6Ab2464aBd8205A1581C7011e0EeD104a11E905D
CPNGateway:         0x43b3910E08c10551B0E0B0630dEA3d27a0d3995c
```

---

## Frontend

### Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui components
- Wagmi v2 + Viem (custom wallet connection, no RainbowKit)
- React Query

### Pages

| Route         | Status  | Description                   |
| ------------- | ------- | ----------------------------- |
| `/`           | Working | Overview with native + ERC20 USDC balances + skeletons |
| `/treasury`   | Working | Treasury dashboard with live data + skeletons |
| `/escrow`     | Working | Freight escrow management + skeletons |
| `/settlement` | Working | USDC to EURC conversion + skeletons |
| `/payroll`    | Working | Batch payroll processing + skeletons |
| `/fiat`       | Working | CPN fiat on/off ramp + skeletons |

### Components

| Component       | Location                                   | Purpose          |
| --------------- | ------------------------------------------ | ---------------- |
| Sidebar         | `components/ui/Sidebar.tsx`                | Navigation       |
| DashboardLayout | `components/dashboard/DashboardLayout.tsx` | Layout wrapper   |
| BalanceOverview | `components/dashboard/BalanceOverview.tsx` | Balance cards    |
| YieldCard       | `components/dashboard/YieldCard.tsx`       | Yield metrics    |
| FXWidget        | `components/dashboard/FXWidget.tsx`        | FX conversion UI |
| ChainBalances   | `components/dashboard/ChainBalances.tsx`   | Multi-chain view |
| StatsCard       | `components/dashboard/StatsCard.tsx`       | Stats display    |

### API Routes

| Endpoint                 | Method | Purpose           |
| ------------------------ | ------ | ----------------- |
| `/api/treasury/balance`  | GET    | Treasury balances |
| `/api/treasury/yield`    | GET    | Yield information |
| `/api/fx/rates`          | GET    | Current FX rates  |
| `/api/fx/quote`          | POST   | Request FX quote  |
| `/api/settlement/chains` | GET    | Supported chains  |
| `/api/settlement/route`  | POST   | Calculate route   |

### Hooks

| Hook               | Purpose                   |
| ------------------ | ------------------------- |
| `useContracts.ts`  | Token balances (native + ERC20), escrow, payroll |
| `useTreasury.ts`   | Treasury manager operations |
| `useFX.ts`         | FX engine swaps           |
| `useSettlement.ts` | Cross-chain settlement    |
| `useCPN.ts`        | Fiat on/off ramp          |

---

## Configuration

### Environment Variables

```bash
# Network mode: 'local' or 'testnet'
NEXT_PUBLIC_NETWORK_MODE=local

# Local Hardhat
NEXT_PUBLIC_LOCAL_CHAIN_ID=31337
NEXT_PUBLIC_LOCAL_RPC_URL=http://127.0.0.1:8545

# Arc Testnet
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-project-id>
```

### Running Locally

```bash
# Terminal 1: Start Hardhat node
cd contracts
npx hardhat node

# Terminal 2: Deploy contracts
cd contracts
npx hardhat run scripts/deploy-treasury-suite.ts --network localhost

# Terminal 3: Start frontend
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

1. **Arc Testnet native currency** - Arc uses USDC as native gas token (not ETH). App now supports both native USDC and ERC20 MockUSDC.
2. **Transaction history** - Uses mock data (needs The Graph/indexer integration)
3. **Chain balances** - Uses mock data (needs Circle Gateway API)

---

## Hackathon Final Sprint (< 24 hours)

### Completed
- [x] Deploy treasury suite to Arc Testnet
- [x] Update frontend hooks to use new contract ABIs
- [x] Add contract tests (15 passing)
- [x] Add native USDC balance support
- [x] Wire `/treasury` page to existing hooks
- [x] Add skeleton loading animations to all pages

### In Progress
- [ ] Real USYC integration via usyc.dev.hashnote.com
- [ ] StableFX API integration (API-first approach)
- [ ] Escrow GPS/Signature toggle simulation
- [ ] Fiat page demo mode (pre-populated bank account)
- [ ] Deep Savings counter prominence

### Backlog (if time permits)
- [ ] Create dedicated `/fx` page
- [ ] Integrate The Graph for transaction history
- [ ] Add Circle Gateway API for real chain balances

---

## Integration Status

| Integration | Status | Notes |
|-------------|--------|-------|
| **USYC (Yield)** | ⚠️ Mock | Need to subscribe at usyc.dev.hashnote.com |
| **StableFX (FX)** | ⚠️ Mock | Have API key, need to implement RFQ flow |
| **CPN (Fiat)** | ⚠️ Mock | Demo mode with pre-populated bank account |
| **Arc Bridge** | ⚠️ Mock | Using mock settlement router |
