/**
 * SettlementRouter ABI
 * Multi-chain settlement with Arc Bridge Kit
 */

export const settlementRouterAbi = [
  // ============ Read Functions ============
  {
    inputs: [],
    name: "getSupportedChains",
    outputs: [{ type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "chainId", type: "uint256" }],
    name: "getChainConfig",
    outputs: [
      {
        components: [
          { name: "chainId", type: "uint256" },
          { name: "name", type: "string" },
          { name: "bridgeEndpoint", type: "address" },
          { name: "minTransfer", type: "uint256" },
          { name: "maxTransfer", type: "uint256" },
          { name: "estimatedTime", type: "uint256" },
          { name: "baseFee", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "chainId", type: "uint256" }],
    name: "isChainSupported",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "destChain", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    name: "getRouteQuote",
    outputs: [
      {
        components: [
          { name: "destChain", type: "uint256" },
          { name: "routeType", type: "uint8" },
          { name: "estimatedFee", type: "uint256" },
          { name: "estimatedTime", type: "uint256" },
          { name: "inputAmount", type: "uint256" },
          { name: "outputAmount", type: "uint256" },
          { name: "validUntil", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "destChain", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    name: "getOptimalRoute",
    outputs: [
      {
        components: [
          { name: "destChain", type: "uint256" },
          { name: "routeType", type: "uint8" },
          { name: "estimatedFee", type: "uint256" },
          { name: "estimatedTime", type: "uint256" },
          { name: "inputAmount", type: "uint256" },
          { name: "outputAmount", type: "uint256" },
          { name: "validUntil", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "settlementId", type: "bytes32" }],
    name: "getSettlement",
    outputs: [
      {
        components: [
          { name: "settlementId", type: "bytes32" },
          { name: "sender", type: "address" },
          { name: "recipient", type: "address" },
          { name: "sourceChain", type: "uint256" },
          { name: "destChain", type: "uint256" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "fee", type: "uint256" },
          { name: "initiatedAt", type: "uint256" },
          { name: "completedAt", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "routeType", type: "uint8" },
          { name: "memo", type: "string" },
          { name: "bridgeTxId", type: "bytes32" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserSettlements",
    outputs: [{ type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "batchId", type: "bytes32" }],
    name: "getBatchSettlement",
    outputs: [
      {
        components: [
          { name: "batchId", type: "bytes32" },
          { name: "sender", type: "address" },
          { name: "destChain", type: "uint256" },
          { name: "token", type: "address" },
          { name: "recipients", type: "address[]" },
          { name: "amounts", type: "uint256[]" },
          { name: "totalAmount", type: "uint256" },
          { name: "totalFee", type: "uint256" },
          { name: "initiatedAt", type: "uint256" },
          { name: "completedAt", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "chainId", type: "uint256" }],
    name: "getChainVolume",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSettled",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalFees",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ============ Write Functions ============
  {
    inputs: [
      { name: "recipient", type: "address" },
      { name: "destChain", type: "uint256" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "memo", type: "string" },
    ],
    name: "initiateSettlement",
    outputs: [{ name: "settlementId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "destChain", type: "uint256" },
      { name: "token", type: "address" },
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    name: "initiateBatchSettlement",
    outputs: [{ name: "batchId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "settlementId", type: "bytes32" },
      { name: "status", type: "uint8" },
      { name: "bridgeTxId", type: "bytes32" },
    ],
    name: "updateSettlementStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "settlementId", type: "bytes32" },
      { name: "reason", type: "string" },
    ],
    name: "failSettlement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ============ Events ============
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "settlementId", type: "bytes32" },
      { indexed: true, name: "sender", type: "address" },
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "destChain", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "fee", type: "uint256" },
    ],
    name: "SettlementInitiated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "settlementId", type: "bytes32" },
      { indexed: false, name: "bridgeTxId", type: "bytes32" },
    ],
    name: "SettlementBridging",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "settlementId", type: "bytes32" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "SettlementCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "settlementId", type: "bytes32" },
      { indexed: false, name: "reason", type: "string" },
    ],
    name: "SettlementFailed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "batchId", type: "bytes32" },
      { indexed: true, name: "sender", type: "address" },
      { indexed: false, name: "destChain", type: "uint256" },
      { indexed: false, name: "recipientCount", type: "uint256" },
      { indexed: false, name: "totalAmount", type: "uint256" },
    ],
    name: "BatchInitiated",
    type: "event",
  },
] as const;
