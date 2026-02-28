/**
 * PayrollArena Contract ABI
 * Minimal ABI for frontend interactions
 */
export const PAYROLL_ARENA_ABI = [
  // Read Functions
  {
    inputs: [{ name: "employer", type: "address" }],
    name: "employerBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "payrollId", type: "uint256" }],
    name: "getPayroll",
    outputs: [
      {
        components: [
          { name: "employer", type: "address" },
          { name: "employee", type: "address" },
          { name: "totalAmount", type: "uint256" },
          { name: "claimedAmount", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "disputeWindow", type: "uint256" },
          { name: "payrollType", type: "uint8" },
          { name: "status", type: "uint8" },
          { name: "vestingCliff", type: "uint256" },
          { name: "lastClaimTime", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "payrollId", type: "uint256" }],
    name: "getMilestones",
    outputs: [
      {
        components: [
          { name: "description", type: "string" },
          { name: "amount", type: "uint256" },
          { name: "completed", type: "bool" },
          { name: "approved", type: "bool" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "payrollId", type: "uint256" }],
    name: "getClaimableAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "employer", type: "address" }],
    name: "getEmployerPayrolls",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "employee", type: "address" }],
    name: "getEmployeePayrolls",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "payrollCounter",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Write Functions
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "employee", type: "address" },
      { name: "totalAmount", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "cliffDuration", type: "uint256" },
      { name: "disputeWindow", type: "uint256" },
    ],
    name: "createVestingPayroll",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "employee", type: "address" },
      { name: "totalAmount", type: "uint256" },
      { name: "descriptions", type: "string[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "disputeWindow", type: "uint256" },
    ],
    name: "createMilestonePayroll",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "payrollId", type: "uint256" }],
    name: "claimVestedFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "payrollId", type: "uint256" },
      { name: "milestoneIndex", type: "uint256" },
    ],
    name: "markMilestoneComplete",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "payrollId", type: "uint256" },
      { name: "milestoneIndex", type: "uint256" },
    ],
    name: "approveMilestone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "payrollId", type: "uint256" }],
    name: "claimMilestoneFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "payrollId", type: "uint256" }],
    name: "raiseDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "payrollId", type: "uint256" },
      { name: "releaseToEmployee", type: "bool" },
    ],
    name: "resolveDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "payrollId", type: "uint256" }],
    name: "cancelPayroll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "payrollId", type: "uint256" },
      { indexed: true, name: "employer", type: "address" },
      { indexed: true, name: "employee", type: "address" },
      { indexed: false, name: "totalAmount", type: "uint256" },
      { indexed: false, name: "payrollType", type: "uint8" },
    ],
    name: "PayrollCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "employer", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "FundsDeposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "payrollId", type: "uint256" },
      { indexed: true, name: "employee", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "FundsClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "payrollId", type: "uint256" },
      { indexed: true, name: "milestoneIndex", type: "uint256" },
    ],
    name: "MilestoneCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "payrollId", type: "uint256" },
      { indexed: true, name: "milestoneIndex", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "MilestoneApproved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "payrollId", type: "uint256" },
      { indexed: true, name: "employer", type: "address" },
    ],
    name: "DisputeRaised",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "payrollId", type: "uint256" },
      { indexed: false, name: "releasedToEmployee", type: "bool" },
    ],
    name: "DisputeResolved",
    type: "event",
  },
] as const;

/**
 * ERC20 ABI for USDC interactions
 */
export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
