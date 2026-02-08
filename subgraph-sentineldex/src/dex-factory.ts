import { BigInt, Bytes, ethereum, log, Address } from "@graphprotocol/graph-ts";
import { PoolCreated as PoolCreatedEvent } from "../generated/DEXFactory/DEXFactory";
import { TestToken1 as TestToken1Contract } from "../generated/DEXFactory/TestToken1";
import { 
  TokenCore, 
  TokenSymbol, 
  TokenName, 
  TokenDecimals, 
  TokenTotalSupply, 
  Pool, 
  User 
} from "../generated/schema";
import { DEXPool as DEXPoolTemplate, Token as TokenTemplate } from "../generated/templates";

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

// Helper to get or create TokenCore (minimal entity with no eth_calls)
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
// EVENT HANDLER: PoolCreated
// =====================================================
export function handlePoolCreated(event: PoolCreatedEvent): void {
  log.info('=== DEBUG: PoolCreated event ===', []);
  log.info('Pool: {}', [event.params.pool.toHexString()]);
  log.info('Token0: {}', [event.params.token0.toHexString()]);
  log.info('Token1: {}', [event.params.token1.toHexString()]);
  
  let poolId = event.params.pool.toHex();
  
  if (!Pool.load(poolId)) {
    // Create TokenCores first (no eth_calls)
    let token0 = getOrCreateTokenCore(event.params.token0);
    let token1 = getOrCreateTokenCore(event.params.token1);
    
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
    
    // Create Token templates for token0 and token1
    // This will trigger call handlers for symbol(), name(), decimals(), totalSupply()
    TokenTemplate.create(event.params.token0);
    TokenTemplate.create(event.params.token1);
    log.info('TokenTemplate created for token0 and token1', []);
  }
}

// =====================================================
// CALL HANDLERS: Token metadata (one eth_call per handler)
// =====================================================

export function handleSymbolCall(event: ethereum.Call): void {
  let tokenAddress = event.transaction.to;
  if (!tokenAddress) return;
  
  let tokenId = tokenAddress.toHex();
  let symbolId = tokenId + "-symbol";
  
  log.info('=== Symbol Call for: {} ===', [tokenId]);
  
  // Get or create TokenCore
  let tokenCore = getOrCreateTokenCore(tokenAddress);
  
  // Check if already exists
  if (TokenSymbol.load(symbolId)) {
    log.info('TokenSymbol already exists for: {}', [tokenId]);
    return;
  }
  
  // Get contract
  let contract = TestToken1Contract.bind(tokenAddress);
  let symbolResult = contract.try_symbol();
  
  if (!symbolResult.reverted) {
    let symbol = new TokenSymbol(symbolId);
    symbol.token = tokenCore.id;
    symbol.value = symbolResult.value;
    symbol.save();
    log.info('Saved symbol: {} for token: {}', [symbolResult.value, tokenId]);
  } else {
    log.warning('Symbol call reverted for: {}', [tokenId]);
  }
}

export function handleNameCall(event: ethereum.Call): void {
  let tokenAddress = event.transaction.to;
  if (!tokenAddress) return;
  
  let tokenId = tokenAddress.toHex();
  let nameId = tokenId + "-name";
  
  log.info('=== Name Call for: {} ===', [tokenId]);
  
  // Get or create TokenCore
  let tokenCore = getOrCreateTokenCore(tokenAddress);
  
  // Check if already exists
  if (TokenName.load(nameId)) {
    log.info('TokenName already exists for: {}', [tokenId]);
    return;
  }
  
  // Get contract
  let contract = TestToken1Contract.bind(tokenAddress);
  let nameResult = contract.try_name();
  
  if (!nameResult.reverted) {
    let name = new TokenName(nameId);
    name.token = tokenCore.id;
    name.value = nameResult.value;
    name.save();
    log.info('Saved name: {} for token: {}', [nameResult.value, tokenId]);
  } else {
    log.warning('Name call reverted for: {}', [tokenId]);
  }
}

export function handleDecimalsCall(event: ethereum.Call): void {
  let tokenAddress = event.transaction.to;
  if (!tokenAddress) return;
  
  let tokenId = tokenAddress.toHex();
  let decimalsId = tokenId + "-decimals";
  
  log.info('=== Decimals Call for: {} ===', [tokenId]);
  
  // Get or create TokenCore
  let tokenCore = getOrCreateTokenCore(tokenAddress);
  
  // Check if already exists
  if (TokenDecimals.load(decimalsId)) {
    log.info('TokenDecimals already exists for: {}', [tokenId]);
    return;
  }
  
  // Get contract
  let contract = TestToken1Contract.bind(tokenAddress);
  let decimalsResult = contract.try_decimals();
  
  if (!decimalsResult.reverted) {
    let decimals = new TokenDecimals(decimalsId);
    decimals.token = tokenCore.id;
    decimals.value = BigInt.fromI32(decimalsResult.value);
    decimals.save();
    log.info('Saved decimals: {} for token: {}', [decimalsResult.value.toString(), tokenId]);
  } else {
    log.warning('Decimals call reverted for: {}', [tokenId]);
  }
}

export function handleTotalSupplyCall(event: ethereum.Call): void {
  let tokenAddress = event.transaction.to;
  if (!tokenAddress) return;
  
  let tokenId = tokenAddress.toHex();
  let totalSupplyId = tokenId + "-totalsupply";
  
  log.info('=== TotalSupply Call for: {} ===', [tokenId]);
  
  // Get or create TokenCore
  let tokenCore = getOrCreateTokenCore(tokenAddress);
  
  // Check if already exists
  if (TokenTotalSupply.load(totalSupplyId)) {
    log.info('TokenTotalSupply already exists for: {}', [tokenId]);
    return;
  }
  
  // Get contract
  let contract = TestToken1Contract.bind(tokenAddress);
  let totalSupplyResult = contract.try_totalSupply();
  
  if (!totalSupplyResult.reverted) {
    let totalSupply = new TokenTotalSupply(totalSupplyId);
    totalSupply.token = tokenCore.id;
    totalSupply.value = totalSupplyResult.value;
    totalSupply.save();
    log.info('Saved totalSupply: {} for token: {}', [totalSupplyResult.value.toString(), tokenId]);
  } else {
    log.warning('TotalSupply call reverted for: {}', [tokenId]);
  }
}

