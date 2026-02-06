import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TestToken7Module", (m) => {
  const testToken7 = m.contract("TestToken7");
  return { testToken7 };
});