import { ethers } from "ethers";
import dotenv from 'dotenv';
dotenv.config();

const RPC_URL = process.env.RPC_URL!;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY!;
const TARGET_ADDRESS = process.env.TARGET_ADDRESS!;
const TOKEN0_ADDR = process.env.TOKEN0_ADDR!;

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  const token = new ethers.Contract(TOKEN0_ADDR, ERC20_ABI, signer);
  
  console.log(`Transferring 500 TestToken7 to ${TARGET_ADDRESS}...`);
  
  const tx = await token.transfer(TARGET_ADDRESS, ethers.parseEther("500"));
  console.log(`Tx: ${tx.hash}`);
  await tx.wait();
  
  console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

