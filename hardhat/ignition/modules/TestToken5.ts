import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TestToken5Module", (m) => {
  const testToken5 = m.contract("TestToken5");
  return { testToken5 };
});