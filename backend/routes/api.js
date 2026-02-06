// const express = require('express');
// const { Pool } = require('pg');
// const { randomBytes } = require('crypto');
// const { addMinutes } = require('date-fns');
// const { ethers } = require('ethers');
// const multer = require("multer");
// const fs = require('fs');
// const path = require('path');
// const { fileURLToPath } = require('url');
// require('dotenv').config();
import express from 'express';
import { Pool } from 'pg';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const erc20Abi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
const dexPoolAbi = [
  "function lpTokenAddress() view returns (address)",
  "function getReserves() view returns (uint256,uint256)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('cwd:', process.cwd());
console.log('__dirname:', __dirname);

// const deployedAddressesPath = path.join(__dirname, '../../hardhat/ignition/deployments/chain-31337/deployed_addresses.json');
const deployedAddressesPath = path.resolve(process.cwd(), '../hardhat/ignition/deployments/chain-31337/deployed_addresses.json');
const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));

// const abiPath = path.join(__dirname, '../../../hardhat/artifacts/contracts/DEXFactory.sol/DEXFactory.json');
const abiPath = path.resolve('../hardhat/artifacts/contracts/DEXFactory.sol/DEXFactory.json');
const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);
const contract = new ethers.Contract(deployedAddresses['DEXFactoryModule#DEXFactory'], abi.abi, wallet);

async function getTokenInfo(addr) {
  try {
    const token = new ethers.Contract(addr, erc20Abi, provider);
    const [name, symbol, totalSupply] = await Promise.all([
      token.name(),
      token.symbol(),
      token.totalSupply()
    ]);
    return { name, symbol, totalSupply };
  } catch {return { name: addr, symbol: addr, totalSupply: 0n };}
}

router.post('/pools', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const filter = contract.filters.PoolCreated();
    const events = await contract.queryFilter(filter, 0, "latest");

    const poolsRaw = await Promise.all(events.map(async (event) => {
        // Check if event and args exist
        if (!event || !event.args) {
            console.warn('Skipping event with missing args:', event);
            return null;
        }
        
        const poolAddress = event.args.pool;
        const token0Address = event.args.token0;
        const token1Address = event.args.token1;
        
        // Skip if any required address is missing or invalid
        if (!poolAddress || !token0Address || !token1Address) {
            console.warn('Skipping event with missing addresses:', { poolAddress, token0Address, token1Address });
            return null;
        }
        
        const poolContract = new ethers.Contract(poolAddress, dexPoolAbi, provider);
        let lpTokenAddr;
        let reserve0 = "0";
        let reserve1 = "0";
        try {
            [lpTokenAddr, [reserve0, reserve1]] = await Promise.all([
                poolContract.lpTokenAddress(),
                poolContract.getReserves().then(r => [r[0].toString(), r[1].toString()])
            ]);
        } catch (err) {
            console.warn(`Failed to get pool data for ${poolAddress}:`, err);
            return null;
        }

        const lpToken = new ethers.Contract(lpTokenAddr, erc20Abi, provider);

        const [balance, totalSupply, symbol] = await Promise.all([
            lpToken.balanceOf(walletAddress),
            lpToken.totalSupply(),
            lpToken.symbol(),
        ]);
      
        const token0Info = await getTokenInfo(token0Address);
        const token1Info = await getTokenInfo(token1Address);
        return {
            pool: poolAddress,
            token0: token0Info.symbol,
            token1: token1Info.symbol,
            lpTokenAddress: lpTokenAddr,
            lpTokenSymbol: symbol,
            balance: balance.toString(),
            lpTotalSupply: totalSupply.toString(),
            reserve0: reserve0.toString(),
            reserve1: reserve1.toString(),
        };
    }));

    const pools = poolsRaw.filter(Boolean);

    res.json({
      success: true,
      pools
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error: ' + (err instanceof Error ? err.message : err) });
  }
});

router.post('/tokens', async (req, res) => {
    try{
        const { walletAddress } = req.body;
        const tokenDeployedAddresses = Object.entries(deployedAddresses).filter(([key, addr]) => key !== 'DEXFactoryModule#DEXFactory').map(([key, addr]) => addr);
        const tokens = await Promise.all(
            tokenDeployedAddresses.map(async (addr) => {
                try {
                    const token = new ethers.Contract(addr, erc20Abi, provider);
                    const [name, symbol, balance, totalSupply] = await Promise.all([
                        token.name(),
                        token.symbol(),
                        token.balanceOf(walletAddress),
                        token.totalSupply(),
                    ]);
                    return {
                        tokenAddress: addr,
                        tokenName: name,
                        tokenSymbol: symbol,
                        balance: balance.toString(),
                        tokenTotalSupply: totalSupply.toString(),
                    };
                } catch {return null;}
            })
        );

        res.json({ 
            success: true, 
            tokens: tokens.filter(Boolean),
        });
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
})

router.post('/create-pool', async (req, res) => {
    try{
        const { token1, token2 } = req.body;
        if (!ethers.isAddress(token1) || !ethers.isAddress(token2)) return res.status(400).json({ error: 'Invalid token address' });

        const [tokenA, tokenB] = token1.toLowerCase() < token2.toLowerCase() ? [token1, token2] : [token2, token1];
        const existingPool = await contract.pools(tokenA, tokenB);
        if (existingPool !== ethers.ZeroAddress) return res.status(400).json({ error: 'Pool already exists', pool: existingPool });

        const tx = await contract.createPool(tokenA, tokenB);
        const receipt = await tx.wait();

        let poolCreatedEvent;
        for (const log of receipt.logs) {
            try {
                const parsed = contract.interface.parseLog(log);
                if (parsed.name === "PoolCreated") {
                    poolCreatedEvent = parsed;
                    break;
                }
            } catch {}
        }
        if (!poolCreatedEvent)throw new Error("PoolCreated event not found");

        res.json({
            success: true,
            pool: poolCreatedEvent.args.pool,
            token0: poolCreatedEvent.args.token0,
            token1: poolCreatedEvent.args.token1,
            txHash: tx.hash
        });
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
})

export default router;