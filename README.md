# LogiTreasury

> **Enterprise Logistics Treasury Engine built on Arc Network**

No capital sits idle. LogiTreasury automates yield optimization via USYC, instant FX conversion via StableFX, cross-chain settlement via Arc Bridge Kit, and fiat integration via Circle CPN — purpose-built for European logistics companies.

Built for the **Encode x Arc Hackathon**.

---

## Core Principle

**No capital sits idle.** All funds are either:

1. Earning yield via **USYC** (~4.5% APY, Hashnote T-Bills)
2. Converted optimally via **StableFX** (USDC ↔ EURC)
3. Settled instantly across chains via **Arc Bridge Kit**
4. Connected to traditional banking via **CPN**

---

## Features

### 1. Dashboard — Total Liquidity

- Unified balance view (bank liquid + on-chain breakdown)
- Real-time wallet balances: Native USDC (gas), ERC20 USDC, EURC, USYC
- **Smart Recommendations Toggle**: AI monitors idle cash and recommends USYC sweeps
  - Converts to different assets (USYC / StableFX)
  - Shows projected earnings

### 2. Analytics

- **FX Exposure Summary**: Currency risk analysis across operating currencies
- **USYC Yield Over Time**: Actual yield earned from all treasury operations
- **Audit Trail**: AI-generated tax compliance records for every conversion
  - Cross-border levies (EU MiCA)
  - Yield withholding calculations
  - Settlement fees

### 3. Settlements & Escrows

- Payment obligations with GPS/signature verification
- Locked funds in yield-bearing escrow
- Release history with Arc Explorer links

---

## Tech Stack

### Smart Contracts (Treasury Suite)

- **Solidity 0.8.20** / **Hardhat**
- `TreasuryManager.sol` — Central treasury orchestration
- `YieldVaultAdapter.sol` — USYC integration
- `FXExecutionEngine.sol` — StableFX RFQ
- `SettlementRouter.sol` — Arc Bridge Kit
- `CPNGateway.sol` — Fiat integration

### Frontend

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS** + **shadcn/ui**
- **Wagmi v2** + **Viem**
- **Supabase** (audit trail, transactions)

### Network

- **Arc Testnet** (Chain ID: 5042002)
- Cross-chain support: Ethereum, Arbitrum, Polygon, Base

---

## Project Structure

```
PayrollArena/
├── contracts/
│   ├── src/
│   │   ├── core/TreasuryManager.sol
│   │   ├── adapters/YieldVaultAdapter.sol
│   │   ├── fx/FXExecutionEngine.sol
│   │   ├── bridge/SettlementRouter.sol
│   │   └── fiat/CPNGateway.sol
│   ├── interfaces/
│   ├── scripts/deploy-treasury-suite.ts
│   └── test/TreasuryManager.test.ts
│
├── frontend/
│   ├── app/                  # Pages: /, /analytics, /settlements
│   ├── abi/                  # Treasury Suite ABIs
│   ├── components/           # shadcn/ui + custom components
│   ├── hooks/                # Wagmi hooks for contract interaction
│   └── lib/                  # Config, Supabase, utilities
│
├── supabase/migration.sql    # DB schema
└── ARCHITECTURE.md           # System architecture diagrams
```

---

## Setup

### Prerequisites

- Node.js 18+
- MetaMask wallet
- Arc Testnet USDC (from faucet)

### 1. Install

```bash
git clone <repo-url>
cd PayrollArena

# Install contract dependencies
cd contracts && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

#### Frontend (`frontend/.env.local`)

```env
# Network
NEXT_PUBLIC_NETWORK_MODE=testnet
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network

# Token Addresses
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_EURC_ADDRESS=0x...
NEXT_PUBLIC_USYC_ADDRESS=0x9fdF14c5B14173D74C08Af27AebFf39240dC105A

# Treasury Suite Contracts
NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS=0xB535b93cF7C249CE99965c22e952EFa322b2e4f9
NEXT_PUBLIC_YIELD_ADAPTER_ADDRESS=0x9cD4aD9E9CD6d796e67a1369926ED50349137EA9
NEXT_PUBLIC_FX_ENGINE_ADDRESS=0x63129e847496AA9931B48A827F82C45ddaDBd289
NEXT_PUBLIC_SETTLEMENT_ROUTER_ADDRESS=0x6Ab2464aBd8205A1581C7011e0EeD104a11E905D
NEXT_PUBLIC_CPN_GATEWAY_ADDRESS=0x43b3910E08c10551B0E0B0630dEA3d27a0d3995c

# Supabase (optional — falls back to mock data)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. Add Arc Testnet to MetaMask

| Field           | Value                           |
| --------------- | ------------------------------- |
| Network Name    | Arc Testnet                     |
| RPC URL         | https://rpc.testnet.arc.network |
| Chain ID        | 5042002                         |
| Currency Symbol | USDC                            |
| Block Explorer  | https://testnet.arcscan.app     |

### 4. Run

```bash
cd frontend
npm run dev
```

---

## Deployed Contracts (Arc Testnet)

| Contract          | Address                                      |
| ----------------- | -------------------------------------------- |
| TreasuryManager   | `0xB535b93cF7C249CE99965c22e952EFa322b2e4f9` |
| YieldVaultAdapter | `0x9cD4aD9E9CD6d796e67a1369926ED50349137EA9` |
| FXExecutionEngine | `0x63129e847496AA9931B48A827F82C45ddaDBd289` |
| SettlementRouter  | `0x6Ab2464aBd8205A1581C7011e0EeD104a11E905D` |
| CPNGateway        | `0x43b3910E08c10551B0E0B0630dEA3d27a0d3995c` |

---

## Integration Flows

### USYC Yield Flow

```
Treasury → Idle Detection → YieldAdapter → USYC Vault → Yield Accrual
                                    ↓
                              (When needed)
                                    ↓
                    Redemption → USDC Liquidity
```

### StableFX RFQ Flow

```
Operator → Request Quote → Get Rate → Accept → Execute → Atomic PvP → Settlement
```

### Cross-Chain Settlement

```
Treasury → Router → Calculate Route → Arc Bridge → Destination Chain → Recipient
```

### CPN Fiat Flow

```
Bank (SEPA/Wire) → CPN → Mint USDC → Treasury
Treasury → CPNGateway → Burn USDC → CPN → Bank (Wire)
```

---

## Track Alignment

### Track 1: Global Payouts & Treasury

- Circle Wallets, Circle Gateway (unified balance)
- Arc Bridge Kit (cross-chain), CPN (fiat rails)

### Track 2: USYC & StableFX

- USYC (yield layer), StableFX (FX layer)

---

## Key Design Decisions

1. **Modular Contract Architecture** — Each integration (USYC, StableFX, Bridge, CPN) has its own contract for clean separation and upgradability
2. **Real On-Chain Data** — Dashboard reads real wallet balances, no inflated mock values
3. **AI Compliance Engine** — Audit trail auto-generates tax analysis for every conversion
4. **Event-Driven Design** — All contracts emit events for off-chain indexing
5. **Role-Based Access** — Three-tier permissions (Owner → Admin → Operator)

---

## Security

- Private keys stored in `.env` files (never committed)
- Large withdrawals require admin approval
- Daily limits on fiat operations
- Slippage protection on all swaps

---

## Notes

- Arc Testnet uses **USDC as native gas token** (not ETH)
- USYC is real Hashnote contract on Arc Testnet
- Supabase audit trail falls back to mock data when not configured

---

## License

MIT
