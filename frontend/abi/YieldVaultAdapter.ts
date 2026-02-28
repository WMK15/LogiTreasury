/**
 * YieldVaultAdapter ABI
 * USYC yield vault wrapper
 */

export const yieldVaultAdapterAbi = [
  // ============ Read Functions ============
  {
    inputs: [],
    name: "getYieldMetrics",
    outputs: [
      {
        components: [
          { name: "totalDeposited", type: "uint256" },
          { name: "totalWithdrawn", type: "uint256" },
          { name: "currentShares", type: "uint256" },
          { name: "currentValue", type: "uint256" },
          { name: "unrealizedYield", type: "uint256" },
          { name: "realizedYield", type: "uint256" },
          { name: "currentAPY", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getValueInUsdc",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getUnrealizedYield",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalYield",
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
    name: "totalShares",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalCostBasis",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalRealizedYield",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDeposited",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalWithdrawn",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getDepositCount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "getDepositRecord",
    outputs: [
      {
        components: [
          { name: "amount", type: "uint256" },
          { name: "shares", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "pricePerShare", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "usdcAmount", type: "uint256" }],
    name: "previewRedeem",
    outputs: [{ name: "sharesNeeded", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "shares", type: "uint256" }],
    name: "previewWithdraw",
    outputs: [{ name: "usdcAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ============ Write Functions ============
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "deposit",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "usdcAmount", type: "uint256" }],
    name: "redeem",
    outputs: [{ name: "actualAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "redeemAll",
    outputs: [{ name: "actualAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ============ Events ============
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "usdcAmount", type: "uint256" },
      { indexed: false, name: "sharesReceived", type: "uint256" },
      { indexed: false, name: "pricePerShare", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "Deposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "sharesRedeemed", type: "uint256" },
      { indexed: false, name: "usdcReceived", type: "uint256" },
      { indexed: false, name: "yieldRealized", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "Redeemed",
    type: "event",
  },
] as const;
