# AI Agent Instructions

> Instructions for AI agents (Claude, GPT, Copilot, etc.) working on this codebase.

---

## Project Context

**ArcLogistics Treasury** is an enterprise-grade unified logistics treasury and payout engine built for the Encode Hackathon. It targets European logistics companies and integrates with Circle's ecosystem.

### Key Technologies
- **Smart Contracts**: Solidity 0.8.20, Hardhat, ethers.js v6
- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui, Wagmi v2, Viem
- **Chains**: Arc Testnet (5042002), Hardhat Local (31337)

---

## Important Files to Read First

Before making changes, read these files to understand the current state:

1. **CURRENT.md** - Complete feature list and deployed addresses
2. **CHANGELOG.md** - What has been done and when
3. **ARCHITECTURE.md** - System design and integration flows
4. **README.md** - Project overview and setup instructions

---

## Code Conventions

### Solidity
- Use Solidity 0.8.20
- Follow OpenZeppelin patterns
- Use custom errors over require strings for gas efficiency (optional)
- Include NatSpec documentation for all public functions
- Group code: Enums, Structs, State, Events, Modifiers, Constructor, External, Public, Internal, Private

### TypeScript/React
- Use `"use client"` directive for client components
- Use React hooks pattern
- Export types from dedicated type files
- Use barrel exports (index.ts) for clean imports
- Prefer named exports over default exports (except pages)

### Naming
- Contracts: PascalCase (e.g., `TreasuryManager`)
- Functions: camelCase (e.g., `depositUsdc`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_SLIPPAGE_BPS`)
- Events: PascalCase (e.g., `Deposited`)
- Files: kebab-case for components, camelCase for utilities

---

## Contract Interfaces

### IStableFX (Critical)
The StableFX interface uses these specific signatures:

```solidity
// Get rate - returns (targetAmount, rate)
function getExchangeRate(address source, address target, uint256 amount) 
    external view returns (uint256 targetAmount, uint256 rate);

// Execute swap - 5 parameters!
function swap(address source, address target, uint256 amount, uint256 minTarget, address recipient) 
    external returns (uint256 targetAmount);

// Quote without executing
function quote(address source, address target, uint256 amount) 
    external view returns (uint256 targetAmount);
```

**DO NOT** use `getRate()` or 3-parameter `swap()` - these don't exist.

### IUSYC
```solidity
function deposit(uint256 assets, address receiver) external returns (uint256 shares);
function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
function convertToAssets(uint256 shares) external view returns (uint256);
function convertToShares(uint256 assets) external view returns (uint256);
function currentYieldRate() external view returns (uint256);
```

---

## Deployment

### Local Development
```bash
# Start Hardhat node
cd contracts && npx hardhat node

# Deploy (new terminal)
npx hardhat run scripts/deploy-treasury-suite.ts --network localhost

# Start frontend (new terminal)
cd frontend && npm run dev
```

### Arc Testnet
```bash
# Set environment
export PRIVATE_KEY=<deployer-private-key>

# Deploy
cd contracts
npx hardhat run scripts/deploy-treasury-suite.ts --network arcTestnet
```

---

## Common Tasks

### Adding a New Contract
1. Create contract in `contracts/src/<category>/`
2. Add interface if needed in `contracts/interfaces/`
3. Update `deploy-treasury-suite.ts` with deployment logic
4. Create ABI file in `frontend/src/abi/`
5. Add to `frontend/src/abi/index.ts` barrel export
6. Create hooks in `frontend/src/hooks/`
7. Update CURRENT.md and CHANGELOG.md

### Adding a New Frontend Page
1. Create page in `frontend/src/app/<route>/page.tsx`
2. Add `"use client"` if using hooks
3. Add link to `Sidebar.tsx`
4. Create any needed components in `frontend/src/components/`

### Adding a New Hook
1. Create in `frontend/src/hooks/use<Feature>.ts`
2. Use Wagmi's `useReadContract` / `useWriteContract`
3. Export from `frontend/src/hooks/index.ts`

---

## Testing

### Contract Tests
```bash
cd contracts
npx hardhat test
```

### Manual Frontend Testing
1. Connect MetaMask to localhost:8545
2. Import Hardhat account: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
3. Visit http://localhost:3000

---

## Known Gotchas

1. **SSR Hydration**: RainbowKit ConnectButton may not render on first load due to SSR. Use `mounted` state pattern.

2. **Contract Addresses**: Check `NEXT_PUBLIC_NETWORK_MODE` in `.env.local` - it switches between local and testnet addresses.

3. **Token Decimals**: USDC, EURC, and USYC all use 6 decimals.

4. **StableFX Rate**: The mock uses 0.92 EUR/USD rate (1 USDC = 0.92 EURC).

5. **USYC APY**: Mock yields 4.5% APY (450 basis points).

---

## Architecture Decisions

### Why TreasuryManager + Adapters?
Separation of concerns - TreasuryManager handles business logic while adapters handle protocol-specific integrations. This allows swapping yield sources without changing core logic.

### Why RFQ for FX?
Request-For-Quote pattern mirrors real institutional FX workflows. Quotes have expiration, enabling atomic PvP settlement.

### Why CPNGateway separation?
Fiat operations require compliance, audit trails, and bank account management - keeping this separate maintains clean interfaces.

---

## Contact & Resources

- **Arc Network Docs**: https://docs.arc.network
- **Circle Developer Docs**: https://developers.circle.com
- **Wagmi Docs**: https://wagmi.sh
- **RainbowKit Docs**: https://rainbowkit.com

---

## Checklist Before Committing

- [ ] Contracts compile: `cd contracts && npm run compile`
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Updated CURRENT.md if features changed
- [ ] Updated CHANGELOG.md with changes
- [ ] No hardcoded addresses (use config)
- [ ] No console.log in production code
- [ ] Types are properly defined
