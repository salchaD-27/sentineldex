
#!/bin/bash
set -e

BASE_DIR="/Users/salchad27/Desktop/PH/web3/sentineldex"
SUBGRAPH_DIR="$BASE_DIR/subgraph-sentineldex"

echo "=== Starting Graph Node ==="
cd "$BASE_DIR/graph-node"

# Stop any existing containers
docker compose down -v 2>/dev/null || true

# Start fresh
docker compose up -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Wait for IPFS
echo "Waiting for IPFS..."
for i in {1..30}; do
  if curl -s http://localhost:5001/api/v0/id > /dev/null 2>&1; then
    echo "✓ IPFS ready"
    break
  fi
  if [ $i -eq 30 ]; then echo "✗ IPFS failed"; exit 1; fi
  sleep 1
done

# Wait for Graph node
echo "Waiting for Graph node..."
for i in {1..30}; do
  if curl -s http://localhost:8020/ > /dev/null 2>&1; then
    echo "✓ Graph node ready"
    break
  fi
  if [ $i -eq 30 ]; then echo "✗ Graph node failed"; exit 1; fi
  sleep 1
done

echo ""
echo "=== Done! ==="