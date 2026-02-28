# ArcLogistics Treasury

> **Unified Logistics Treasury & Payout Engine for European logistics companies**

Enterprise-grade financial infrastructure built on Arc Network. Ensures no capital sits idle through automated yield optimization, instant FX conversion, cross-chain settlement, and seamless fiat integration.

## Core Principle

**No capital sits idle.** All funds are either:
1. Earning yield via **USYC** (~4.5% APY)
2. Converted optimally via **StableFX**
3. Settled instantly across chains via **Arc Bridge Kit**
4. Connected to traditional banking via **CPN**

---

## Track Alignment

### Track 1: Global Payouts & Treasury
- Circle Wallets
- Circle Gateway (unified balance)
- Arc Bridge Kit (cross-chain)
- CPN (fiat rails)

### Track 2: USYC & StableFX
- USYC (yield layer)
- StableFX (FX layer)

---

## Features

### Treasury Engine
- Unified balance abstraction via Circle Gateway
- Idle capital detection with auto-sweep to USYC
- Multi-operator role-based access control
- Liquidity availability tracking

### Freight Escrow Module
- Shipment-linked escrow contracts
- Funds automatically held in USYC while in transit
- Conditional release upon delivery confirmation
- Human-in-the-loop override for disputes

### FX Execution Layer
- StableFX RFQ flow integration
- Real-time USDC ↔ EURC conversion
- Atomic PvP settlement logic
- FX exposure monitoring dashboard

### Multi-Chain Settlement Router
- Arc Bridge Kit integration
- Destination chain routing logic
- Mass payout capability (batch settlements)
- Transaction status tracking

### Fiat Integration Layer
- CPN funding flow (bank → USDC)
- Fiat withdrawal flow (USDC → bank)
- Bank account management
- Treasury reconciliation

---

## Tech Stack

### Smart Contracts
- **Solidity 0.8.20**
- **Hardhat** for development
- Modular architecture:
  - `TreasuryManager.sol` - Central treasury orchestration
  - `YieldVaultAdapter.sol` - USYC integration
  - `FXExecutionEngine.sol` - StableFX RFQ
  - `SettlementRouter.sol` - Arc Bridge Kit
  - `CPNGateway.sol` - Fiat integration
  - `FreightEscrow.sol` - Shipment escrows

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **shadcn/ui** components
- **Wagmi v2** + **Viem**
- **RainbowKit** wallet connection

### Network
- **Arc Testnet** (Chain ID: 5042002)
- Cross-chain support: Ethereum, Arbitrum, Polygon, Base

---

## Project Structure

```
ArcLogistics/
├── contracts/                    # Smart contracts (Hardhat)
│   ├── src/
│   │   ├── core/
│   │   │   └── TreasuryManager.sol      # Central treasury
│   │   ├── adapters/
│   │   │   └── YieldVaultAdapter.sol    # USYC wrapper
│   │   ├── fx/
│   │   │   └── FXExecutionEngine.sol    # StableFX RFQ
│   │   ├── bridge/
│   │   │   └── SettlementRouter.sol     # Arc Bridge Kit
│   │   ├── fiat/
│   │   │   └── CPNGateway.sol           # CPN integration
│   │   ├── FreightEscrow.sol            # Shipment escrows
│   │   ├── Treasury.sol                 # Legacy treasury
│   │   ├── Settlement.sol               # FX settlement
│   │   ├── BatchPayroll.sol             # Batch payments
│   │   └── Mock*.sol                    # Test mocks
│   ├── interfaces/
│   ├── scripts/
│   └── test/
│
├── frontend/                     # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── treasury/           # Treasury APIs
│   │   │   │   ├── fx/                 # FX APIs
│   │   │   │   └── settlement/         # Settlement APIs
│   │   │   ├── (dashboard)/            # Dashboard pages
│   │   │   ├── treasury/
│   │   │   ├── escrow/
│   │   │   ├── settlement/
│   │   │   └── fx/
│   │   ├── components/
│   │   │   ├── dashboard/              # Dashboard components
│   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   ├── BalanceOverview.tsx
│   │   │   │   ├── YieldCard.tsx
│   │   │   │   ├── FXWidget.tsx
│   │   │   │   └── ChainBalances.tsx
│   │   │   ├── escrow/
│   │   │   ├── treasury/
│   │   │   └── ui/                     # shadcn/ui
│   │   ├── hooks/
│   │   │   ├── useTreasury.ts          # Treasury hooks
│   │   │   ├── useFX.ts                # FX hooks
│   │   │   ├── useSettlement.ts        # Settlement hooks
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── services/
│   │   │   │   ├── treasury.service.ts
│   │   │   │   ├── fx.service.ts
│   │   │   │   ├── settlement.service.ts
│   │   │   │   └── cpn.service.ts
│   │   │   ├── config.ts
│   │   │   └── wagmi.ts
│   │   ├── types/
│   │   │   └── treasury.ts             # TypeScript types
│   │   └── abi/                        # Contract ABIs
│   └── public/
│
├── ARCHITECTURE.md               # System architecture diagrams
└── README.md
```

---

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask wallet
- Arc Testnet USDC (from faucet)

### 1. Clone and Install

```bash
git clone <repo-url>
cd ArcLogistics

# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

#### Contracts (`contracts/.env`)

```bash
cp .env.example .env
```

```env
# Your wallet private key (DO NOT COMMIT)
PRIVATE_KEY=your_private_key_here

# Arc Testnet
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002
```

#### Frontend (`frontend/.env.local`)

```bash
cp .env.example .env.local
```

```env
# Token Addresses
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_EURC_ADDRESS=0x...
NEXT_PUBLIC_USYC_ADDRESS=0x...
NEXT_PUBLIC_STABLEFX_ADDRESS=0x...

# Core Contract Addresses
NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_YIELD_ADAPTER_ADDRESS=0x...
NEXT_PUBLIC_FX_ENGINE_ADDRESS=0x...
NEXT_PUBLIC_SETTLEMENT_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_CPN_GATEWAY_ADDRESS=0x...
NEXT_PUBLIC_FREIGHT_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_BATCH_PAYROLL_ADDRESS=0x...

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_EXPLORER_URL=https://testnet.arcscan.app

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. Add Arc Testnet to MetaMask

| Field | Value |
|-------|-------|
| Network Name | Arc Testnet |
| RPC URL | https://rpc.testnet.arc.network |
| Chain ID | 5042002 |
| Currency Symbol | USDC |
| Block Explorer | https://testnet.arcscan.app |

---

## Deployment

### Compile Contracts

```bash
cd contracts
npm run compile
```

### Deploy to Arc Testnet

```bash
npm run deploy
# or
npx hardhat run scripts/deploy.ts --network arcTestnet
```

The deploy script will:
1. Deploy mock tokens (USDC, EURC, USYC, StableFX)
2. Deploy core contracts
3. Configure contract relationships
4. Mint test tokens
5. Output addresses for frontend config

---

## Running the Frontend

```bash
cd frontend
npm run dev
```

Open http://10.0.3.227:3000 (or your local IP) in your browser.

For LAN access, the dev server binds to your local IP automatically.

---

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/treasury/balance` | GET | Get unified treasury balance |
| `/api/treasury/yield` | GET | Get yield metrics |
| `/api/fx/rates` | GET | Get current FX rates |
| `/api/fx/quote` | POST | Request swap quote |
| `/api/settlement/chains` | GET | Get supported chains |
| `/api/settlement/route` | POST | Get settlement route |

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

## Deployed Contracts (Arc Testnet)

| Contract | Address |
|----------|---------|
| MockUSDC | `0x5D2EF4689bd78E78aC6f25cBAb601B74a16597cB` |
| MockEURC | `0x889dbe4EdD1A8b83BB34dD10CBc0e30725490dC9` |
| MockUSYC | `0xfE7E6B7C10C59796Ed887774f83d80aa3865366D` |
| MockStableFX | `0x1743B520179E2dbAabBC8587661CC5b7bE42f7c4` |
| FreightEscrow | `0xf51eA88Ce8762021f8516393C4016d131d6FA085` |
| Treasury | `0xDD7bB606DE0ABD7AEF79A5b3e257bf09fEcF6A48` |
| Settlement | `0x8500aE3e1303a42110592AE268E4f1BDfed37a85` |
| BatchPayroll | `0x5CcD00fD13dF4E3121ee1f4Ccd76253966b9fb86` |

---

## Development

### Run Tests

```bash
cd contracts
npm test
```

### Lint

```bash
cd frontend
npm run lint
```

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system architecture diagrams including:
- System overview
- Data flow diagrams
- Contract hierarchy
- Integration flows

---

## Key Design Decisions

1. **Modular Contract Architecture**: Each integration (USYC, StableFX, Bridge, CPN) has its own contract module for clean separation and upgradability.

2. **Service Layer Pattern**: Frontend uses a service layer abstraction over wagmi for cleaner code organization and testability.

3. **Event-Driven Design**: All contracts emit comprehensive events for off-chain indexing and real-time updates.

4. **Role-Based Access**: Three-tier permission system (Owner → Admin → Operator) for enterprise governance.

5. **Fail-Safe Mechanisms**: All operations have refund/rollback capabilities for failed transactions.

---

## Security Considerations

- Private keys stored in `.env` files (never committed)
- Large withdrawals require admin approval
- Daily limits on fiat operations
- Slippage protection on all swaps
- Escrow dispute resolution mechanism

---

## Notes

- Arc Testnet uses USDC as the native gas token
- Mock tokens are used since Circle's real USYC/StableFX require whitelisting
- `reference` is a reserved keyword in Solidity 0.8.20 - use `memo` instead

---

## License

MIT
