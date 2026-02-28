/**
 * PayrollArena Type Definitions
 */

export enum PayrollType {
  VESTING = 0,
  MILESTONE = 1,
}

export enum PayrollStatus {
  ACTIVE = 0,
  DISPUTED = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}

export interface Milestone {
  description: string;
  amount: bigint;
  completed: boolean;
  approved: boolean;
}

export interface PayrollEntry {
  employer: `0x${string}`;
  employee: `0x${string}`;
  totalAmount: bigint;
  claimedAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  disputeWindow: bigint;
  payrollType: PayrollType;
  status: PayrollStatus;
  vestingCliff: bigint;
  lastClaimTime: bigint;
}

export interface PayrollWithId extends PayrollEntry {
  id: bigint;
  milestones?: Milestone[];
  claimableAmount?: bigint;
}

export interface CreateVestingPayrollParams {
  employee: `0x${string}`;
  totalAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  cliffDuration: bigint;
  disputeWindow: bigint;
}

export interface CreateMilestonePayrollParams {
  employee: `0x${string}`;
  totalAmount: bigint;
  descriptions: string[];
  amounts: bigint[];
  disputeWindow: bigint;
}

// UI Form Types
export interface VestingFormData {
  employeeAddress: string;
  amount: string;
  startDate: string;
  endDate: string;
  cliffDays: number;
  disputeWindowDays: number;
}

export interface MilestoneFormData {
  employeeAddress: string;
  milestones: {
    description: string;
    amount: string;
  }[];
  disputeWindowDays: number;
}
