// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";
import "../interfaces/IPayrollArena.sol";

/**
 * @title PayrollArena
 * @author PayrollArena Team
 * @notice Programmable payroll & conditional USDC escrow system
 * @dev Supports vesting schedules and milestone-based releases with dispute handling
 */
contract PayrollArena is IPayrollArena {
    // ============ State Variables ============
    
    /// @notice USDC token contract
    IERC20 public immutable usdc;
    
    /// @notice Counter for payroll IDs
    uint256 public payrollCounter;
    
    /// @notice Employer treasury balances
    mapping(address => uint256) public employerBalance;
    
    /// @notice Payroll entries by ID
    mapping(uint256 => PayrollEntry) public payrolls;
    
    /// @notice Milestones for milestone-based payrolls
    mapping(uint256 => Milestone[]) public milestones;
    
    /// @notice Payroll IDs by employer
    mapping(address => uint256[]) public employerPayrolls;
    
    /// @notice Payroll IDs by employee
    mapping(address => uint256[]) public employeePayrolls;

    // ============ Constants ============
    
    /// @notice Minimum dispute window (1 day)
    uint256 public constant MIN_DISPUTE_WINDOW = 1 days;
    
    /// @notice Maximum dispute window (30 days)
    uint256 public constant MAX_DISPUTE_WINDOW = 30 days;

    // ============ Modifiers ============
    
    modifier onlyEmployer(uint256 payrollId) {
        require(payrolls[payrollId].employer == msg.sender, "Not employer");
        _;
    }
    
    modifier onlyEmployee(uint256 payrollId) {
        require(payrolls[payrollId].employee == msg.sender, "Not employee");
        _;
    }
    
    modifier payrollExists(uint256 payrollId) {
        require(payrolls[payrollId].employer != address(0), "Payroll not found");
        _;
    }
    
    modifier notDisputed(uint256 payrollId) {
        require(payrolls[payrollId].status != PayrollStatus.DISPUTED, "Payroll disputed");
        _;
    }

    // ============ Constructor ============
    
    /**
     * @notice Initialize contract with USDC address
     * @param _usdc Address of USDC token contract
     */
    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    // ============ External Functions ============
    
    /**
     * @notice Deposit USDC into employer treasury
     * @param amount Amount of USDC to deposit (6 decimals)
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        // Transfer USDC from employer to contract
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
        
        employerBalance[msg.sender] += amount;
        
        emit FundsDeposited(msg.sender, amount);
    }
    
    /**
     * @notice Withdraw unused funds from employer treasury
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external {
        require(employerBalance[msg.sender] >= amount, "Insufficient balance");
        
        employerBalance[msg.sender] -= amount;
        
        bool success = usdc.transfer(msg.sender, amount);
        require(success, "Transfer failed");
    }
    
    /**
     * @notice Create a vesting-based payroll entry
     * @param employee Employee address
     * @param totalAmount Total USDC amount for the payroll
     * @param startTime Vesting start timestamp
     * @param endTime Vesting end timestamp  
     * @param cliffDuration Cliff period in seconds
     * @param disputeWindow Time window for raising disputes
     * @return payrollId The created payroll ID
     */
    function createVestingPayroll(
        address employee,
        uint256 totalAmount,
        uint256 startTime,
        uint256 endTime,
        uint256 cliffDuration,
        uint256 disputeWindow
    ) external returns (uint256) {
        // Validations
        require(employee != address(0), "Invalid employee");
        require(employee != msg.sender, "Cannot pay yourself");
        require(totalAmount > 0, "Amount must be > 0");
        require(startTime >= block.timestamp, "Start must be future");
        require(endTime > startTime, "End must be after start");
        require(startTime + cliffDuration <= endTime, "Cliff exceeds duration");
        require(
            disputeWindow >= MIN_DISPUTE_WINDOW && disputeWindow <= MAX_DISPUTE_WINDOW,
            "Invalid dispute window"
        );
        require(employerBalance[msg.sender] >= totalAmount, "Insufficient balance");
        
        // Lock funds from employer balance
        employerBalance[msg.sender] -= totalAmount;
        
        // Create payroll
        uint256 payrollId = payrollCounter++;
        
        payrolls[payrollId] = PayrollEntry({
            employer: msg.sender,
            employee: employee,
            totalAmount: totalAmount,
            claimedAmount: 0,
            startTime: startTime,
            endTime: endTime,
            disputeWindow: disputeWindow,
            payrollType: PayrollType.VESTING,
            status: PayrollStatus.ACTIVE,
            vestingCliff: startTime + cliffDuration,
            lastClaimTime: startTime
        });
        
        // Track payroll relationships
        employerPayrolls[msg.sender].push(payrollId);
        employeePayrolls[employee].push(payrollId);
        
        emit PayrollCreated(payrollId, msg.sender, employee, totalAmount, PayrollType.VESTING);
        
        return payrollId;
    }
    
    /**
     * @notice Create a milestone-based payroll entry
     * @param employee Employee address
     * @param totalAmount Total USDC amount (must equal sum of milestone amounts)
     * @param descriptions Array of milestone descriptions
     * @param amounts Array of milestone amounts
     * @param disputeWindow Time window for raising disputes
     * @return payrollId The created payroll ID
     */
    function createMilestonePayroll(
        address employee,
        uint256 totalAmount,
        string[] calldata descriptions,
        uint256[] calldata amounts,
        uint256 disputeWindow
    ) external returns (uint256) {
        // Validations
        require(employee != address(0), "Invalid employee");
        require(employee != msg.sender, "Cannot pay yourself");
        require(totalAmount > 0, "Amount must be > 0");
        require(descriptions.length == amounts.length, "Array length mismatch");
        require(descriptions.length > 0 && descriptions.length <= 20, "Invalid milestone count");
        require(
            disputeWindow >= MIN_DISPUTE_WINDOW && disputeWindow <= MAX_DISPUTE_WINDOW,
            "Invalid dispute window"
        );
        require(employerBalance[msg.sender] >= totalAmount, "Insufficient balance");
        
        // Verify amounts sum to total
        uint256 sum = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Milestone amount must be > 0");
            sum += amounts[i];
        }
        require(sum == totalAmount, "Amounts must equal total");
        
        // Lock funds
        employerBalance[msg.sender] -= totalAmount;
        
        // Create payroll
        uint256 payrollId = payrollCounter++;
        
        payrolls[payrollId] = PayrollEntry({
            employer: msg.sender,
            employee: employee,
            totalAmount: totalAmount,
            claimedAmount: 0,
            startTime: block.timestamp,
            endTime: 0, // Not used for milestones
            disputeWindow: disputeWindow,
            payrollType: PayrollType.MILESTONE,
            status: PayrollStatus.ACTIVE,
            vestingCliff: 0, // Not used for milestones
            lastClaimTime: block.timestamp
        });
        
        // Store milestones
        for (uint256 i = 0; i < descriptions.length; i++) {
            milestones[payrollId].push(Milestone({
                description: descriptions[i],
                amount: amounts[i],
                completed: false,
                approved: false
            }));
        }
        
        // Track relationships
        employerPayrolls[msg.sender].push(payrollId);
        employeePayrolls[employee].push(payrollId);
        
        emit PayrollCreated(payrollId, msg.sender, employee, totalAmount, PayrollType.MILESTONE);
        
        return payrollId;
    }
    
    /**
     * @notice Claim vested funds for a vesting payroll
     * @param payrollId ID of the payroll
     */
    function claimVestedFunds(uint256 payrollId) 
        external 
        payrollExists(payrollId)
        onlyEmployee(payrollId)
        notDisputed(payrollId)
    {
        PayrollEntry storage payroll = payrolls[payrollId];
        require(payroll.payrollType == PayrollType.VESTING, "Not vesting payroll");
        require(payroll.status == PayrollStatus.ACTIVE, "Payroll not active");
        require(block.timestamp >= payroll.vestingCliff, "Cliff not reached");
        
        uint256 claimable = _calculateVestedAmount(payrollId) - payroll.claimedAmount;
        require(claimable > 0, "Nothing to claim");
        
        payroll.claimedAmount += claimable;
        payroll.lastClaimTime = block.timestamp;
        
        // Check if fully vested
        if (payroll.claimedAmount >= payroll.totalAmount) {
            payroll.status = PayrollStatus.COMPLETED;
        }
        
        // Transfer USDC to employee
        bool success = usdc.transfer(payroll.employee, claimable);
        require(success, "Transfer failed");
        
        emit FundsClaimed(payrollId, payroll.employee, claimable);
    }
    
    /**
     * @notice Mark a milestone as complete (employee action)
     * @param payrollId ID of the payroll
     * @param milestoneIndex Index of the milestone
     */
    function markMilestoneComplete(uint256 payrollId, uint256 milestoneIndex)
        external
        payrollExists(payrollId)
        onlyEmployee(payrollId)
        notDisputed(payrollId)
    {
        PayrollEntry storage payroll = payrolls[payrollId];
        require(payroll.payrollType == PayrollType.MILESTONE, "Not milestone payroll");
        require(payroll.status == PayrollStatus.ACTIVE, "Payroll not active");
        require(milestoneIndex < milestones[payrollId].length, "Invalid milestone");
        
        Milestone storage milestone = milestones[payrollId][milestoneIndex];
        require(!milestone.completed, "Already completed");
        
        milestone.completed = true;
        
        emit MilestoneCompleted(payrollId, milestoneIndex);
    }
    
    /**
     * @notice Approve a completed milestone (employer action)
     * @param payrollId ID of the payroll
     * @param milestoneIndex Index of the milestone
     */
    function approveMilestone(uint256 payrollId, uint256 milestoneIndex)
        external
        payrollExists(payrollId)
        onlyEmployer(payrollId)
        notDisputed(payrollId)
    {
        PayrollEntry storage payroll = payrolls[payrollId];
        require(payroll.payrollType == PayrollType.MILESTONE, "Not milestone payroll");
        require(payroll.status == PayrollStatus.ACTIVE, "Payroll not active");
        require(milestoneIndex < milestones[payrollId].length, "Invalid milestone");
        
        Milestone storage milestone = milestones[payrollId][milestoneIndex];
        require(milestone.completed, "Not marked complete");
        require(!milestone.approved, "Already approved");
        
        milestone.approved = true;
        
        emit MilestoneApproved(payrollId, milestoneIndex, milestone.amount);
    }
    
    /**
     * @notice Claim funds for approved milestones
     * @param payrollId ID of the payroll
     */
    function claimMilestoneFunds(uint256 payrollId)
        external
        payrollExists(payrollId)
        onlyEmployee(payrollId)
        notDisputed(payrollId)
    {
        PayrollEntry storage payroll = payrolls[payrollId];
        require(payroll.payrollType == PayrollType.MILESTONE, "Not milestone payroll");
        require(payroll.status == PayrollStatus.ACTIVE, "Payroll not active");
        
        uint256 claimable = _calculateApprovedMilestones(payrollId) - payroll.claimedAmount;
        require(claimable > 0, "Nothing to claim");
        
        payroll.claimedAmount += claimable;
        
        // Check if all milestones completed
        if (payroll.claimedAmount >= payroll.totalAmount) {
            payroll.status = PayrollStatus.COMPLETED;
        }
        
        bool success = usdc.transfer(payroll.employee, claimable);
        require(success, "Transfer failed");
        
        emit FundsClaimed(payrollId, payroll.employee, claimable);
    }
    
    /**
     * @notice Raise a dispute to freeze payroll funds
     * @param payrollId ID of the payroll
     */
    function raiseDispute(uint256 payrollId)
        external
        payrollExists(payrollId)
        onlyEmployer(payrollId)
    {
        PayrollEntry storage payroll = payrolls[payrollId];
        require(payroll.status == PayrollStatus.ACTIVE, "Payroll not active");
        
        payroll.status = PayrollStatus.DISPUTED;
        
        emit DisputeRaised(payrollId, msg.sender);
    }
    
    /**
     * @notice Resolve a dispute (simplified - employer decides for hackathon MVP)
     * @param payrollId ID of the payroll
     * @param releaseToEmployee True to release remaining funds to employee
     */
    function resolveDispute(uint256 payrollId, bool releaseToEmployee)
        external
        payrollExists(payrollId)
        onlyEmployer(payrollId)
    {
        PayrollEntry storage payroll = payrolls[payrollId];
        require(payroll.status == PayrollStatus.DISPUTED, "Not disputed");
        
        uint256 remaining = payroll.totalAmount - payroll.claimedAmount;
        
        if (releaseToEmployee && remaining > 0) {
            payroll.claimedAmount = payroll.totalAmount;
            bool success = usdc.transfer(payroll.employee, remaining);
            require(success, "Transfer failed");
            emit FundsClaimed(payrollId, payroll.employee, remaining);
        } else if (!releaseToEmployee && remaining > 0) {
            // Return funds to employer
            employerBalance[payroll.employer] += remaining;
        }
        
        payroll.status = PayrollStatus.COMPLETED;
        
        emit DisputeResolved(payrollId, releaseToEmployee);
    }
    
    /**
     * @notice Cancel a payroll (only before any claims)
     * @param payrollId ID of the payroll
     */
    function cancelPayroll(uint256 payrollId)
        external
        payrollExists(payrollId)
        onlyEmployer(payrollId)
    {
        PayrollEntry storage payroll = payrolls[payrollId];
        require(payroll.status == PayrollStatus.ACTIVE, "Payroll not active");
        require(payroll.claimedAmount == 0, "Already has claims");
        
        // Return all funds to employer
        employerBalance[payroll.employer] += payroll.totalAmount;
        payroll.status = PayrollStatus.CANCELLED;
        
        emit PayrollCancelled(payrollId);
    }

    // ============ View Functions ============
    
    /**
     * @notice Get claimable amount for a payroll
     * @param payrollId ID of the payroll
     * @return Claimable amount in USDC
     */
    function getClaimableAmount(uint256 payrollId) 
        external 
        view 
        payrollExists(payrollId)
        returns (uint256) 
    {
        PayrollEntry storage payroll = payrolls[payrollId];
        
        if (payroll.status != PayrollStatus.ACTIVE) {
            return 0;
        }
        
        if (payroll.payrollType == PayrollType.VESTING) {
            if (block.timestamp < payroll.vestingCliff) {
                return 0;
            }
            return _calculateVestedAmount(payrollId) - payroll.claimedAmount;
        } else {
            return _calculateApprovedMilestones(payrollId) - payroll.claimedAmount;
        }
    }
    
    /**
     * @notice Get payroll details
     * @param payrollId ID of the payroll
     */
    function getPayroll(uint256 payrollId) 
        external 
        view 
        returns (PayrollEntry memory) 
    {
        return payrolls[payrollId];
    }
    
    /**
     * @notice Get milestones for a payroll
     * @param payrollId ID of the payroll
     */
    function getMilestones(uint256 payrollId)
        external
        view
        returns (Milestone[] memory)
    {
        return milestones[payrollId];
    }
    
    /**
     * @notice Get all payroll IDs for an employer
     * @param employer Employer address
     */
    function getEmployerPayrolls(address employer)
        external
        view
        returns (uint256[] memory)
    {
        return employerPayrolls[employer];
    }
    
    /**
     * @notice Get all payroll IDs for an employee
     * @param employee Employee address
     */
    function getEmployeePayrolls(address employee)
        external
        view
        returns (uint256[] memory)
    {
        return employeePayrolls[employee];
    }

    // ============ Internal Functions ============
    
    /**
     * @dev Calculate vested amount based on linear vesting
     */
    function _calculateVestedAmount(uint256 payrollId) internal view returns (uint256) {
        PayrollEntry storage payroll = payrolls[payrollId];
        
        if (block.timestamp < payroll.vestingCliff) {
            return 0;
        }
        
        if (block.timestamp >= payroll.endTime) {
            return payroll.totalAmount;
        }
        
        uint256 elapsed = block.timestamp - payroll.startTime;
        uint256 duration = payroll.endTime - payroll.startTime;
        
        return (payroll.totalAmount * elapsed) / duration;
    }
    
    /**
     * @dev Calculate total approved milestone amounts
     */
    function _calculateApprovedMilestones(uint256 payrollId) internal view returns (uint256) {
        Milestone[] storage ms = milestones[payrollId];
        uint256 total = 0;
        
        for (uint256 i = 0; i < ms.length; i++) {
            if (ms[i].approved) {
                total += ms[i].amount;
            }
        }
        
        return total;
    }
}
