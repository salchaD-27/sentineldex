import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TestToken4Module", (m) => {
  const testToken4 = m.contract("TestToken4");
  return { testToken4 };
});