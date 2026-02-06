import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect();
  const walletClient = await viem.getWalletClients();
  const signer = walletClient[0];
  
  console.log("Signer:", signer.account.address);
  
  const targetAddress = "0x8A337Bb0DaC96898dc3a41cf04B4B36026794604";
  
  const publicClient = await viem.getPublicClient();
  const balanceBefore = await publicClient.getBalance({ address: targetAddress });
  console.log("Target balance before:", balanceBefore.toString());
  
  console.log("Sending 1000 ETH to target...");
  const hash = await signer.sendTransaction({
    to: targetAddress,
    value: 1000n * 10n ** 18n
  });
  console.log("Transaction hash:", hash);
  
  const balanceAfter = await publicClient.getBalance({ address: targetAddress });
  console.log("Target balance after:", balanceAfter.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });