import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DEXFactoryModule", (m) => {
  const DEXFactory = m.contract("DEXFactory");
  return { DEXFactory };
});