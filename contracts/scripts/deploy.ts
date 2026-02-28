import { ethers, network } from "hardhat";

/**
 * Deploy all LogiTreasury contracts
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network arcTestnet
 *   npx hardhat run scripts/deploy.ts --network localhost
 */
async function main() {
  console.log("=".repeat(60));
  console.log("LogiTreasury - European Logistics Treasury Platform");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatUnits(balance, 18)} (native)`);
  console.log("");

  // ============ Deploy Mock Tokens ============
  console.log("Deploying Mock Tokens...");
  
  // MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`  MockUSDC: ${usdcAddress}`);
  
  // MockEURC
  const MockEURC = await ethers.getContractFactory("MockEURC");
  const eurc = await MockEURC.deploy();
  await eurc.waitForDeployment();
  const eurcAddress = await eurc.getAddress();
  console.log(`  MockEURC: ${eurcAddress}`);
  
  // MockUSYC
  const MockUSYC = await ethers.getContractFactory("MockUSYC");
  const usyc = await MockUSYC.deploy(usdcAddress);
  await usyc.waitForDeployment();
  const usycAddress = await usyc.getAddress();
  console.log(`  MockUSYC: ${usycAddress}`);
  
  // MockStableFX
  const MockStableFX = await ethers.getContractFactory("MockStableFX");
  const stableFx = await MockStableFX.deploy(usdcAddress, eurcAddress);
  await stableFx.waitForDeployment();
  const stableFxAddress = await stableFx.getAddress();
  console.log(`  MockStableFX: ${stableFxAddress}`);
  console.log("");

  // ============ Deploy Core Contracts ============
  console.log("Deploying Core Contracts...");
  
  // FreightEscrow
  const FreightEscrow = await ethers.getContractFactory("FreightEscrow");
  const escrow = await FreightEscrow.deploy(usdcAddress, usycAddress, deployer.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`  FreightEscrow: ${escrowAddress}`);
  
  // Treasury
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(usdcAddress, usycAddress);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log(`  Treasury: ${treasuryAddress}`);
  
  // Settlement
  const Settlement = await ethers.getContractFactory("Settlement");
  const settlement = await Settlement.deploy(usdcAddress, eurcAddress, stableFxAddress);
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log(`  Settlement: ${settlementAddress}`);
  
  // BatchPayroll
  const BatchPayroll = await ethers.getContractFactory("BatchPayroll");
  const payroll = await BatchPayroll.deploy(usdcAddress, eurcAddress);
  await payroll.waitForDeployment();
  const payrollAddress = await payroll.getAddress();
  console.log(`  BatchPayroll: ${payrollAddress}`);
  console.log("");

  // ============ Seed Test Data ============
  console.log("Seeding test data...");
  
  const MILLION = ethers.parseUnits("1000000", 6);
  
  // Mint tokens to deployer
  let tx = await usdc.mint(deployer.address, MILLION);
  await tx.wait();
  console.log("  Minted 1M USDC to deployer");
  
  tx = await eurc.mint(deployer.address, MILLION);
  await tx.wait();
  console.log("  Minted 1M EURC to deployer");
  
  // Seed StableFX with liquidity
  tx = await usdc.approve(stableFxAddress, MILLION / 2n);
  await tx.wait();
  tx = await eurc.approve(stableFxAddress, MILLION / 2n);
  await tx.wait();
  tx = await stableFx.seedLiquidity(MILLION / 2n, MILLION / 2n);
  await tx.wait();
  console.log("  Seeded StableFX with 500K USDC + 500K EURC");
  console.log("");

  // ============ Output Summary ============
  console.log("=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("");
  console.log("Add to frontend/.env.local:");
  console.log("");
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
  console.log(`NEXT_PUBLIC_EURC_ADDRESS=${eurcAddress}`);
  console.log(`NEXT_PUBLIC_USYC_ADDRESS=${usycAddress}`);
  console.log(`NEXT_PUBLIC_STABLEFX_ADDRESS=${stableFxAddress}`);
  console.log(`NEXT_PUBLIC_FREIGHT_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`NEXT_PUBLIC_TREASURY_ADDRESS=${treasuryAddress}`);
  console.log(`NEXT_PUBLIC_SETTLEMENT_ADDRESS=${settlementAddress}`);
  console.log(`NEXT_PUBLIC_BATCH_PAYROLL_ADDRESS=${payrollAddress}`);
  console.log("");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
