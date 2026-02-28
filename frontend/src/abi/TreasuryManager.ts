/**
 * TreasuryManager ABI
 * Central treasury orchestration contract
 */

export const treasuryManagerAbi = [
  // ============ Read Functions ============
  {
    inputs: [],
    name: "getBalanceSnapshot",
    outputs: [
      {
        components: [
          { name: "liquidUsdc", type: "uint256" },
          { name: "yieldBearingUsdc", type: "uint256" },
          { name: "lockedInEscrow", type: "uint256" },
          { name: "pendingSettlement", type: "uint256" },
          { name: "totalValue", type: "uint256" },
          { name: "unrealizedYield", type: "uint256" },
          { name: "timestamp", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAvailableBalance",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentYieldRate",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getYieldConfig",
    outputs: [
      {
        components: [
          { name: "targetAllocationBps", type: "uint256" },
          { name: "minLiquidBuffer", type: "uint256" },
          { name: "rebalanceThreshold", type: "uint256" },
          { name: "maxSingleSwap", type: "uint256" },
          { name: "autoSweepEnabled", type: "bool" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "needsRebalancing",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getUnifiedBalance",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidUsdcBalance",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidEurcBalance",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalYieldEarned",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "operator", type: "address" }],
    name: "operators",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "admin", type: "address" }],
    name: "admins",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },

  // ============ Write Functions ============
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "depositUsdc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "depositEurc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "memo", type: "string" },
    ],
    name: "withdrawUsdc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "memo", type: "string" },
    ],
    name: "withdrawEurc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "sweepToYield",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "harvestYield",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "rebalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "redeemFromYield",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "requestId", type: "uint256" }],
    name: "approveWithdrawal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "requestId", type: "uint256" }],
    name: "executeWithdrawal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "chainId", type: "uint256" },
      { name: "balance", type: "uint256" },
    ],
    name: "updateChainBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ============ Admin Functions ============
  {
    inputs: [
      { name: "operator", type: "address" },
      { name: "status", type: "bool" },
    ],
    name: "setOperator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "admin", type: "address" },
      { name: "status", type: "bool" },
    ],
    name: "setAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ============ Events ============
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "depositor", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "recipient", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "memo", type: "string" },
    ],
    name: "Withdrawal",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "usdcAmount", type: "uint256" },
      { indexed: false, name: "usycSharesReceived", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "YieldSwept",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "yieldAmount", type: "uint256" },
      { indexed: false, name: "newTotalYield", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "YieldHarvested",
    type: "event",
  },
] as const;
