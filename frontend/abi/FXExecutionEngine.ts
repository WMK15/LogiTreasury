/**
 * FXExecutionEngine ABI
 * StableFX RFQ integration
 */

export const fxExecutionEngineAbi = [
  // ============ Read Functions ============
  {
    inputs: [],
    name: "getCurrentRates",
    outputs: [
      {
        components: [
          { name: "usdcToEurcRate", type: "uint256" },
          { name: "eurcToUsdcRate", type: "uint256" },
          { name: "spread", type: "uint256" },
          { name: "timestamp", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "direction", type: "uint8" },
      { name: "inputAmount", type: "uint256" },
    ],
    name: "previewSwap",
    outputs: [{ name: "outputAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getExposure",
    outputs: [
      {
        components: [
          { name: "usdcBalance", type: "uint256" },
          { name: "eurcBalance", type: "uint256" },
          { name: "eurcInUsdTerms", type: "uint256" },
          { name: "netExposure", type: "int256" },
          { name: "lastUpdated", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "quoteId", type: "bytes32" }],
    name: "getQuote",
    outputs: [
      {
        components: [
          { name: "quoteId", type: "bytes32" },
          { name: "requester", type: "address" },
          { name: "direction", type: "uint8" },
          { name: "inputAmount", type: "uint256" },
          { name: "outputAmount", type: "uint256" },
          { name: "rate", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserQuotes",
    outputs: [{ type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSwapCount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "getSwap",
    outputs: [
      {
        components: [
          { name: "quoteId", type: "bytes32" },
          { name: "executor", type: "address" },
          { name: "direction", type: "uint8" },
          { name: "inputAmount", type: "uint256" },
          { name: "outputAmount", type: "uint256" },
          { name: "effectiveRate", type: "uint256" },
          { name: "executedAt", type: "uint256" },
          { name: "settlementId", type: "bytes32" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRateHistoryCount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxSlippageBps",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minSwapAmount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxSwapAmount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ============ Write Functions ============
  {
    inputs: [{ name: "usdcAmount", type: "uint256" }],
    name: "requestUsdcToEurcQuote",
    outputs: [{ name: "quoteId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "eurcAmount", type: "uint256" }],
    name: "requestEurcToUsdcQuote",
    outputs: [{ name: "quoteId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "quoteId", type: "bytes32" }],
    name: "acceptQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "quoteId", type: "bytes32" }],
    name: "executeQuote",
    outputs: [{ name: "outputAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "direction", type: "uint8" },
      { name: "amount", type: "uint256" },
      { name: "minOutput", type: "uint256" },
    ],
    name: "directSwap",
    outputs: [{ name: "outputAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ============ Events ============
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "quoteId", type: "bytes32" },
      { indexed: true, name: "requester", type: "address" },
      { indexed: false, name: "direction", type: "uint8" },
      { indexed: false, name: "inputAmount", type: "uint256" },
      { indexed: false, name: "outputAmount", type: "uint256" },
      { indexed: false, name: "rate", type: "uint256" },
      { indexed: false, name: "expiresAt", type: "uint256" },
    ],
    name: "QuoteRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "quoteId", type: "bytes32" },
      { indexed: true, name: "acceptor", type: "address" },
    ],
    name: "QuoteAccepted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "quoteId", type: "bytes32" },
      { indexed: true, name: "executor", type: "address" },
      { indexed: false, name: "direction", type: "uint8" },
      { indexed: false, name: "inputAmount", type: "uint256" },
      { indexed: false, name: "outputAmount", type: "uint256" },
      { indexed: false, name: "effectiveRate", type: "uint256" },
    ],
    name: "SwapExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "usdcToEurcRate", type: "uint256" },
      { indexed: false, name: "eurcToUsdcRate", type: "uint256" },
      { indexed: false, name: "spread", type: "uint256" },
    ],
    name: "RateUpdated",
    type: "event",
  },
] as const;
