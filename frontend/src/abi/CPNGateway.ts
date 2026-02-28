/**
 * CPNGateway ABI
 * Circle Payments Network fiat integration
 */

export const cpnGatewayAbi = [
  // ============ Read Functions ============
  {
    inputs: [{ name: "accountId", type: "bytes32" }],
    name: "getBankAccount",
    outputs: [
      {
        components: [
          { name: "accountId", type: "bytes32" },
          { name: "bankName", type: "string" },
          { name: "accountNumber", type: "string" },
          { name: "routingNumber", type: "string" },
          { name: "currency", type: "string" },
          { name: "country", type: "string" },
          { name: "isVerified", type: "bool" },
          { name: "isActive", type: "bool" },
          { name: "addedAt", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserBankAccounts",
    outputs: [{ type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "depositId", type: "bytes32" }],
    name: "getDeposit",
    outputs: [
      {
        components: [
          { name: "depositId", type: "bytes32" },
          { name: "depositor", type: "address" },
          { name: "bankAccountId", type: "bytes32" },
          { name: "fiatAmount", type: "uint256" },
          { name: "fiatCurrency", type: "string" },
          { name: "usdcAmount", type: "uint256" },
          { name: "exchangeRate", type: "uint256" },
          { name: "fee", type: "uint256" },
          { name: "initiatedAt", type: "uint256" },
          { name: "completedAt", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "cpnReference", type: "string" },
          { name: "memo", type: "string" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserDeposits",
    outputs: [{ type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "withdrawalId", type: "bytes32" }],
    name: "getWithdrawal",
    outputs: [
      {
        components: [
          { name: "withdrawalId", type: "bytes32" },
          { name: "requester", type: "address" },
          { name: "bankAccountId", type: "bytes32" },
          { name: "usdcAmount", type: "uint256" },
          { name: "fiatAmount", type: "uint256" },
          { name: "fiatCurrency", type: "string" },
          { name: "exchangeRate", type: "uint256" },
          { name: "fee", type: "uint256" },
          { name: "requestedAt", type: "uint256" },
          { name: "approvedAt", type: "uint256" },
          { name: "settledAt", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "cpnReference", type: "string" },
          { name: "memo", type: "string" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserWithdrawals",
    outputs: [{ type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getDailyLimitsStatus",
    outputs: [
      { name: "depositRemaining", type: "uint256" },
      { name: "withdrawalRemaining", type: "uint256" },
      { name: "resetIn", type: "uint256" },
    ],
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
    name: "totalFees",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "depositFeeBps",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawalFeeBps",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minDeposit",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minWithdrawal",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ============ Write Functions ============
  {
    inputs: [
      { name: "bankName", type: "string" },
      { name: "accountNumber", type: "string" },
      { name: "routingNumber", type: "string" },
      { name: "currency", type: "string" },
      { name: "country", type: "string" },
    ],
    name: "addBankAccount",
    outputs: [{ name: "accountId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "accountId", type: "bytes32" }],
    name: "verifyBankAccount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "bankAccountId", type: "bytes32" },
      { name: "fiatAmount", type: "uint256" },
      { name: "fiatCurrency", type: "string" },
      { name: "memo", type: "string" },
    ],
    name: "initiateDeposit",
    outputs: [{ name: "depositId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "bankAccountId", type: "bytes32" },
      { name: "usdcAmount", type: "uint256" },
      { name: "memo", type: "string" },
    ],
    name: "requestWithdrawal",
    outputs: [{ name: "withdrawalId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "withdrawalId", type: "bytes32" }],
    name: "approveWithdrawal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "withdrawalId", type: "bytes32" },
      { name: "reason", type: "string" },
    ],
    name: "failWithdrawal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ============ Events ============
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "accountId", type: "bytes32" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "currency", type: "string" },
    ],
    name: "BankAccountAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "accountId", type: "bytes32" }],
    name: "BankAccountVerified",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "depositId", type: "bytes32" },
      { indexed: true, name: "depositor", type: "address" },
      { indexed: false, name: "fiatAmount", type: "uint256" },
      { indexed: false, name: "currency", type: "string" },
    ],
    name: "DepositInitiated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "depositId", type: "bytes32" },
      { indexed: false, name: "usdcAmount", type: "uint256" },
      { indexed: false, name: "cpnReference", type: "string" },
    ],
    name: "DepositReceived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "depositId", type: "bytes32" },
      { indexed: true, name: "depositor", type: "address" },
      { indexed: false, name: "usdcAmount", type: "uint256" },
    ],
    name: "DepositCredited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "withdrawalId", type: "bytes32" },
      { indexed: true, name: "requester", type: "address" },
      { indexed: false, name: "usdcAmount", type: "uint256" },
      { indexed: false, name: "bankAccountId", type: "bytes32" },
    ],
    name: "WithdrawalRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "withdrawalId", type: "bytes32" },
      { indexed: false, name: "approver", type: "address" },
    ],
    name: "WithdrawalApproved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "withdrawalId", type: "bytes32" },
      { indexed: false, name: "fiatAmount", type: "uint256" },
    ],
    name: "WithdrawalSettled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "withdrawalId", type: "bytes32" }],
    name: "WithdrawalCompleted",
    type: "event",
  },
] as const;
