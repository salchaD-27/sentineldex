import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TestToken2Module", (m) => {
  const testToken2 = m.contract("TestToken2");
  return { testToken2 };
});