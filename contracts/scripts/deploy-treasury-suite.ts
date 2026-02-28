import { ethers, network } from "hardhat";

/**
 * Deploy ArcLogistics Treasury Suite
 * 
 * Deploys:
 * - TreasuryManager (core orchestration)
 * - YieldVaultAdapter (USYC integration)
 * - FXExecutionEngine (StableFX RFQ)
 * - SettlementRouter (Arc Bridge Kit)
 * - CPNGateway (Circle Payments Network)
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-treasury-suite.ts --network arcTestnet
 *   npx hardhat run scripts/deploy-treasury-suite.ts --network localhost
 */

// Existing deployed mock addresses on Arc Testnet
const DEPLOYED_MOCKS = {
  usdc: "0x5D2EF4689bd78E78aC6f25cBAb601B74a16597cB",
  eurc: "0x889dbe4EdD1A8b83BB34dD10CBc0e30725490dC9",
  usyc: "0xfE7E6B7C10C59796Ed887774f83d80aa3865366D",
  stableFX: "0x1743B520179E2dbAabBC8587661CC5b7bE42f7c4",
};

async function main() {
  console.log("=".repeat(60));
  console.log("ArcLogistics Treasury Suite Deployment");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatUnits(balance, 18)} (native)`);
  console.log("");

  // Use existing mocks or deploy new ones for localhost
  let usdc: string, eurc: string, usyc: string, stableFX: string;

  if (network.name === "arcTestnet") {
    console.log("Using existing deployed mock contracts...");
    usdc = DEPLOYED_MOCKS.usdc;
    eurc = DEPLOYED_MOCKS.eurc;
    usyc = DEPLOYED_MOCKS.usyc;
    stableFX = DEPLOYED_MOCKS.stableFX;
  } else {
    console.log("Deploying fresh mock contracts for local testing...");
    
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdcContract = await MockUSDC.deploy();
    await usdcContract.waitForDeployment();
    usdc = await usdcContract.getAddress();
    console.log(`  MockUSDC: ${usdc}`);

    const MockEURC = await ethers.getContractFactory("MockEURC");
    const eurcContract = await MockEURC.deploy();
    await eurcContract.waitForDeployment();
    eurc = await eurcContract.getAddress();
    console.log(`  MockEURC: ${eurc}`);

    const MockUSYC = await ethers.getContractFactory("MockUSYC");
    const usycContract = await MockUSYC.deploy(usdc);
    await usycContract.waitForDeployment();
    usyc = await usycContract.getAddress();
    console.log(`  MockUSYC: ${usyc}`);

    const MockStableFX = await ethers.getContractFactory("MockStableFX");
    const stableFXContract = await MockStableFX.deploy(usdc, eurc);
    await stableFXContract.waitForDeployment();
    stableFX = await stableFXContract.getAddress();
    console.log(`  MockStableFX: ${stableFX}`);

    // Seed liquidity for local testing
    const MILLION = ethers.parseUnits("1000000", 6);
    await usdcContract.mint(deployer.address, MILLION);
    await eurcContract.mint(deployer.address, MILLION);
    await usdcContract.approve(stableFX, MILLION / 2n);
    await eurcContract.approve(stableFX, MILLION / 2n);
    await stableFXContract.seedLiquidity(MILLION / 2n, MILLION / 2n);
    console.log("  Seeded StableFX with liquidity");
  }
  console.log("");

  // ============ Deploy Treasury Suite ============
  console.log("Deploying Treasury Suite...");
  console.log("");

  // 1. YieldVaultAdapter (must deploy first, TreasuryManager needs it)
  console.log("1. Deploying YieldVaultAdapter...");
  const YieldVaultAdapter = await ethers.getContractFactory("YieldVaultAdapter");
  const yieldVaultAdapter = await YieldVaultAdapter.deploy(usdc, usyc);
  await yieldVaultAdapter.waitForDeployment();
  const yieldVaultAdapterAddress = await yieldVaultAdapter.getAddress();
  console.log(`   YieldVaultAdapter: ${yieldVaultAdapterAddress}`);

  // 2. TreasuryManager (takes yieldAdapter in constructor)
  console.log("2. Deploying TreasuryManager...");
  const TreasuryManager = await ethers.getContractFactory("TreasuryManager");
  const treasuryManager = await TreasuryManager.deploy(usdc, eurc, yieldVaultAdapterAddress);
  await treasuryManager.waitForDeployment();
  const treasuryManagerAddress = await treasuryManager.getAddress();
  console.log(`   TreasuryManager: ${treasuryManagerAddress}`);

  // 3. FXExecutionEngine
  console.log("3. Deploying FXExecutionEngine...");
  const FXExecutionEngine = await ethers.getContractFactory("FXExecutionEngine");
  const fxEngine = await FXExecutionEngine.deploy(usdc, eurc, stableFX);
  await fxEngine.waitForDeployment();
  const fxEngineAddress = await fxEngine.getAddress();
  console.log(`   FXExecutionEngine: ${fxEngineAddress}`);

  // 4. SettlementRouter
  console.log("4. Deploying SettlementRouter...");
  const SettlementRouter = await ethers.getContractFactory("SettlementRouter");
  const settlementRouter = await SettlementRouter.deploy(usdc, eurc);
  await settlementRouter.waitForDeployment();
  const settlementRouterAddress = await settlementRouter.getAddress();
  console.log(`   SettlementRouter: ${settlementRouterAddress}`);

  // 5. CPNGateway
  console.log("5. Deploying CPNGateway...");
  const CPNGateway = await ethers.getContractFactory("CPNGateway");
  const cpnGateway = await CPNGateway.deploy(usdc);
  await cpnGateway.waitForDeployment();
  const cpnGatewayAddress = await cpnGateway.getAddress();
  console.log(`   CPNGateway: ${cpnGatewayAddress}`);
  console.log("");

  // ============ Configure Contracts ============
  console.log("Configuring contracts...");

  // Set TreasuryManager on YieldVaultAdapter
  let tx = await yieldVaultAdapter.setTreasuryManager(treasuryManagerAddress);
  await tx.wait();
  console.log("  YieldVaultAdapter: TreasuryManager configured");

  // Set TreasuryManager as operator on FXExecutionEngine
  tx = await fxEngine.setOperator(treasuryManagerAddress, true);
  await tx.wait();
  console.log("  FXExecutionEngine: TreasuryManager set as operator");

  // Set TreasuryManager as operator on SettlementRouter
  tx = await settlementRouter.setOperator(treasuryManagerAddress, true);
  await tx.wait();
  console.log("  SettlementRouter: TreasuryManager set as operator");

  // Set TreasuryManager as operator on CPNGateway
  tx = await cpnGateway.setOperator(treasuryManagerAddress, true);
  await tx.wait();
  console.log("  CPNGateway: TreasuryManager set as operator");

  // Set deployer as operator on TreasuryManager for testing
  tx = await treasuryManager.setOperator(deployer.address, true);
  await tx.wait();
  console.log("  TreasuryManager: Deployer set as operator");
  console.log("");

  // ============ Output Summary ============
  console.log("=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("");
  console.log("Treasury Suite Addresses:");
  console.log(`  TreasuryManager:    ${treasuryManagerAddress}`);
  console.log(`  YieldVaultAdapter:  ${yieldVaultAdapterAddress}`);
  console.log(`  FXExecutionEngine:  ${fxEngineAddress}`);
  console.log(`  SettlementRouter:   ${settlementRouterAddress}`);
  console.log(`  CPNGateway:         ${cpnGatewayAddress}`);
  console.log("");
  console.log("Mock Token Addresses:");
  console.log(`  USDC:     ${usdc}`);
  console.log(`  EURC:     ${eurc}`);
  console.log(`  USYC:     ${usyc}`);
  console.log(`  StableFX: ${stableFX}`);
  console.log("");
  console.log("Add to frontend/.env.local:");
  console.log("");
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdc}`);
  console.log(`NEXT_PUBLIC_EURC_ADDRESS=${eurc}`);
  console.log(`NEXT_PUBLIC_USYC_ADDRESS=${usyc}`);
  console.log(`NEXT_PUBLIC_STABLEFX_ADDRESS=${stableFX}`);
  console.log(`NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS=${treasuryManagerAddress}`);
  console.log(`NEXT_PUBLIC_YIELD_VAULT_ADAPTER_ADDRESS=${yieldVaultAdapterAddress}`);
  console.log(`NEXT_PUBLIC_FX_ENGINE_ADDRESS=${fxEngineAddress}`);
  console.log(`NEXT_PUBLIC_SETTLEMENT_ROUTER_ADDRESS=${settlementRouterAddress}`);
  console.log(`NEXT_PUBLIC_CPN_GATEWAY_ADDRESS=${cpnGatewayAddress}`);
  console.log("");
  console.log("=".repeat(60));

  // Return addresses for programmatic use
  return {
    treasuryManager: treasuryManagerAddress,
    yieldVaultAdapter: yieldVaultAdapterAddress,
    fxEngine: fxEngineAddress,
    settlementRouter: settlementRouterAddress,
    cpnGateway: cpnGatewayAddress,
    usdc,
    eurc,
    usyc,
    stableFX,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
