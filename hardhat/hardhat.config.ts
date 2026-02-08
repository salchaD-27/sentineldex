import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      blockGasLimit: 50_000_000,
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545/",
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 10,
    },
  },
});