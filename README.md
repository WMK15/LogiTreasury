# LogiTreasury

European logistics treasury and settlement platform built on Arc Testnet.

## Features

- **Freight Escrow** - High-value shipment escrow with USYC yield accrual
- **Treasury Management** - USDC deposits with auto-allocation to yield (USYC)
- **Euro Settlement** - USDC <-> EURC conversion via StableFX
- **Batch Payroll** - Multi-recipient payments in USDC/EURC

## Tech Stack

- **Smart Contracts**: Solidity 0.8.20, Hardhat
- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Web3**: Wagmi v2, Viem, RainbowKit
- **Network**: Arc Testnet (Chain ID: 5042002)

## Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask wallet
- Arc Testnet USDC (from faucet)

## Project Structure

```
PayrollArena/
├── contracts/           # Smart contracts (Hardhat)
│   ├── src/            # Solidity source files
│   ├── interfaces/     # Contract interfaces
│   ├── scripts/        # Deployment scripts
│   └── test/           # Contract tests
│
├── frontend/           # Next.js frontend
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# React components
│   │   ├── hooks/     # Wagmi hooks
│   │   ├── abi/       # Contract ABIs
│   │   └── lib/       # Utilities & config
│   └── public/
│
└── README.md
```

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd PayrollArena

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

Edit `.env`:

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

Edit `.env.local` after deploying contracts (addresses will be output by deploy script):

```env
# Mock Token Addresses
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_EURC_ADDRESS=0x...
NEXT_PUBLIC_USYC_ADDRESS=0x...
NEXT_PUBLIC_STABLEFX_ADDRESS=0x...

# Core Contract Addresses
NEXT_PUBLIC_FREIGHT_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_TREASURY_ADDRESS=0x...
NEXT_PUBLIC_SETTLEMENT_ADDRESS=0x...
NEXT_PUBLIC_BATCH_PAYROLL_ADDRESS=0x...

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_EXPLORER_URL=https://testnet.arcscan.app

# WalletConnect (get from https://cloud.walletconnect.com)
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

### 4. Get Testnet Tokens

Visit the Arc Testnet faucet to get testnet USDC for gas and testing.

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
2. Deploy core contracts (FreightEscrow, Treasury, Settlement, BatchPayroll)
3. Mint test tokens to deployer
4. Seed StableFX with liquidity
5. Output addresses to add to frontend `.env.local`

### Seed Additional Test Data

```bash
npx hardhat run scripts/seed.ts --network arcTestnet
```

## Running the Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

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

## Contract Overview

### FreightEscrow
High-value shipment escrow with yield generation. Deposited USDC is converted to USYC to earn yield while in escrow.

### Treasury
Corporate treasury management. Deposit USDC, auto-allocate to yield-bearing USYC, withdraw anytime.

### Settlement
FX settlement between USDC and EURC using StableFX mock (simulates Circle's real StableFX API).

### BatchPayroll
Multi-recipient batch payments. Pay suppliers, drivers, or partners in bulk with USDC or EURC.

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

## Notes

- Arc Testnet uses USDC as the native gas token (18 decimals for gas)
- Mock tokens are used since Circle's real USYC/StableFX require whitelisting
- `reference` is a reserved keyword in Solidity 0.8.20 - use `memo` instead

## License

MIT
