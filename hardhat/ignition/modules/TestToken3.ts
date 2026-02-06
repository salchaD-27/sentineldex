import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TestToken3Module", (m) => {
  const testToken3 = m.contract("TestToken3");
  return { testToken3 };
});