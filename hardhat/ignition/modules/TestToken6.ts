import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TestToken6Module", (m) => {
  const testToken6 = m.contract("TestToken6");
  return { testToken6 };
});