#!/bin/bash
set -e

BASE_DIR="/Users/salchad27/Desktop/PH/web3/sentineldex"
SUBGRAPH_DIR="$BASE_DIR/subgraph-sentineldex"

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
echo "=== Deploying Subgraph ==="
cd "$SUBGRAPH_DIR"

# Remove existing subgraph if it exists (ignore errors if not found)
echo "Removing existing subgraph if any..."
graph remove --node http://localhost:8020 subgraph-sentineldex 2>/dev/null || true

# Create subgraph
echo "Creating subgraph..."
graph create --node http://localhost:8020 subgraph-sentineldex

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
echo "=== Done! ==="
echo "✓ Graph Node infrastructure started"
echo "✓ Subgraph deployed successfully"