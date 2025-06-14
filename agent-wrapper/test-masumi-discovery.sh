#!/bin/bash

echo "=== TESTING MASUMI AGENT DISCOVERY ==="
echo "Date: $(date)"
echo ""

echo "1. Testing public registry access..."
curl -s -X POST "https://registry.masumi.network/api/v1/registry-entry" \
  -H "Content-Type: application/json" \
  -H "token: public-test-key-masumi-registry-c23f3d21" \
  -d '{"network": "Preprod", "limit": 10}' | jq '.'

echo ""
echo "2. Checking if agents are available..."
AGENTS=$(curl -s -X POST "https://registry.masumi.network/api/v1/registry-entry" \
  -H "Content-Type: application/json" \
  -H "token: public-test-key-masumi-registry-c23f3d21" \
  -d '{"network": "Preprod", "limit": 50}' 2>/dev/null | jq '.data.entries | length' 2>/dev/null || echo "0")

echo "   Total agents found: $AGENTS"

if [ "$AGENTS" -eq 0 ]; then
  echo ""
  echo "ℹ️  No agents found in Masumi Preprod registry."
  echo "   This is expected if no agents are currently registered."
  echo "   The application will gracefully handle this and suggest configuring an agent."
else
  echo ""
  echo "✅ SUCCESS! Found $AGENTS agents in the registry."
  echo ""
  echo "3. Sample agent details:"
  curl -s -X POST "https://registry.masumi.network/api/v1/registry-entry" \
    -H "Content-Type: application/json" \
    -H "token: public-test-key-masumi-registry-c23f3d21" \
    -d '{"network": "Preprod", "limit": 3}' | jq '.data.entries[] | {name, status, description, apiBaseUrl}'
fi

echo ""
echo "=== TEST COMPLETE ===" 