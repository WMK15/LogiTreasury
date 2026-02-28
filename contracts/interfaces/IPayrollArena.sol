// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPayrollArena
 * @notice Interface for PayrollArena contract
 */
interface IPayrollArena {
    // ============ Enums ============
    enum PayrollType { VESTING, MILESTONE }
    enum PayrollStatus { ACTIVE, DISPUTED, COMPLETED, CANCELLED }

    // ============ Structs ============
    struct Milestone {
        string description;
        uint256 amount;
        bool completed;
        bool approved;
    }

    struct PayrollEntry {
        address employer;
        address employee;
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 startTime;
        uint256 endTime;
        uint256 disputeWindow;
        PayrollType payrollType;
        PayrollStatus status;
        uint256 vestingCliff;
        uint256 lastClaimTime;
    }

    // ============ Events ============
    event PayrollCreated(
        uint256 indexed payrollId,
        address indexed employer,
        address indexed employee,
        uint256 totalAmount,
        PayrollType payrollType
    );
    
    event FundsDeposited(
        address indexed employer,
        uint256 amount
    );
    
    event FundsClaimed(
        uint256 indexed payrollId,
        address indexed employee,
        uint256 amount
    );
    
    event MilestoneCompleted(
        uint256 indexed payrollId,
        uint256 indexed milestoneIndex
    );
    
    event MilestoneApproved(
        uint256 indexed payrollId,
        uint256 indexed milestoneIndex,
        uint256 amount
    );
    
    event DisputeRaised(
        uint256 indexed payrollId,
        address indexed employer
    );
    
    event DisputeResolved(
        uint256 indexed payrollId,
        bool releasedToEmployee
    );
    
    event PayrollCancelled(
        uint256 indexed payrollId
    );

    // ============ Functions ============
    function deposit(uint256 amount) external;
    function createVestingPayroll(
        address employee,
        uint256 totalAmount,
        uint256 startTime,
        uint256 endTime,
        uint256 cliffDuration,
        uint256 disputeWindow
    ) external returns (uint256);
    function createMilestonePayroll(
        address employee,
        uint256 totalAmount,
        string[] calldata descriptions,
        uint256[] calldata amounts,
        uint256 disputeWindow
    ) external returns (uint256);
    function claimVestedFunds(uint256 payrollId) external;
    function markMilestoneComplete(uint256 payrollId, uint256 milestoneIndex) external;
    function approveMilestone(uint256 payrollId, uint256 milestoneIndex) external;
    function claimMilestoneFunds(uint256 payrollId) external;
    function raiseDispute(uint256 payrollId) external;
    function resolveDispute(uint256 payrollId, bool releaseToEmployee) external;
    function getClaimableAmount(uint256 payrollId) external view returns (uint256);
}
