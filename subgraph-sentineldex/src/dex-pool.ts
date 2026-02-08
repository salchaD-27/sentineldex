import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { LiquidityAdded as LiquidityAddedEvent } from "../generated/DEXPool/DEXPool";
import { LiquidityRemoved as LiquidityRemovedEvent } from "../generated/DEXPool/DEXPool";
import { LiquiditySwapped as LiquiditySwappedEvent } from "../generated/DEXPool/DEXPool";
import { Pool, TokenCore, User, LiquidityPosition, Swap, LiquidityChange } from "../generated/schema";

// Constants
const FEE_BPS = 30;
const BPS = BigInt.fromI32(10000);

// Helper to get or create user and return its ID
function getUserId(address: Bytes): string {
  let id = address.toHex();
  let user = User.load(id);
  if (!user) {
    user = new User(id);
    user.address = address;
    user.save();
  }
  return id;
}

// Helper to get or create TokenCore (minimal entity, no eth_calls)
function getOrCreateTokenCore(address: Bytes): TokenCore {
  let id = address.toHex();
  let token = TokenCore.load(id);
  
  if (!token) {
    token = new TokenCore(id);
    token.address = address;
    token.save();
    log.info('Created TokenCore for: {}', [id]);
  }
  
  return token;
}

// =====================================================
// HANDLER 1: LiquidityAdded
// =====================================================
export function handleLiquidityAdded(event: LiquidityAddedEvent): void {
  log.info('=== DEBUG: LiquidityAdded event ===', []);
  log.info('Pool: {}', [event.address.toHexString()]);
  log.info('Provider: {}', [event.params.provider.toHexString()]);
  log.info('AmountToken0: {}', [event.params.amountToken0.toString()]);
  log.info('AmountToken1: {}', [event.params.amountToken1.toString()]);
  log.info('LiquidityMinted: {}', [event.params.liquidityMinted.toString()]);
  
  let provider = event.params.provider;
  let amountToken0 = event.params.amountToken0;
  let amountToken1 = event.params.amountToken1;
  let liquidityMinted = event.params.liquidityMinted;

  // Get user ID
  let userId = getUserId(provider);
  log.info('User ID: {}', [userId]);

  // Get pool
  let poolAddress = event.address;
  let poolId = poolAddress.toHex();
  log.info('Pool ID: {}', [poolId]);
  
  let pool = Pool.load(poolId);
  log.info('Pool found: {}', [pool ? 'true' : 'false']);

  if (pool) {
    // Update pool reserves
    pool.reserve0 = pool.reserve0.plus(amountToken0);
    pool.reserve1 = pool.reserve1.plus(amountToken1);
    pool.totalSupply = pool.totalSupply.plus(liquidityMinted);
    pool.save();

    // Update or create liquidity position
    let lpId = userId + "-" + poolId;
    let lp = LiquidityPosition.load(lpId);

    if (!lp) {
      lp = new LiquidityPosition(lpId);
      lp.user = userId;
      lp.pool = poolId;
      lp.liquidityTokenBalance = BigInt.fromI32(0);
      lp.token0Amount = BigInt.fromI32(0);
      lp.token1Amount = BigInt.fromI32(0);
      lp.createdAt = event.block.timestamp;
    }

    lp.liquidityTokenBalance = lp.liquidityTokenBalance.plus(liquidityMinted);
    lp.token0Amount = lp.token0Amount.plus(amountToken0);
    lp.token1Amount = lp.token1Amount.plus(amountToken1);
    lp.updatedAt = event.block.timestamp;
    lp.save();

    // Create liquidity change record
    let lcId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    let lc = new LiquidityChange(lcId);
    lc.user = userId;
    lc.pool = poolId;
    lc.type = "add";
    lc.token0Amount = amountToken0;
    lc.token1Amount = amountToken1;
    lc.liquidityAmount = liquidityMinted;
    lc.timestamp = event.block.timestamp;
    lc.save();
  }
}

// =====================================================
// HANDLER 2: LiquidityRemoved
// =====================================================
export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  log.info('=== DEBUG: LiquidityRemoved event ===', []);
  log.info('Pool: {}', [event.address.toHexString()]);
  log.info('Provider: {}', [event.params.provider.toHexString()]);
  log.info('AmountToken0: {}', [event.params.amountToken0.toString()]);
  log.info('AmountToken1: {}', [event.params.amountToken1.toString()]);
  log.info('LiquidityBurned: {}', [event.params.liquidityBurned.toString()]);
  
  let provider = event.params.provider;
  let amountToken0 = event.params.amountToken0;
  let amountToken1 = event.params.amountToken1;
  let liquidityBurned = event.params.liquidityBurned;

  // Get user ID
  let userId = getUserId(provider);

  // Get pool
  let poolAddress = event.address;
  let poolId = poolAddress.toHex();
  let pool = Pool.load(poolId);
  log.info('Pool found: {}', [pool ? 'true' : 'false']);

  if (pool) {
    // Update pool reserves
    pool.reserve0 = pool.reserve0.minus(amountToken0);
    pool.reserve1 = pool.reserve1.minus(amountToken1);
    pool.totalSupply = pool.totalSupply.minus(liquidityBurned);
    pool.save();

    // Update liquidity position
    let lpId = userId + "-" + poolId;
    let lp = LiquidityPosition.load(lpId);

    if (lp) {
      lp.liquidityTokenBalance = lp.liquidityTokenBalance.minus(liquidityBurned);
      lp.token0Amount = lp.token0Amount.minus(amountToken0);
      lp.token0Amount = lp.token0Amount.minus(amountToken1);
      lp.updatedAt = event.block.timestamp;
      lp.save();
    }

    // Create liquidity change record
    let lcId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    let lc = new LiquidityChange(lcId);
    lc.user = userId;
    lc.pool = poolId;
    lc.type = "remove";
    lc.token0Amount = amountToken0;
    lc.token1Amount = amountToken1;
    lc.liquidityAmount = liquidityBurned;
    lc.timestamp = event.block.timestamp;
    lc.save();
  }
}

// =====================================================
// HANDLER 3: LiquiditySwapped
// =====================================================
export function handleLiquiditySwapped(event: LiquiditySwappedEvent): void {
  log.info('=== DEBUG: LiquiditySwapped event ===', []);
  log.info('Pool: {}', [event.address.toHexString()]);
  log.info('Provider: {}', [event.params.provider.toHexString()]);
  log.info('TokenIn: {}', [event.params.tokenIn.toHexString()]);
  log.info('AmountIn: {}', [event.params.amountIn.toString()]);
  log.info('TokenOut: {}', [event.params.tokenOut.toHexString()]);
  log.info('AmountOut: {}', [event.params.amountOut.toString()]);
  
  let provider = event.params.provider;
  let tokenIn = event.params.tokenIn;
  let amountIn = event.params.amountIn;
  let tokenOut = event.params.tokenOut;
  let amountOut = event.params.amountOut;

  // Get user ID
  let userId = getUserId(provider);

  // Get pool
  let poolAddress = event.address;
  let poolId = poolAddress.toHex();
  let pool = Pool.load(poolId);
  log.info('Pool found: {}', [pool ? 'true' : 'false']);

  if (pool) {
    // Calculate fee (0.3%)
    let amountInWithFee = amountIn.times(BPS.minus(BigInt.fromI32(FEE_BPS))).div(BPS);
    let fee = amountIn.minus(amountInWithFee);

    // Update pool reserves
    if (tokenIn.toHex() == pool.token0) {
      pool.reserve0 = pool.reserve0.plus(amountIn);
      pool.reserve1 = pool.reserve1.minus(amountOut);
    } else {
      pool.reserve1 = pool.reserve1.plus(amountIn);
      pool.reserve0 = pool.reserve0.minus(amountOut);
    }
    pool.save();

    // Get or create TokenCore entities
    let tokenInCore = getOrCreateTokenCore(tokenIn);
    let tokenOutCore = getOrCreateTokenCore(tokenOut);

    // Create swap record
    let swapId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    let swap = new Swap(swapId);
    swap.user = userId;
    swap.pool = poolId;
    swap.tokenIn = tokenInCore.id;
    swap.tokenOut = tokenOutCore.id;
    swap.amountIn = amountIn;
    swap.amountOut = amountOut;
    swap.fee = fee;
    swap.timestamp = event.block.timestamp;
    swap.save();
  }
}

