import express from 'express';
import { Pool } from 'pg';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { exec } from "child_process";
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { contract, erc20Abi, dexPoolAbi, wallet } from './api.js'

dotenv.config();
const router = express.Router()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.post('/add', async (req, res) => {
  try {
    const { poolAddress, amount0, amount1 } = req.body;
    const poolContract = new ethers.Contract(poolAddress, dexPoolAbi, wallet);

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
      const nonce0 = await wallet.getNonce();
      await (await token0.approve(poolAddress, amount0Wei, { nonce: nonce0 })).wait();
    }
    const allowance1 = await token1.allowance(wallet.address, poolAddress);
    if (allowance1 < amount1Wei) {
      const nonce1 = await wallet.getNonce();
      await (await token1.approve(poolAddress, amount1Wei, { nonce: nonce1 })).wait();
    }
    
    const nonce2 = await wallet.getNonce();
    await (await poolContract.addLiquidity(amount0Wei, amount1Wei, { nonce: nonce2 })).wait();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;