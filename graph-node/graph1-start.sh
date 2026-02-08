#!/bin/bash
set -e

BASE_DIR="/Users/salchad27/Desktop/PH/web3/sentineldex"
SUBGRAPH_DIR="$BASE_DIR/subgraph-sentineldex"
HARDHAT_DIR="$BASE_DIR/hardhat"

# npx hardhat node --block-gas-limit 50000000

echo "=== Starting Graph Node Infrastructure ==="
cd "$BASE_DIR/graph-node"
# Use -v to clear volumes for a clean start (important when restarting Hardhat)
docker compose down -v 2>/dev/null || true
docker compose up -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Wait for IPFS to be ready
echo "Waiting for IPFS..."
for i in {1..30}; do
  if curl -s http://localhost:5001/api/v0/id > /dev/null 2>&1; then
    echo "✓ IPFS is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ IPFS failed to start"
    exit 1
  fi
  sleep 1
done

# Wait for Graph node to be ready
echo "Waiting for Graph node..."
for i in {1..30}; do
  if curl -s http://localhost:8020/ > /dev/null 2>&1; then
    echo "✓ Graph node is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ Graph node failed to start"
    exit 1
  fi
  sleep 1
done

echo ""
echo "=== Infrastructure Ready! ==="
echo "✓ Hardhat node running"
echo "✓ Graph Node infrastructure started"
