#!/bin/bash
set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Clearing old deployment data ==="
rm -rf ../ignition/deployments/chain-31337

echo "=== Deploying DEXFactory ==="
npx hardhat ignition deploy ../ignition/modules/DEXFactory.ts --network localhost

echo "=== Deploying TestTokens ==="
npx hardhat ignition deploy ../ignition/modules/TestToken1.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken2.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken3.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken4.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken5.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken6.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken7.ts --network localhost

echo "=== Funding wallet with 500 tokens each ==="
npx hardhat run fund-wallet.ts --network localhost

echo "=== Minting tokens to target address ==="
npx hardhat run mint-tokens.ts --network localhost

echo "=== Deployment complete! ==="

