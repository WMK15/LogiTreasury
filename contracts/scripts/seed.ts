import { ethers, network } from "hardhat";

/**
 * Seed deployed contracts with test data
 * 
 * Usage:
 *   npx hardhat run scripts/seed.ts --network arcTestnet
 */

// Deployed contract addresses
const DEPLOYED = {
  usdc: "0x5D2EF4689bd78E78aC6f25cBAb601B74a16597cB",
  eurc: "0x889dbe4EdD1A8b83BB34dD10CBc0e30725490dC9",
  usyc: "0xfE7E6B7C10C59796Ed887774f83d80aa3865366D",
  stableFx: "0x1743B520179E2dbAabBC8587661CC5b7bE42f7c4",
  freightEscrow: "0xf51eA88Ce8762021f8516393C4016d131d6FA085",
  treasury: "0xDD7bB606DE0ABD7AEF79A5b3e257bf09fEcF6A48",
  settlement: "0x8500aE3e1303a42110592AE268E4f1BDfed37a85",
  batchPayroll: "0x5CcD00fD13dF4E3121ee1f4Ccd76253966b9fb86",
};

async function main() {
  console.log("=".repeat(60));
  console.log("Seeding LogiTreasury Contracts");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log("");

  // Get contract instances
  const usdc = await ethers.getContractAt("MockUSDC", DEPLOYED.usdc);
  const eurc = await ethers.getContractAt("MockEURC", DEPLOYED.eurc);
  const stableFx = await ethers.getContractAt("MockStableFX", DEPLOYED.stableFx);

  const MILLION = ethers.parseUnits("1000000", 6);
  const HALF_MILLION = MILLION / 2n;

  // Check current balances
  const usdcBalance = await usdc.balanceOf(deployer.address);
  const eurcBalance = await eurc.balanceOf(deployer.address);
  console.log(`Current USDC balance: ${ethers.formatUnits(usdcBalance, 6)}`);
  console.log(`Current EURC balance: ${ethers.formatUnits(eurcBalance, 6)}`);
  console.log("");

  // Mint more if needed
  if (usdcBalance < MILLION) {
    console.log("Minting 1M USDC...");
    const tx = await usdc.mint(deployer.address, MILLION);
    await tx.wait();
    console.log("  Done");
  }

  if (eurcBalance < MILLION) {
    console.log("Minting 1M EURC...");
    const tx = await eurc.mint(deployer.address, MILLION);
    await tx.wait();
    console.log("  Done");
  }

  // Check StableFX liquidity
  const stableFxUsdcBalance = await usdc.balanceOf(DEPLOYED.stableFx);
  const stableFxEurcBalance = await eurc.balanceOf(DEPLOYED.stableFx);
  console.log(`StableFX USDC: ${ethers.formatUnits(stableFxUsdcBalance, 6)}`);
  console.log(`StableFX EURC: ${ethers.formatUnits(stableFxEurcBalance, 6)}`);

  if (stableFxUsdcBalance < HALF_MILLION) {
    console.log("Seeding StableFX with liquidity...");
    
    console.log("  Approving USDC...");
    let tx = await usdc.approve(DEPLOYED.stableFx, HALF_MILLION);
    await tx.wait();
    
    console.log("  Approving EURC...");
    tx = await eurc.approve(DEPLOYED.stableFx, HALF_MILLION);
    await tx.wait();
    
    console.log("  Seeding liquidity...");
    tx = await stableFx.seedLiquidity(HALF_MILLION, HALF_MILLION);
    await tx.wait();
    
    console.log("  Done - seeded 500K USDC + 500K EURC");
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("SEEDING COMPLETE");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
