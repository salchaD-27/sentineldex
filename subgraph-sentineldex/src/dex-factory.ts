import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { PoolCreated as PoolCreatedEvent } from "../generated/DEXFactory/DEXFactory";
import { Pool, Token, User } from "../generated/schema";

// Constants
const FEE_BPS = 30;

// Helper to get or create user
function getUser(address: Bytes): User {
  let id = address.toHex();
  let user = User.load(id);
  if (!user) {
    user = new User(id);
    user.address = address;
    user.save();
  }
  return user;
}

// Helper to get or create token and return its ID
function getTokenId(address: Bytes): string {
  let id = address.toHex();
  let token = Token.load(id);
  if (!token) {
    token = new Token(id);
    token.address = address;
    // These would be populated from contract calls in a full implementation
    token.symbol = "";
    token.name = "";
    token.decimals = BigInt.fromI32(0);
    token.totalSupply = BigInt.fromI32(0);
    token.save();
  }
  return id;
}

// PoolCreated handler
export function handlePoolCreated(event: PoolCreatedEvent): void {
  let poolId = event.params.pool.toHex();
  let pool = Pool.load(poolId);

  if (!pool) {
    pool = new Pool(poolId);
    pool.address = event.params.pool;

    // Set token references (store ID strings, not Token objects)
    let token0Id = getTokenId(event.params.token0);
    let token1Id = getTokenId(event.params.token1);
    pool.token0 = token0Id;
    pool.token1 = token1Id;

    // Initialize reserves and supply
    pool.reserve0 = BigInt.fromI32(0);
    pool.reserve1 = BigInt.fromI32(0);
    pool.totalSupply = BigInt.fromI32(0);

    // Set fee (30 bps = 0.3%)
    pool.fee = BigInt.fromI32(FEE_BPS);

    // Set timestamps
    pool.createdAt = event.block.timestamp;
    pool.createdAtBlock = event.block.number;

    pool.save();
  }
}

