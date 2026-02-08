#!/bin/bash
set -e

BASE_DIR="/Users/salchad27/Desktop/PH/web3/sentineldex"
SUBGRAPH_DIR="$BASE_DIR/subgraph-sentineldex"
HARDHAT_DIR="$BASE_DIR/hardhat"

echo "=== Removing Old Subgraph ==="
cd "$SUBGRAPH_DIR"
graph remove --node http://localhost:8020 subgraph-sentineldex 2>/dev/null || true

echo "=== Creating Subgraph ==="
graph create --node http://localhost:8020 subgraph-sentineldex

echo ""
echo "=== Building Subgraph ==="
npm run codegen
npm run build

echo ""
echo "=== Deploying Subgraph ==="
graph deploy \
  --node http://localhost:8020 \
  --ipfs http://localhost:5001 \
  subgraph-sentineldex \
  --version-label v1

echo ""
echo "=== Waiting for Subgraph to Sync ==="
sleep 30

# Check if subgraph is synced
for i in {1..60}; do
  RESPONSE=$(curl -s "http://localhost:8000/subgraphs/name/subgraph-sentineldex" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ _meta { block { number } } }"}')
  
  if echo "$RESPONSE" | grep -q '"number"'; then
    BLOCK_NUM=$(echo "$RESPONSE" | grep -o '"number":[0-9]*' | head -1 | cut -d: -f2)
    echo "✓ Subgraph synced to block $BLOCK_NUM"
    break
  fi
  
  if [ $i -eq 60 ]; then
    echo "⚠ Subgraph may still be syncing. Check status manually."
  fi
  echo "Waiting for sync... ($i/60)"
  sleep 5
done

# echo ""
# echo "=== Testing Pool Query ==="
# sleep 5
# POOLS_RESPONSE=$(curl -s "http://localhost:8000/subgraphs/name/subgraph-sentineldex" \
#   -H "Content-Type: application/json" \
#   -d '{"query":"{ pools { id token0 { id symbol } token1 { id symbol } reserve0 reserve1 } }"}')
# echo "$POOLS_RESPONSE" | head -c 500

echo ""
echo ""
echo "=== Done! ==="
echo "GraphQL endpoint: http://localhost:8000/subgraphs/name/subgraph-sentineldex"

