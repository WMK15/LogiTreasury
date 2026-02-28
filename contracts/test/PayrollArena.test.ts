import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { PayrollArena, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PayrollArena", function () {
  let payrollArena: PayrollArena;
  let usdc: MockUSDC;
  let employer: SignerWithAddress;
  let employee: SignerWithAddress;
  let other: SignerWithAddress;

  const USDC_DECIMALS = 6;
  const ONE_USDC = ethers.parseUnits("1", USDC_DECIMALS);
  const THOUSAND_USDC = ethers.parseUnits("1000", USDC_DECIMALS);
  const ONE_DAY = 24 * 60 * 60;
  const ONE_WEEK = 7 * ONE_DAY;
  const ONE_MONTH = 30 * ONE_DAY;

  beforeEach(async function () {
    [employer, employee, other] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Deploy PayrollArena
    const PayrollArena = await ethers.getContractFactory("PayrollArena");
    payrollArena = await PayrollArena.deploy(await usdc.getAddress());
    await payrollArena.waitForDeployment();

    // Mint USDC to employer
    await usdc.mint(employer.address, THOUSAND_USDC * 10n);
  });

  describe("Deposit", function () {
    it("should allow employer to deposit USDC", async function () {
      await usdc.connect(employer).approve(await payrollArena.getAddress(), THOUSAND_USDC);
      
      await expect(payrollArena.connect(employer).deposit(THOUSAND_USDC))
        .to.emit(payrollArena, "FundsDeposited")
        .withArgs(employer.address, THOUSAND_USDC);

      expect(await payrollArena.employerBalance(employer.address)).to.equal(THOUSAND_USDC);
    });
  });

  describe("Vesting Payroll", function () {
    beforeEach(async function () {
      await usdc.connect(employer).approve(await payrollArena.getAddress(), THOUSAND_USDC);
      await payrollArena.connect(employer).deposit(THOUSAND_USDC);
    });

    it("should create vesting payroll", async function () {
      const startTime = (await time.latest()) + ONE_DAY;
      const endTime = startTime + ONE_MONTH;
      const cliffDuration = ONE_WEEK;
      const disputeWindow = ONE_DAY;

      await expect(
        payrollArena.connect(employer).createVestingPayroll(
          employee.address,
          THOUSAND_USDC,
          startTime,
          endTime,
          cliffDuration,
          disputeWindow
        )
      ).to.emit(payrollArena, "PayrollCreated");

      const payroll = await payrollArena.getPayroll(0);
      expect(payroll.employee).to.equal(employee.address);
      expect(payroll.totalAmount).to.equal(THOUSAND_USDC);
    });

    it("should allow claiming after cliff", async function () {
      const startTime = (await time.latest()) + 1;
      const endTime = startTime + ONE_MONTH;
      const cliffDuration = ONE_WEEK;

      await payrollArena.connect(employer).createVestingPayroll(
        employee.address,
        THOUSAND_USDC,
        startTime,
        endTime,
        cliffDuration,
        ONE_DAY
      );

      // Move past cliff
      await time.increase(ONE_WEEK + ONE_DAY);

      const claimable = await payrollArena.getClaimableAmount(0);
      expect(claimable).to.be.gt(0);

      await expect(payrollArena.connect(employee).claimVestedFunds(0))
        .to.emit(payrollArena, "FundsClaimed");
    });
  });

  describe("Milestone Payroll", function () {
    beforeEach(async function () {
      await usdc.connect(employer).approve(await payrollArena.getAddress(), THOUSAND_USDC);
      await payrollArena.connect(employer).deposit(THOUSAND_USDC);
    });

    it("should create milestone payroll", async function () {
      const descriptions = ["Phase 1", "Phase 2", "Phase 3"];
      const amounts = [
        ethers.parseUnits("300", USDC_DECIMALS),
        ethers.parseUnits("300", USDC_DECIMALS),
        ethers.parseUnits("400", USDC_DECIMALS),
      ];

      await expect(
        payrollArena.connect(employer).createMilestonePayroll(
          employee.address,
          THOUSAND_USDC,
          descriptions,
          amounts,
          ONE_DAY
        )
      ).to.emit(payrollArena, "PayrollCreated");

      const milestones = await payrollArena.getMilestones(0);
      expect(milestones.length).to.equal(3);
    });

    it("should allow milestone completion and approval flow", async function () {
      const descriptions = ["Phase 1"];
      const amounts = [THOUSAND_USDC];

      await payrollArena.connect(employer).createMilestonePayroll(
        employee.address,
        THOUSAND_USDC,
        descriptions,
        amounts,
        ONE_DAY
      );

      // Employee marks complete
      await expect(payrollArena.connect(employee).markMilestoneComplete(0, 0))
        .to.emit(payrollArena, "MilestoneCompleted");

      // Employer approves
      await expect(payrollArena.connect(employer).approveMilestone(0, 0))
        .to.emit(payrollArena, "MilestoneApproved");

      // Employee claims
      const balanceBefore = await usdc.balanceOf(employee.address);
      await payrollArena.connect(employee).claimMilestoneFunds(0);
      const balanceAfter = await usdc.balanceOf(employee.address);

      expect(balanceAfter - balanceBefore).to.equal(THOUSAND_USDC);
    });
  });

  describe("Disputes", function () {
    beforeEach(async function () {
      await usdc.connect(employer).approve(await payrollArena.getAddress(), THOUSAND_USDC);
      await payrollArena.connect(employer).deposit(THOUSAND_USDC);
      
      await payrollArena.connect(employer).createMilestonePayroll(
        employee.address,
        THOUSAND_USDC,
        ["Phase 1"],
        [THOUSAND_USDC],
        ONE_DAY
      );
    });

    it("should allow employer to raise dispute", async function () {
      await expect(payrollArena.connect(employer).raiseDispute(0))
        .to.emit(payrollArena, "DisputeRaised");

      const payroll = await payrollArena.getPayroll(0);
      expect(payroll.status).to.equal(1); // DISPUTED
    });

    it("should block claims during dispute", async function () {
      await payrollArena.connect(employee).markMilestoneComplete(0, 0);
      await payrollArena.connect(employer).approveMilestone(0, 0);
      await payrollArena.connect(employer).raiseDispute(0);

      await expect(
        payrollArena.connect(employee).claimMilestoneFunds(0)
      ).to.be.revertedWith("Payroll disputed");
    });

    it("should resolve dispute in favor of employee", async function () {
      await payrollArena.connect(employer).raiseDispute(0);
      
      await expect(payrollArena.connect(employer).resolveDispute(0, true))
        .to.emit(payrollArena, "DisputeResolved")
        .withArgs(0, true);

      expect(await usdc.balanceOf(employee.address)).to.equal(THOUSAND_USDC);
    });
  });
});
