import express from 'express';
import { Pool } from 'pg';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { erc20Abi, dexPoolAbi, provider, getWallet, withLock } from './api.js'

dotenv.config();
const router = express.Router()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.post('/add', async (req, res) => {
  try {
    await withLock(async () => {
      const { poolAddress, amount0, amount1 } = req.body;
      
      const wallet = getWallet();
      const poolContract = new ethers.Contract(poolAddress, dexPoolAbi, wallet);
      
      // Get fresh nonce for this transaction sequence
      let nonce = await provider.getTransactionCount(wallet.address, "latest");

      const token0Addr = await poolContract.token0();
      const token1Addr = await poolContract.token1();
      const token0 = new ethers.Contract(token0Addr, erc20Abi, wallet);
      const token1 = new ethers.Contract(token1Addr, erc20Abi, wallet);
      const decimals0 = await token0.decimals();
      const decimals1 = await token1.decimals();

      const amount0Wei = ethers.parseUnits(amount0.toString(), decimals0);
      const amount1Wei = ethers.parseUnits(amount1.toString(), decimals1);

      const allowance0 = await token0.allowance(wallet.address, poolAddress);
      if (allowance0 < amount0Wei) {
        console.log('Approving token0...');
        const tx0 = await token0.approve(poolAddress, amount0Wei, { nonce: nonce++ });
        await tx0.wait();
        console.log('Token0 approved');
      }
      const allowance1 = await token1.allowance(wallet.address, poolAddress);
      if (allowance1 < amount1Wei) {
        console.log('Approving token1...');
        const tx1 = await token1.approve(poolAddress, amount1Wei, { nonce: nonce++ });
        await tx1.wait();
        console.log('Token1 approved');
      }
      
      console.log('Adding liquidity...');
      const tx2 = await poolContract.addLiquidity(amount0Wei, amount1Wei, { nonce: nonce++ });
      await tx2.wait();
      console.log('Liquidity added');
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/remove', async (req, res) => {
  try {
    await withLock(async () => {
      const { poolAddress, liquidity, amount0, amount1 } = req.body;
      
      const wallet = getWallet();
      const poolContract = new ethers.Contract(poolAddress, dexPoolAbi, wallet);
      
      // Get fresh nonce
      const nonce = await provider.getTransactionCount(wallet.address, "latest");

      const lpTokenAddr = await poolContract.lpTokenAddress();
      const lpToken = new ethers.Contract(lpTokenAddr, erc20Abi, wallet);
      const lpBalance = await lpToken.balanceOf(wallet.address);
      
      // Get reserves
      const [reserve0, reserve1] = await poolContract.getReserves();
      const totalSupply = await lpToken.totalSupply();

      let liquidityToRemove;
      if (liquidity) {
        // If liquidity is provided directly (in Wei)
        liquidityToRemove = BigInt(liquidity);
      } else if (amount0 && amount1) {
        // Calculate proportional liquidity from token amounts
        const amount0Wei = ethers.parseEther(amount0.toString());
        const amount1Wei = ethers.parseEther(amount1.toString());
        // Calculate liquidity proportionally: min of (amount0/reserve0, amount1/reserve1) * totalSupply
        const liquidity0 = (amount0Wei * totalSupply) / reserve0;
        const liquidity1 = (amount1Wei * totalSupply) / reserve1;
        liquidityToRemove = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
      } else {
        throw new Error('Missing liquidity or amount0/amount1 parameters');
      }

      if (lpBalance < liquidityToRemove) {
        throw new Error('Insufficient LP balance');
      }

      const tx = await poolContract.removeLiquidity(liquidityToRemove, { nonce });
      await tx.wait();
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/swap', async (req, res) => {
  try {
    await withLock(async () => {
      const { poolAddress, tokenIn, amountIn, amount } = req.body;
      
      const wallet = getWallet();
      const poolContract = new ethers.Contract(poolAddress, dexPoolAbi, wallet);
      
      // Get fresh nonce
      let nonce = await provider.getTransactionCount(wallet.address, "latest");

      const token0Addr = await poolContract.token0();
      const token1Addr = await poolContract.token1();
      const tokenInAddr = (tokenIn || amount).toLowerCase();

      if (tokenInAddr !== token0Addr.toLowerCase() && tokenInAddr !== token1Addr.toLowerCase()) {
        throw new Error('Invalid token address');
      }

      const tokenInContract = new ethers.Contract(tokenInAddr, erc20Abi, wallet);
      const decimals = await tokenInContract.decimals();
      const amountInWei = ethers.parseUnits((amountIn || amount).toString(), decimals);

      const allowance = await tokenInContract.allowance(wallet.address, poolAddress);
      if (allowance < amountInWei) {
        console.log('Approving token for swap...');
        const tx0 = await tokenInContract.approve(poolAddress, amountInWei, { nonce: nonce++ });
        await tx0.wait();
        console.log('Token approved for swap');
      }

      const tx1 = await poolContract.swap(tokenInAddr, amountInWei, { nonce: nonce++ });
      await tx1.wait();
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

