import { BigInt, Bytes, log, Address } from "@graphprotocol/graph-ts";
import { PoolCreated as PoolCreatedEvent } from "../generated/DEXFactory/DEXFactory";
import { TestToken1 as TestToken1Contract } from "../generated/DEXFactory/TestToken1";
import { Token, Pool, User } from "../generated/schema";
import { DEXPool as DEXPoolTemplate } from "../generated/templates";

// Constants
const FEE_BPS = 30;

// =====================================================
// Helper Functions
// =====================================================

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

// Helper to get or create Token (minimal, only address)
function getOrCreateToken(address: Bytes): Token {
  let id = address.toHex();
  let token = Token.load(id);
  
  if (!token) {
    token = new Token(id);
    token.address = address;
    token.save();
    log.info('Created Token for: {}', [id]);
  }
  
  return token;
}

// =====================================================
// MAIN EVENT HANDLER: PoolCreated
// Creates pools and tokens WITHOUT any eth_calls
// Metadata is fetched later in separate handlers if needed
// =====================================================
export function handlePoolCreated(event: PoolCreatedEvent): void {
  log.info('=== DEBUG: PoolCreated event ===', []);
  log.info('Pool: {}', [event.params.pool.toHexString()]);
  log.info('Token0: {}', [event.params.token0.toHexString()]);
  log.info('Token1: {}', [event.params.token1.toHexString()]);
  
  let poolId = event.params.pool.toHex();
  
  if (!Pool.load(poolId)) {
    // Create Tokens first (no eth_calls - just address)
    let token0 = getOrCreateToken(event.params.token0);
    let token1 = getOrCreateToken(event.params.token1);
    
    log.info('Token0 created: {}', [token0.id]);
    log.info('Token1 created: {}', [token1.id]);
    
    // Create Pool
    let pool = new Pool(poolId);
    pool.address = event.params.pool;
    pool.token0 = token0.id;
    pool.token1 = token1.id;
    pool.reserve0 = BigInt.fromI32(0);
    pool.reserve1 = BigInt.fromI32(0);
    pool.totalSupply = BigInt.fromI32(0);
    pool.fee = BigInt.fromI32(FEE_BPS);
    pool.createdAt = event.block.timestamp;
    pool.createdAtBlock = event.block.number;
    pool.save();
    
    log.info('Pool created: {}', [poolId]);
    
    // Create data source for the new pool to start indexing its events
    DEXPoolTemplate.create(event.params.pool);
    log.info('DEXPoolTemplate created for pool', []);
  }
}

// =====================================================
// Optional: Handlers to fetch metadata individually
// Uncomment and call from event handlers if needed
// =====================================================

export function fetchTokenSymbol(address: Bytes): string | null {
  let contract = TestToken1Contract.bind(Address.fromBytes(address));
  let result = contract.try_symbol();
  if (!result.reverted) {
    return result.value;
  }
  log.warning('Symbol call reverted for: {}', [address.toHex()]);
  return null;
}

export function fetchTokenName(address: Bytes): string | null {
  let contract = TestToken1Contract.bind(Address.fromBytes(address));
  let result = contract.try_name();
  if (!result.reverted) {
    return result.value;
  }
  log.warning('Name call reverted for: {}', [address.toHex()]);
  return null;
}

export function fetchTokenDecimals(address: Bytes): BigInt | null {
  let contract = TestToken1Contract.bind(Address.fromBytes(address));
  let result = contract.try_decimals();
  if (!result.reverted) {
    return BigInt.fromI32(result.value);
  }
  log.warning('Decimals call reverted for: {}', [address.toHex()]);
  return null;
}

export function fetchTokenTotalSupply(address: Bytes): BigInt | null {
  let contract = TestToken1Contract.bind(Address.fromBytes(address));
  let result = contract.try_totalSupply();
  if (!result.reverted) {
    return result.value;
  }
  log.warning('TotalSupply call reverted for: {}', [address.toHex()]);
  return null;
}

// Helper to update token metadata (call this from event handlers sparingly)
export function updateTokenMetadata(tokenAddress: Bytes): void {
  let id = tokenAddress.toHex();
  let token = Token.load(id);
  if (!token) {
    token = getOrCreateToken(tokenAddress);
  }
  
  // Fetch and update each field separately
  // Each fetch is independent and won't cause gas limit if one fails
  let symbol = fetchTokenSymbol(tokenAddress);
  if (symbol) token.symbol = symbol;
  
  let name = fetchTokenName(tokenAddress);
  if (name) token.name = name;
  
  let decimals = fetchTokenDecimals(tokenAddress);
  if (decimals) token.decimals = decimals;
  
  let totalSupply = fetchTokenTotalSupply(tokenAddress);
  if (totalSupply) token.totalSupply = totalSupply;
  
  token.save();
  log.info('Updated metadata for token: {}', [id]);
}

