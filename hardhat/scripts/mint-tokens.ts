
import { ethers } from "ethers";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RPC_URL = process.env.RPC_URL!;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY!;
const TARGET_ADDRESS = process.env.TARGET_ADDRESS!;

const deployedAddressesPath = join(__dirname, '../ignition/deployments/chain-31337/deployed_addresses.json');
const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));
const TOKEN1_ADDR = deployedAddresses['TestToken1Module#TestToken1'];
const TOKEN2_ADDR = deployedAddresses['TestToken2Module#TestToken2'];
const TOKEN3_ADDR = deployedAddresses['TestToken3Module#TestToken3'];
const TOKEN4_ADDR = deployedAddresses['TestToken4Module#TestToken4'];
const TOKEN5_ADDR = deployedAddresses['TestToken5Module#TestToken5'];
const TOKEN6_ADDR = deployedAddresses['TestToken6Module#TestToken6'];
const TOKEN7_ADDR = deployedAddresses['TestToken7Module#TestToken7'];

// Extended ERC20 ABI with mint function (for tokens that have it)
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

  const tokens = [
    { addr: TOKEN1_ADDR, name: "TestToken1" },
    { addr: TOKEN2_ADDR, name: "TestToken2" },
    { addr: TOKEN3_ADDR, name: "TestToken3" },
    { addr: TOKEN4_ADDR, name: "TestToken4" },
    { addr: TOKEN5_ADDR, name: "TestToken5" },
    { addr: TOKEN6_ADDR, name: "TestToken6" },
    { addr: TOKEN7_ADDR, name: "TestToken7" },
  ];

  const TARGET_AMOUNT = ethers.parseEther("1000");

  for (const tokenInfo of tokens) {
    const token = new ethers.Contract(
      tokenInfo.addr,
      ERC20_ABI,
      signer
    );

    const balance = await token.balanceOf(TARGET_ADDRESS);
    console.log(`\n${tokenInfo.name}:`);
    console.log(`  Target address balance: ${ethers.formatEther(balance)}`);

    if (balance >= TARGET_AMOUNT) {
      console.log(`  Already has >= 1000 tokens, skipping...`);
      continue;
    }

    const tokensNeeded = TARGET_AMOUNT - balance;
    console.log(`  Tokens needed: ${ethers.formatEther(tokensNeeded)}`);

    try {
      // Try to use mint function first (tokens with Ownable)
      console.log(`  Attempting to mint...`);
      const tx = await token.mint(TARGET_ADDRESS, tokensNeeded);
      console.log(`  Mint tx: ${tx.hash}`);
      await tx.wait();
      console.log(`  Minted successfully!`);
    } catch (mintError: any) {
      console.log(`  Mint failed, trying transfer...`);
      
      // Fallback: Check deployer balance and transfer
      const deployerBalance = await token.balanceOf(signer.address);
      console.log(`  Deployer balance: ${ethers.formatEther(deployerBalance)}`);
      
      if (deployerBalance >= tokensNeeded) {
        try {
          const nonce = await provider.getTransactionCount(signer.address, "latest");
          const tx = await token.transfer(TARGET_ADDRESS, tokensNeeded, { nonce });
          console.log(`  Transfer tx: ${tx.hash}`);
          await tx.wait();
          console.log(`  Transferred successfully!`);
        } catch (transferError: any) {
          console.error(` Transfer failed: ${transferError.message || transferError}`);
        }
      } else {
        console.error(` Neither mint nor transfer available. Deployer needs more tokens.`);
      }
    }
  }

  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

