import { PoolCreated as PoolCreatedEvent } from "../generated/DEXFactory/DEXFactory"
import { Pool } from "../generated/schema"

export function handlePoolCreated(event: PoolCreatedEvent): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let entity = new Pool(id);

  entity.token0 = event.params.token0;
  entity.token1 = event.params.token1;
  entity.pool = event.params.pool;

  entity.blockNumber = event.block.number;
  entity.createdAt = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
