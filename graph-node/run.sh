#!/bin/bash
set -e

BASE_DIR="/Users/salchad27/Desktop/PH/web3/sentineldex"

echo "Starting Graph Node..."
cd "$BASE_DIR/graph-node"
docker compose down
docker compose up -d

echo "Waiting for Graph Node..."
sleep 10

echo "Deploying subgraph..."
cd "$BASE_DIR/subgraph-sentineldex"

graph create \
  --node http://localhost:8020 \
  subgraph-sentineldex 2>/dev/null || true

graph deploy subgraph-sentineldex \
  --node http://localhost:8020 \
  --ipfs http://localhost:5001 \
  --version-label v1 \
  --skip-migrations

echo "Done!"
echo "Query at: http://localhost:8000/subgraphs/name/subgraph-sentineldex/graphql"