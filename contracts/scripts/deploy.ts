import { ethers, network } from "hardhat";

/**
 * Deploy PayrollArena contracts
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network arcTestnet
 *   npx hardhat run scripts/deploy.ts --network localhost
 */
async function main() {
  console.log("=".repeat(60));
  console.log("PayrollArena Deployment Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("");

  // Get USDC address from environment or deploy mock
  let usdcAddress = process.env.USDC_ADDRESS;
  
  if (!usdcAddress || usdcAddress === "0x0000000000000000000000000000000000000000") {
    console.log("Deploying Mock USDC for testing...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();
    console.log(`Mock USDC deployed: ${usdcAddress}`);
    
    // Mint some USDC to deployer for testing
    const mintAmount = ethers.parseUnits("1000000", 6); // 1M USDC
    await mockUsdc.mint(deployer.address, mintAmount);
    console.log(`Minted ${ethers.formatUnits(mintAmount, 6)} USDC to deployer`);
  } else {
    console.log(`Using existing USDC: ${usdcAddress}`);
  }
  console.log("");

  // Deploy PayrollArena
  console.log("Deploying PayrollArena...");
  const PayrollArena = await ethers.getContractFactory("PayrollArena");
  const payrollArena = await PayrollArena.deploy(usdcAddress);
  await payrollArena.waitForDeployment();
  
  const payrollArenaAddress = await payrollArena.getAddress();
  console.log(`PayrollArena deployed: ${payrollArenaAddress}`);
  console.log("");

  // Output deployment summary
  console.log("=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("");
  console.log("Add these to your frontend .env.local:");
  console.log("");
  console.log(`NEXT_PUBLIC_PAYROLL_ARENA_ADDRESS=${payrollArenaAddress}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=${network.config.chainId}`);
  console.log("");
  console.log("=".repeat(60));

  // Verify contracts on explorer (if not local)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("");
    console.log("Waiting for block confirmations before verification...");
    // Wait for confirmations if needed
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
