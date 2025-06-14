#!/bin/bash

echo "Checking for recent registration attempts and errors..."
echo ""

# Check if we can get recent transactions or logs
echo "1. Testing transaction endpoints..."
curl -s -X GET "http://159.203.90.91:3001/api/v1/transactions?limit=10" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "No transaction endpoint"

echo ""
echo "2. Checking agent listing..."
curl -s -X GET "http://159.203.90.91:3001/api/v1/agents?network=Preprod" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "No agents endpoint"

echo ""
echo "3. Trying to get registration by ID with network..."
curl -s -X GET "http://159.203.90.91:3001/api/v1/registry/cmbvoj38o0000rtbsrfr3hcvn?network=Preprod" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "4. Checking payment source status..."
curl -s -X GET "http://159.203.90.91:3001/api/v1/smart-contract/cmbvnq16d0002rtbs57kcx6rk" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Cannot access payment source" 