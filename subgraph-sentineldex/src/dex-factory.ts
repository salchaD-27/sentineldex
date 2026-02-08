import { BigInt, Bytes, ethereum, Address } from "@graphprotocol/graph-ts";
import { PoolCreated as PoolCreatedEvent } from "../generated/DEXFactory/DEXFactory";
import { TestToken1 as TestToken1Contract } from "../generated/DEXFactory/TestToken1";
import { TestToken2 as TestToken2Contract } from "../generated/DEXFactory/TestToken2";
import { TestToken3 as TestToken3Contract } from "../generated/DEXFactory/TestToken3";
import { TestToken4 as TestToken4Contract } from "../generated/DEXFactory/TestToken4";
import { TestToken5 as TestToken5Contract } from "../generated/DEXFactory/TestToken5";
import { TestToken6 as TestToken6Contract } from "../generated/DEXFactory/TestToken6";
import { TestToken7 as TestToken7Contract } from "../generated/DEXFactory/TestToken7";
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

// Helper to fetch token data based on address - tries all token contracts
function fetchTokenData(address: Bytes): Token {
  let id = address.toHex();
  let token = Token.load(id);

  if (!token) {
    token = new Token(id);
    token.address = address;

    // Try each token contract to get metadata
    let contractAddress = Address.fromBytes(address);
    let symbol = "";
    let name = "";
    let decimals = 18;
    let totalSupply = BigInt.fromI32(0);

    // Try TestToken1
    let contract1 = TestToken1Contract.bind(contractAddress);
    let symbolResult = contract1.try_symbol();
    if (!symbolResult.reverted) {
      symbol = symbolResult.value;
      let nameResult = contract1.try_name();
      if (!nameResult.reverted) name = nameResult.value;
      let decimalsResult = contract1.try_decimals();
      if (!decimalsResult.reverted) decimals = decimalsResult.value;
      let totalSupplyResult = contract1.try_totalSupply();
      if (!totalSupplyResult.reverted) totalSupply = totalSupplyResult.value;
    } else {
      // Try TestToken2
      let contract2 = TestToken2Contract.bind(contractAddress);
      symbolResult = contract2.try_symbol();
      if (!symbolResult.reverted) {
        symbol = symbolResult.value;
        let nameResult = contract2.try_name();
        if (!nameResult.reverted) name = nameResult.value;
        let decimalsResult = contract2.try_decimals();
        if (!decimalsResult.reverted) decimals = decimalsResult.value;
        let totalSupplyResult = contract2.try_totalSupply();
        if (!totalSupplyResult.reverted) totalSupply = totalSupplyResult.value;
      } else {
        // Try TestToken3
        let contract3 = TestToken3Contract.bind(contractAddress);
        symbolResult = contract3.try_symbol();
        if (!symbolResult.reverted) {
          symbol = symbolResult.value;
          let nameResult = contract3.try_name();
          if (!nameResult.reverted) name = nameResult.value;
          let decimalsResult = contract3.try_decimals();
          if (!decimalsResult.reverted) decimals = decimalsResult.value;
          let totalSupplyResult = contract3.try_totalSupply();
          if (!totalSupplyResult.reverted) totalSupply = totalSupplyResult.value;
        } else {
          // Try TestToken4
          let contract4 = TestToken4Contract.bind(contractAddress);
          symbolResult = contract4.try_symbol();
          if (!symbolResult.reverted) {
            symbol = symbolResult.value;
            let nameResult = contract4.try_name();
            if (!nameResult.reverted) name = nameResult.value;
            let decimalsResult = contract4.try_decimals();
            if (!decimalsResult.reverted) decimals = decimalsResult.value;
            let totalSupplyResult = contract4.try_totalSupply();
            if (!totalSupplyResult.reverted) totalSupply = totalSupplyResult.value;
          } else {
            // Try TestToken5
            let contract5 = TestToken5Contract.bind(contractAddress);
            symbolResult = contract5.try_symbol();
            if (!symbolResult.reverted) {
              symbol = symbolResult.value;
              let nameResult = contract5.try_name();
              if (!nameResult.reverted) name = nameResult.value;
              let decimalsResult = contract5.try_decimals();
              if (!decimalsResult.reverted) decimals = decimalsResult.value;
              let totalSupplyResult = contract5.try_totalSupply();
              if (!totalSupplyResult.reverted) totalSupply = totalSupplyResult.value;
            } else {
              // Try TestToken6
              let contract6 = TestToken6Contract.bind(contractAddress);
              symbolResult = contract6.try_symbol();
              if (!symbolResult.reverted) {
                symbol = symbolResult.value;
                let nameResult = contract6.try_name();
                if (!nameResult.reverted) name = nameResult.value;
                let decimalsResult = contract6.try_decimals();
                if (!decimalsResult.reverted) decimals = decimalsResult.value;
                let totalSupplyResult = contract6.try_totalSupply();
                if (!totalSupplyResult.reverted) totalSupply = totalSupplyResult.value;
              } else {
                // Try TestToken7
                let contract7 = TestToken7Contract.bind(contractAddress);
                symbolResult = contract7.try_symbol();
                if (!symbolResult.reverted) {
                  symbol = symbolResult.value;
                  let nameResult = contract7.try_name();
                  if (!nameResult.reverted) name = nameResult.value;
                  let decimalsResult = contract7.try_decimals();
                  if (!decimalsResult.reverted) decimals = decimalsResult.value;
                  let totalSupplyResult = contract7.try_totalSupply();
                  if (!totalSupplyResult.reverted) totalSupply = totalSupplyResult.value;
                }
              }
            }
          }
        }
      }
    }

    token.symbol = symbol;
    token.name = name;
    token.decimals = BigInt.fromI32(decimals);
    token.totalSupply = totalSupply;
    
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

