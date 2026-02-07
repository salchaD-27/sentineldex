import { ethers } from "ethers";

const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TARGET_ADDRESS = "0x8A337Bb0DaC96898dc3a41cf04B4B36026794604";
const TOKEN_AMOUNT = "500000000000000000000"; // 500 tokens

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const TOKENS = [
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // TestToken1
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // TestToken2
  "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // TestToken3
  "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", // TestToken4
  "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", // TestToken5
  "0x0165878A594ca255338adfa4d48449f69242Eb8F", // TestToken6
  "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853", // TestToken7
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log("Signer:", signer.address);
  
  const balanceBefore = await provider.getBalance(TARGET_ADDRESS);
  console.log("ETH balance before:", ethers.formatEther(balanceBefore));
  
  console.log("\n=== Funding ETH ===");
  const tx = await signer.sendTransaction({
    to: TARGET_ADDRESS,
    value: ethers.parseEther("1000")
  });
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  
  const balanceAfter = await provider.getBalance(TARGET_ADDRESS);
  console.log("ETH balance after:", ethers.formatEther(balanceAfter));
  
  console.log("\n=== Funding ERC20 Tokens ===");
  
  for (const tokenAddr of TOKENS) {
    try {
      const token = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
      
      const balance = await token.balanceOf(signer.address);
      console.log(`\nToken ${tokenAddr.substring(0,6)}... balance: ${ethers.formatEther(balance)}`);
      
      if (balance >= ethers.parseEther("500")) {
        const tx = await token.transfer(TARGET_ADDRESS, ethers.parseEther("500"));
        console.log(`Transferred 500 tokens (tx: ${tx.hash})`);
        await tx.wait();
      } else {
        console.log(`Insufficient balance, skipping...`);
      }
    } catch (err: any) {
      console.error(`Error funding token ${tokenAddr}:`, err.message);
    }
  }
  
  console.log("\n=== Done ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

