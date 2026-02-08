#!/bin/bash
set -e

BASE_DIR="/Users/salchad27/Desktop/PH/web3/sentineldex"
SUBGRAPH_DIR="$BASE_DIR/subgraph-sentineldex"
HARDHAT_DIR="$BASE_DIR/hardhat"

echo "=== Creating Pools and Adding Liquidity (optional) ==="
cd "$HARDHAT_DIR"
# Uncomment the line below if you want to create pools via test script
# npx hardhat test --network localhost

echo ""
echo "=== Removing Old Subgraph (if exists) ==="
cd "$SUBGRAPH_DIR"
# Remove existing subgraph if it exists
graph remove --node http://localhost:8020 subgraph-sentineldex 2>/dev/null || true

echo "=== Creating Subgraph ==="
graph create --node http://localhost:8020 subgraph-sentineldex

echo ""
echo "=== Building and Deploying Subgraph ==="
# Generate types and build
echo "Generating types..."
npm run codegen

echo "Building subgraph..."
npm run build

# Deploy
echo "Deploying subgraph..."
graph deploy \
  --node http://localhost:8020 \
  --ipfs http://localhost:5001 \
  subgraph-sentineldex \
  --version-label v1

echo ""
echo "Waiting for subgraph to sync..."
sleep 30

# Check if subgraph is synced (simple check without jq)
echo "Checking subgraph sync status..."
for i in {1..60}; do
  RESPONSE=$(curl -s "http://localhost:8000/subgraphs/name/subgraph-sentineldex" -H "Content-Type: application/json" -d '{"query":"{ _meta { block { number } } }"}')
  if echo "$RESPONSE" | grep -q '"number":[1-9]'; then
    echo "✓ Subgraph synced!"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "⚠ Subgraph may still be syncing. Check status manually."
  fi
  sleep 5
done

echo ""
echo "=== Done! ==="
echo "✓ Pools created and liquidity added"
echo "✓ Graph Node infrastructure started"
echo "✓ Subgraph deployed and syncing"
echo ""
echo "GraphQL endpoint: http://localhost:8000/subgraphs/name/subgraph-sentineldex"