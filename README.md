# PayrollArena

> Programmable Payroll & Conditional USDC Escrow System

A decentralized payroll management platform built for EVM-compatible chains, featuring vesting schedules, milestone-based releases, and built-in dispute resolution.

## Overview

PayrollArena enables employers to:
- Deposit USDC into a smart contract treasury
- Create payroll schedules with vesting or milestone-based releases
- Monitor and manage employee payments
- Raise disputes to freeze funds when needed

Employees can:
- Track vesting progress and milestone status
- Claim unlocked funds automatically
- Mark milestones as complete for approval

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Employer Panel  │  │  Employee Panel  │  │   Treasury   │  │
│  │  - Deposit USDC  │  │  - View Payrolls │  │   Overview   │  │
│  │  - Create Payroll│  │  - Claim Funds   │  │              │  │
│  │  - Approve MS    │  │  - Mark Complete │  │              │  │
│  │  - Raise Dispute │  │                  │  │              │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │          │
│  ┌────────┴─────────────────────┴────────────────────┴───────┐  │
│  │                    Wagmi + Viem Hooks                     │  │
│  └────────────────────────────┬──────────────────────────────┘  │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │     RainbowKit        │
                    │   Wallet Connection   │
                    └───────────┬───────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────┐
│                         BLOCKCHAIN                              │
│  ┌────────────────────────────┴──────────────────────────────┐  │
│  │                    PayrollArena.sol                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────┐  │  │
│  │  │  Vesting Logic  │  │ Milestone Logic │  │  Disputes │  │  │
│  │  │  - Linear vest  │  │  - Mark done    │  │  - Freeze │  │  │
│  │  │  - Cliff period │  │  - Approve      │  │  - Resolve│  │  │
│  │  │  - Auto-unlock  │  │  - Release      │  │           │  │  │
│  │  └─────────────────┘  └─────────────────┘  └───────────┘  │  │
│  │                              │                             │  │
│  │  ┌───────────────────────────┴───────────────────────────┐│  │
│  │  │                 Employer Treasury                     ││  │
│  │  │           mapping(address => uint256)                 ││  │
│  │  └───────────────────────────┬───────────────────────────┘│  │
│  └──────────────────────────────┼────────────────────────────┘  │
│                                 │                               │
│  ┌──────────────────────────────┴────────────────────────────┐  │
│  │                        USDC (ERC20)                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
PayrollArena/
├── contracts/                    # Smart contracts (Hardhat)
│   ├── src/
│   │   ├── PayrollArena.sol     # Main contract
│   │   └── MockUSDC.sol         # Test token
│   ├── interfaces/
│   │   ├── IERC20.sol           # ERC20 interface
│   │   └── IPayrollArena.sol    # Contract interface
│   ├── scripts/
│   │   └── deploy.ts            # Deployment script
│   ├── test/
│   │   └── PayrollArena.test.ts # Contract tests
│   ├── hardhat.config.ts
│   └── package.json
│
├── frontend/                     # Next.js 14 App
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── employer/        # Employer dashboard
│   │   │   ├── employee/        # Employee dashboard
│   │   │   └── treasury/        # Treasury overview
│   │   ├── components/
│   │   │   ├── ui/              # UI components
│   │   │   ├── payroll/         # Payroll components
│   │   │   └── wallet/          # Wallet components
│   │   ├── hooks/               # Wagmi hooks
│   │   ├── lib/                 # Config & utils
│   │   ├── types/               # TypeScript types
│   │   └── abi/                 # Contract ABIs
│   ├── package.json
│   └── tailwind.config.ts
│
└── README.md
```

## Features

### Vesting Payroll
- Linear vesting over a configurable period
- Cliff period before any tokens unlock
- Automatic calculation of claimable amounts
- Real-time progress tracking

### Milestone Payroll
- Define up to 20 milestones per payroll
- Employee marks milestones as complete
- Employer approves completed milestones
- Funds release upon approval

### Dispute Resolution
- Employer can freeze payroll at any time
- Dispute resolution releases or returns funds
- Protects both parties in case of conflicts

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm/npm/yarn
- MetaMask or compatible wallet

### 1. Clone & Install

```bash
# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Contracts
cp contracts/.env.example contracts/.env
# Edit with your private key and RPC URL

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit with contract addresses after deployment
```

### 3. Deploy Contracts

```bash
cd contracts

# Local development
npm run node           # Terminal 1: Start local node
npm run deploy:local   # Terminal 2: Deploy

# Arc Testnet
npm run deploy:arc
```

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000

## Smart Contract API

### Employer Functions

| Function | Description |
|----------|-------------|
| `deposit(amount)` | Deposit USDC to treasury |
| `withdraw(amount)` | Withdraw unused funds |
| `createVestingPayroll(...)` | Create vesting schedule |
| `createMilestonePayroll(...)` | Create milestone-based payroll |
| `approveMilestone(id, index)` | Approve completed milestone |
| `raiseDispute(id)` | Freeze payroll funds |
| `resolveDispute(id, toEmployee)` | Resolve dispute |
| `cancelPayroll(id)` | Cancel before any claims |

### Employee Functions

| Function | Description |
|----------|-------------|
| `claimVestedFunds(id)` | Claim unlocked vesting funds |
| `markMilestoneComplete(id, index)` | Mark milestone done |
| `claimMilestoneFunds(id)` | Claim approved milestones |

### View Functions

| Function | Description |
|----------|-------------|
| `getPayroll(id)` | Get payroll details |
| `getMilestones(id)` | Get milestone array |
| `getClaimableAmount(id)` | Get current claimable |
| `employerBalance(address)` | Get treasury balance |
| `getEmployerPayrolls(address)` | List employer's payrolls |
| `getEmployeePayrolls(address)` | List employee's payrolls |

## Testing

```bash
cd contracts
npm run test
npm run test:coverage
```

## Hackathon Notes

### What's Implemented
- Full vesting logic with cliff periods
- Milestone-based payment flow
- Dispute freeze mechanism
- Complete frontend with dashboards
- Wallet integration (RainbowKit)

### Future Improvements
- Multi-sig dispute resolution
- Batch payroll creation
- Recurring payments
- Off-chain milestone verification (oracles)
- Email/push notifications
- CSV export of payment history

### Security Considerations
- Uses SafeTransfer pattern
- Reentrancy protection via checks-effects-interactions
- Input validation on all public functions
- Events emitted for transparency

## Tech Stack

- **Smart Contracts**: Solidity 0.8.20, Hardhat
- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Web3**: Wagmi v2, Viem, RainbowKit
- **Target Chain**: Arc Testnet (EVM-compatible)

## License

MIT

---

Built for hackathon demonstration purposes. Not audited for production use.
