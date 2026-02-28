import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  MockUSDC,
  MockEURC,
  MockUSYC,
  YieldVaultAdapter,
  TreasuryManager
} from "../typechain-types";

describe("TreasuryManager Suite", function () {
  let usdc: MockUSDC;
  let eurc: MockEURC;
  let usyc: MockUSYC;
  let yieldAdapter: YieldVaultAdapter;
  let treasuryManager: TreasuryManager;

  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let user: SignerWithAddress;

  const USDC_DECIMALS = 6;
  const MILLION = ethers.parseUnits("1000000", USDC_DECIMALS);
  const THOUSAND = ethers.parseUnits("1000", USDC_DECIMALS);
  const FIFTY_K = ethers.parseUnits("50000", USDC_DECIMALS);
  const HUNDRED_K = ethers.parseUnits("100000", USDC_DECIMALS);

  beforeEach(async function () {
    [owner, operator, user] = await ethers.getSigners();

    // 1. Deploy Mocks
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDCFactory.deploy();
    await usdc.waitForDeployment();

    const MockEURCFactory = await ethers.getContractFactory("MockEURC");
    eurc = await MockEURCFactory.deploy();
    await eurc.waitForDeployment();

    const MockUSYCFactory = await ethers.getContractFactory("MockUSYC");
    usyc = await MockUSYCFactory.deploy(await usdc.getAddress());
    await usyc.waitForDeployment();

    // 2. Deploy Adapter
    const YieldVaultAdapterFactory = await ethers.getContractFactory("YieldVaultAdapter");
    yieldAdapter = await YieldVaultAdapterFactory.deploy(
      await usdc.getAddress(), 
      await usyc.getAddress()
    );
    await yieldAdapter.waitForDeployment();

    // 3. Deploy Treasury Manager
    const TreasuryManagerFactory = await ethers.getContractFactory("TreasuryManager");
    treasuryManager = await TreasuryManagerFactory.deploy(
      await usdc.getAddress(),
      await eurc.getAddress(),
      await yieldAdapter.getAddress()
    );
    await treasuryManager.waitForDeployment();

    // 4. Configure
    await yieldAdapter.setTreasuryManager(await treasuryManager.getAddress());
    await treasuryManager.setOperator(operator.address, true);

    // 5. Mint tokens
    await usdc.mint(owner.address, MILLION);
    await usdc.mint(user.address, THOUSAND);
  });

  describe("Deployment", function () {
    it("Should set the right owner and default config", async function () {
      expect(await treasuryManager.owner()).to.equal(owner.address);
      const config = await treasuryManager.getYieldConfig();
      expect(config.targetAllocationBps).to.equal(8000n);
      expect(config.minLiquidBuffer).to.equal(FIFTY_K); // 50,000 USDC
      expect(config.autoSweepEnabled).to.be.true;
    });
  });

  describe("Deposits", function () {
    it("Should allow user to deposit USDC", async function () {
      await usdc.connect(user).approve(await treasuryManager.getAddress(), THOUSAND);
      
      await expect(treasuryManager.connect(user).depositUsdc(THOUSAND))
        .to.emit(treasuryManager, "Deposit");

      expect(await treasuryManager.liquidUsdcBalance()).to.equal(THOUSAND);
    });

    it("Should auto-sweep if deposit exceeds buffer and threshold", async function () {
      const largeAmount = ethers.parseUnits("70000", USDC_DECIMALS); // 70k > 50k buffer + 10k threshold
      await usdc.mint(user.address, largeAmount);
      await usdc.connect(user).approve(await treasuryManager.getAddress(), largeAmount);

      // We should see a YieldSwept event with amount = 20k * 80%? 
      // Available = 70k - 50k = 20k, 80% of 20k = 16k swept.
      const expectedSweep = ethers.parseUnits("16000", USDC_DECIMALS);

      await expect(treasuryManager.connect(user).depositUsdc(largeAmount))
        .to.emit(treasuryManager, "YieldSwept");
      
      const balanceSnap = await treasuryManager.getBalanceSnapshot();
      expect(balanceSnap.liquidUsdc).to.equal(largeAmount - expectedSweep);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await usdc.connect(owner).approve(await treasuryManager.getAddress(), HUNDRED_K);
      await treasuryManager.connect(owner).depositUsdc(HUNDRED_K);
    });

    it("Should allow operator to execute small withdrawal", async function () {
      const withdrawAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      const balanceBefore = await usdc.balanceOf(user.address);

      await expect(treasuryManager.connect(operator).withdrawUsdc(withdrawAmount, user.address, "Test payout"))
        .to.emit(treasuryManager, "Withdrawal")
        .withArgs(user.address, await usdc.getAddress(), withdrawAmount, "Test payout");

      const balanceAfter = await usdc.balanceOf(user.address);
      expect(balanceAfter - balanceBefore).to.equal(withdrawAmount);
    });

    it("Should require admin approval for large withdrawal", async function () {
      // Current threshold is 100k
      const hugeAmount = HUNDRED_K;
      await usdc.mint(owner.address, hugeAmount);
      await usdc.connect(owner).approve(await treasuryManager.getAddress(), hugeAmount);
      await treasuryManager.connect(owner).depositUsdc(hugeAmount); // Total 200k in Treasury

      // Request withdrawal (creates a pending request)
      await expect(treasuryManager.connect(operator).withdrawUsdc(hugeAmount, user.address, "Large payout"))
        .to.emit(treasuryManager, "LargeWithdrawalRequested");

      // Verify withdrawal not executed yet
      const req = await treasuryManager.withdrawalRequests(0);
      expect(req.executed).to.be.false;
      expect(req.amount).to.equal(hugeAmount);

      // Admin approves
      await expect(treasuryManager.connect(owner).approveWithdrawal(0))
        .to.emit(treasuryManager, "WithdrawalApproved");

      // Operator executes
      const balanceBefore = await usdc.balanceOf(user.address);
      await treasuryManager.connect(operator).executeWithdrawal(0);
      const balanceAfter = await usdc.balanceOf(user.address);

      expect(balanceAfter - balanceBefore).to.equal(hugeAmount);
    });

    it("Should block non-operator from withdrawing", async function () {
      await expect(
        treasuryManager.connect(user).withdrawUsdc(THOUSAND, user.address, "Hack")
      ).to.be.revertedWith("TreasuryManager: not operator");
    });
  });

  describe("Yield Harvesting", function () {
    let depositAmount;
    beforeEach(async function () {
      depositAmount = ethers.parseUnits("100000", USDC_DECIMALS);
      await usdc.connect(owner).approve(await treasuryManager.getAddress(), depositAmount);
      await treasuryManager.connect(owner).depositUsdc(depositAmount);
      // Auto-sweep will sweep some funds to USYC
    });

    it("Should accumulate yield and allow harvesting", async function () {
      // Fast forward 1 year
      const ONE_YEAR = 365 * 24 * 60 * 60;
      await time.increase(ONE_YEAR);
      await usyc.accrueYield();

      const yieldMetrics = await yieldAdapter.getYieldMetrics();
      expect(yieldMetrics.unrealizedYield).to.be.gt(0);

      await expect(treasuryManager.connect(operator).harvestYield())
        .to.emit(treasuryManager, "YieldHarvested");

      expect(await treasuryManager.totalYieldEarned()).to.be.gt(0);
    });
  });
});
