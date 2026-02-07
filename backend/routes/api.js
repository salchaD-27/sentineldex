import express from 'express';
import { Pool } from 'pg';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { exec } from "child_process";
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const erc20Abi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

export const dexPoolAbi = [
  "function lpTokenAddress() view returns (address)",
  "function getReserves() view returns (uint256,uint256)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function addLiquidity(uint256,uint256)",
  "function removeLiquidity(uint256)",
  "function swap(address,uint256)"
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deployedAddressesPath = path.resolve(process.cwd() , '../hardhat/ignition/deployments/chain-31337/deployed_addresses.json');
const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));

const abiPath = path.resolve(process.cwd() , '../hardhat/ignition/deployments/chain-31337/artifacts/DEXFactoryModule#DEXFactory.json');
const deployedArtifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

export const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
export const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
export const DEX_FACTORY_ADDRESS = deployedAddresses['DEXFactoryModule#DEXFactory'];

// Mutex for serializing all transactions to avoid nonce conflicts
let nonceLock = Promise.resolve();

export async function withLock(fn) {
  const release = await nonceLock;
  let releaseNext;
  nonceLock = new Promise(resolve => { releaseNext = resolve; });
  try {
    return await fn();
  } finally {
    releaseNext();
  }
}

// Get wallet with fresh nonce inside the lock
export function getWallet() {
  return new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
}

async function getDexFactory() {
  const wallet = getWallet();
  return new ethers.Contract(DEX_FACTORY_ADDRESS, deployedArtifact.abi, wallet);
}

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
    let { walletAddress } = req.body;
    const dexFactory = await getDexFactory();
    const filter = dexFactory.filters.PoolCreated();
    const events = await dexFactory.queryFilter(filter, 0, "latest");

    const poolsRaw = await Promise.all(events.map(async (event) => {
        if (!event || !event.args) {
            console.warn('Skipping event with missing args:', event);
            return null;
        }
        
        const poolAddress = event.args.pool;
        const token0Address = event.args.token0;
        const token1Address = event.args.token1;
        
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
        let { walletAddress } = req.body;
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
        await withLock(async () => {
            const { token1, token2 } = req.body;
            if (!ethers.isAddress(token1) || !ethers.isAddress(token2)) return res.status(400).json({ error: 'Invalid token address' });

            const [tokenA, tokenB] = token1.toLowerCase() < token2.toLowerCase() ? [token1, token2] : [token2, token1];
            const dexFactory = await getDexFactory();
            
            // Get fresh nonce for this transaction
            const wallet = getWallet();
            const walletWithNonce = new ethers.Contract(DEX_FACTORY_ADDRESS, deployedArtifact.abi, wallet);
            const nonce = await provider.getTransactionCount(wallet.address, "latest");
            
            const existingPool = await walletWithNonce.pools(tokenA, tokenB);
            if (existingPool !== ethers.ZeroAddress) return res.status(400).json({ error: 'Pool already exists', pool: existingPool });

            const tx = await walletWithNonce.createPool(tokenA, tokenB, { nonce });
            const receipt = await tx.wait();

            let poolCreatedEvent;
            for (const log of receipt.logs) {
                try {
                    const parsed = walletWithNonce.interface.parseLog(log);
                    if (parsed.name === "PoolCreated") {
                        poolCreatedEvent = parsed;
                        break;
                    }
                } catch {}
            }
            if (!poolCreatedEvent)throw new Error("PoolCreated event not found");

            return res.json({
                success: true,
                pool: poolCreatedEvent.args.pool,
                token0: poolCreatedEvent.args.token0,
                token1: poolCreatedEvent.args.token1,
                txHash: tx.hash
            });
        });
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
})

router.post('/wallet-balance', async (req, res) => {
    try{
        const { walletAddress } = req.body;
        if (!ethers.isAddress(walletAddress)) return res.status(400).json({ error: 'Invalid wallet address' });
        const balanceWei = await provider.getBalance(walletAddress);

        res.json({
            success: true,
            balance: balanceWei.toString(),
        });
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
})

router.get("/fund", async (req, res) => {
  try {
    exec(`cd ../hardhat && npx hardhat run ./scripts/fund-wallet.ts --network localhost`, (error, stdout, stderr) => {
      if (error) {
        console.error("Execution error:", error);
        return res.status(500).json({
          success: false,
          error: stderr || error.message,
        });
      }

      res.json({
        success: true,
        output: stdout,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

