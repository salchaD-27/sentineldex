import { BigInt, Bytes, ethereum, Address } from "@graphprotocol/graph-ts";
import { PoolCreated as PoolCreatedEvent } from "../generated/DEXFactory/DEXFactory";
import { Pool, Token, User } from "../generated/schema";
import { DEXPool as DEXPoolTemplate } from "../generated/templates";

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

// Helper to fetch token data based on address
function fetchTokenData(address: Bytes): Token {
  let id = address.toHex();
  let token = Token.load(id);

  if (!token) {
    token = new Token(id);
    token.address = address;
    
    // Skip contract calls to avoid Hardhat gas limit
    // Token metadata can be added later via manual updates or a separate process
    token.symbol = "";
    token.name = "";
    token.decimals = BigInt.fromI32(18);
    token.totalSupply = BigInt.fromI32(0);
    
    token.save();
  }

  return token;
}

// PoolCreated handler
export function handlePoolCreated(event: PoolCreatedEvent): void {
  let poolId = event.params.pool.toHex();
  let pool = Pool.load(poolId);

  if (!pool) {
    pool = new Pool(poolId);
    pool.address = event.params.pool;

    // Set token references (fetch and store token data)
    let token0 = fetchTokenData(event.params.token0);
    let token1 = fetchTokenData(event.params.token1);
    pool.token0 = token0.id;
    pool.token1 = token1.id;

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

    // Create data source for the new pool to start indexing its events
    DEXPoolTemplate.create(event.params.pool);
  }
}

