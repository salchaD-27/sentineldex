#!/bin/bash
set -e

npx hardhat ignition deploy ../ignition/modules/DEXFactory.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken1.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken2.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken3.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken4.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken5.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken6.ts --network localhost
npx hardhat ignition deploy ../ignition/modules/TestToken7.ts --network localhost