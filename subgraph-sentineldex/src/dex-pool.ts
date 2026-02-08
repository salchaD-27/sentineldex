import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { LiquidityAdded as LiquidityAddedEvent } from "../generated/DEXPool/DEXPool";
import { LiquidityRemoved as LiquidityRemovedEvent } from "../generated/DEXPool/DEXPool";
import { LiquiditySwapped as LiquiditySwappedEvent } from "../generated/DEXPool/DEXPool";
import { Pool, Token, User, LiquidityPosition, Swap, LiquidityChange } from "../generated/schema";

// Constants
const FEE_BPS = 30;
const BPS = BigInt.fromI32(10000);

// =====================================================
// HANDLER 1: LiquidityAdded
// =====================================================
export function handleLiquidityAdded(event: LiquidityAddedEvent): void {
  log.info('=== DEBUG: LiquidityAdded ===', []);
  log.info('Pool: {}', [event.address.toHexString()]);
  
  let provider = event.params.provider;
  let amountToken0 = event.params.amountToken0;
  let amountToken1 = event.params.amountToken1;
  let liquidityMinted = event.params.liquidityMinted;

  // Get or create user
  let userId = provider.toHex();
  let user = User.load(userId);
  if (!user) {
    user = new User(userId);
    user.address = provider;
    user.save();
  }

  // Get pool
  let poolId = event.address.toHex();
  let pool = Pool.load(poolId);

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
  log.info('=== DEBUG: LiquidityRemoved ===', []);
  
  let provider = event.params.provider;
  let amountToken0 = event.params.amountToken0;
  let amountToken1 = event.params.amountToken1;
  let liquidityBurned = event.params.liquidityBurned;

  let userId = provider.toHex();
  let poolId = event.address.toHex();
  let pool = Pool.load(poolId);

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
      lp.token1Amount = lp.token1Amount.minus(amountToken1);
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
  log.info('=== DEBUG: LiquiditySwapped ===', []);
  
  let provider = event.params.provider;
  let tokenIn = event.params.tokenIn;
  let amountIn = event.params.amountIn;
  let tokenOut = event.params.tokenOut;
  let amountOut = event.params.amountOut;

  let userId = provider.toHex();
  let poolId = event.address.toHex();
  let pool = Pool.load(poolId);

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

    // Ensure Token entities exist (no eth_calls, just creates if missing)
    let tokenInId = tokenIn.toHex();
    let tokenOutId = tokenOut.toHex();
    
    if (!Token.load(tokenInId)) {
      let t = new Token(tokenInId);
      t.address = tokenIn;
      t.save();
    }
    
    if (!Token.load(tokenOutId)) {
      let t = new Token(tokenOutId);
      t.address = tokenOut;
      t.save();
    }

    // Create swap record
    let swapId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    let swap = new Swap(swapId);
    swap.user = userId;
    swap.pool = poolId;
    swap.tokenIn = tokenInId;
    swap.tokenOut = tokenOutId;
    swap.amountIn = amountIn;
    swap.amountOut = amountOut;
    swap.fee = fee;
    swap.timestamp = event.block.timestamp;
    swap.save();
  }
}

