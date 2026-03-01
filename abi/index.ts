/**
 * Contract ABIs - ArcLogistics Treasury
 */

// Treasury Suite contracts
export { treasuryManagerAbi } from './TreasuryManager';
export { yieldVaultAdapterAbi } from './YieldVaultAdapter';
export { fxExecutionEngineAbi } from './FXExecutionEngine';
export { settlementRouterAbi } from './SettlementRouter';
export { cpnGatewayAbi } from './CPNGateway';

// Standard ERC20 ABI (for token balance checks & approvals)
export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
