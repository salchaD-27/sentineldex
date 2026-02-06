import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TestToken1Module", (m) => {
  const testToken1 = m.contract("TestToken1");
  return { testToken1 };
});