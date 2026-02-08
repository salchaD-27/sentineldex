
#!/bin/bash
set -e

BASE_DIR="/Users/salchad27/Desktop/PH/web3/sentineldex"
SUBGRAPH_DIR="$BASE_DIR/subgraph-sentineldex"




echo ""
echo "=== Removing old subgraph ==="
cd "$SUBGRAPH_DIR"
graph remove --node http://localhost:8020 subgraph-sentineldex 2>/dev/null || true

echo ""
echo "=== Creating subgraph ==="
graph create --node http://localhost:8020 subgraph-sentineldex

echo ""
echo "=== Deploying subgraph ==="
graph deploy \
  --node http://localhost:8020 \
  --ipfs http://localhost:5001 \
  subgraph-sentineldex \
  --version-label v1

echo ""
echo "=== Waiting for sync ==="
sleep 30

# Check sync status
for i in {1..54}; do
  RESPONSE=$(curl -s "http://localhost:8000/subgraphs/name/subgraph-sentineldex" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ _meta { block { number } } }"}')
  
  if echo "$RESPONSE" | grep -q '"number"'; then
    BLOCK_NUM=$(echo "$RESPONSE" | grep -o '"number":[0-9]*' | head -1 | cut -d: -f2)
    echo "✓ Synced to block $BLOCK_NUM"
    break
  fi
  echo "Waiting for sync... ($i/54)"
  sleep 5
done


echo ""
echo "=== Deployed! ==="
echo "GraphQL: http://localhost:8000/subgraphs/name/subgraph-sentineldex"

