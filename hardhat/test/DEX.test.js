import { expect } from "chai";
import hre from "hardhat";
import { describe, it, beforeEach } from "mocha";

describe("DEX System", function () {
  let owner, user;
  let Token, tokenA, tokenB;
  let Factory, factory;
  let pool, lpToken;

  const ONE = hre.ethers.parseEther("1");
  const TEN = hre.ethers.parseEther("10");

  beforeEach(async () => {
    [owner, user] = await hre.ethers.getSigners();

    Token = await hre.ethers.getContractFactory("MockERC20");
    tokenA = await Token.deploy("TokenA", "TKA");
    tokenB = await Token.deploy("TokenB", "TKB");
    await tokenA.mint(owner.address, hre.ethers.parseEther("1000"));
    await tokenB.mint(owner.address, hre.ethers.parseEther("1000"));

    Factory = await hre.ethers.getContractFactory("DEXFactory");
    factory = await Factory.deploy();
  });

  async function deployPool() {
    await factory.createPool(tokenA.target, tokenB.target);

    // Sort tokens the same way the factory does
    const [t0, t1] =
      tokenA.target.toLowerCase() < tokenB.target.toLowerCase()
        ? [tokenA.target, tokenB.target]
        : [tokenB.target, tokenA.target];

    const poolAddress = await factory.pools(t0, t1);
    pool = await hre.ethers.getContractAt("DEXPool", poolAddress);

    const lpAddress = await pool.lpTokenAddress();
    lpToken = await hre.ethers.getContractAt("LPToken", lpAddress);
  }

  // ------------------
  // Factory tests
  // ------------------
  it("creates a new pool", async () => {
    await factory.createPool(tokenA.target, tokenB.target);
    const [t0, t1] =
      tokenA.target.toLowerCase() < tokenB.target.toLowerCase()
        ? [tokenA.target, tokenB.target]
        : [tokenB.target, tokenA.target];
    const poolAddress = await factory.pools(t0, t1);
    expect(poolAddress).to.not.equal(hre.ethers.ZeroAddress);
  });

  it("prevents duplicate pools", async () => {
    await factory.createPool(tokenA.target, tokenB.target);
    await expect(factory.createPool(tokenA.target, tokenB.target)).to.be.reverted;
  });

  it("rejects non-ERC20 tokens", async () => {
    const fake = owner.address; // not a contract
    await expect(factory.createPool(fake, tokenB.target)).to.be.revertedWith("Token0 is not ERC20");
  });

  // ------------------
  // Pool tests
  // ------------------
  it("bootstraps liquidity", async () => {
    await deployPool();

    await tokenA.approve(pool.target, TEN);
    await tokenB.approve(pool.target, TEN);
    await pool.addLiquidity(TEN, TEN);

    const [r0, r1] = await pool.getReserves();
    expect(r0).to.equal(TEN);
    expect(r1).to.equal(TEN);

    const lpBalance = await lpToken.balanceOf(owner.address);
    expect(lpBalance).to.be.gt(0);
  });

  it("adds liquidity proportionally after bootstrap", async () => {
    await deployPool();
    await tokenA.approve(pool.target, TEN);
    await tokenB.approve(pool.target, TEN);
    await pool.addLiquidity(TEN, TEN);

    const addAmount = hre.ethers.parseEther("5");
    await tokenA.mint(user.address, addAmount);
    await tokenB.mint(user.address, addAmount);
    await tokenA.connect(user).approve(pool.target, addAmount);
    await tokenB.connect(user).approve(pool.target, addAmount);
    await pool.connect(user).addLiquidity(addAmount, addAmount);

    const [r0, r1] = await pool.getReserves();
    expect(r0).to.equal(TEN + addAmount);
    expect(r1).to.equal(TEN + addAmount);

    const lpBalance = await lpToken.balanceOf(user.address);
    expect(lpBalance).to.be.gt(0);
  });

  it("removes liquidity proportionally", async () => {
    await deployPool();
    await tokenA.approve(pool.target, TEN);
    await tokenB.approve(pool.target, TEN);
    await pool.addLiquidity(TEN, TEN);

    const lpBalance = await lpToken.balanceOf(owner.address);
    await lpToken.approve(pool.target, lpBalance);
    await pool.removeLiquidity(lpBalance);

    const [r0, r1] = await pool.getReserves();
    expect(r0).to.equal(0);
    expect(r1).to.equal(0);
  });

  it("swaps token0 -> token1 with fee", async () => {
    await deployPool();
    await tokenA.approve(pool.target, TEN);
    await tokenB.approve(pool.target, TEN);
    await pool.addLiquidity(TEN, TEN);

    await tokenA.mint(user.address, ONE);
    await tokenA.connect(user).approve(pool.target, ONE);

    const before = await tokenB.balanceOf(user.address);
    await pool.connect(user).swap(tokenA.target, ONE);
    const after = await tokenB.balanceOf(user.address);
    expect(after).to.be.gt(before);
  });

  it("swaps token1 -> token0 with fee", async () => {
    await deployPool();
    await tokenA.approve(pool.target, TEN);
    await tokenB.approve(pool.target, TEN);
    await pool.addLiquidity(TEN, TEN);

    await tokenB.mint(user.address, ONE);
    await tokenB.connect(user).approve(pool.target, ONE);

    const before = await tokenA.balanceOf(user.address);
    await pool.connect(user).swap(tokenB.target, ONE);
    const after = await tokenA.balanceOf(user.address);
    expect(after).to.be.gt(before);
  });
});