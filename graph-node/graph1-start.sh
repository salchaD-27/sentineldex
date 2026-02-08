#!/bin/bash
set -e

BASE_DIR="/Users/salchad27/Desktop/PH/web3/sentineldex"
SUBGRAPH_DIR="$BASE_DIR/subgraph-sentineldex"
HARDHAT_DIR="$BASE_DIR/hardhat"

echo "=== Starting Hardhat Node ==="
cd "$HARDHAT_DIR"
# Kill any existing hardhat processes
pkill -f "hardhat node" || true
sleep 2
# Start hardhat node in background
npx hardhat node --hostname 127.0.0.1 &
HARDHAT_PID=$!
echo "Hardhat node started with PID: $HARDHAT_PID"
sleep 5

echo "=== Starting Graph Node Infrastructure ==="
cd "$BASE_DIR/graph-node"
docker compose down -v  # Remove volumes for clean start
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
echo "=== Deploying Contracts ==="
cd "$HARDHAT_DIR"
./scripts/deploy.sh

echo ""
echo "=== Infrastructure Ready! ==="
echo "✓ Hardhat node running"
echo "✓ Graph Node infrastructure started"
echo "✓ Contracts deployed"
echo ""
echo "Now you can:"
echo "1. Create pools using the UI or manually"
echo "2. Add liquidity to pools"
echo ""
echo "When done creating pools, run: ./graph2-deploy.sh"

