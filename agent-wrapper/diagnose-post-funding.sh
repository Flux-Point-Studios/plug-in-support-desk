#!/bin/bash

echo "=== POST-FUNDING DIAGNOSTIC ==="
echo "Date: $(date)"
echo ""

echo "1. Contract UTXO Status:"
curl -s -X GET "http://159.203.90.91:3001/api/v1/utxos/?address=addr_test1wpgyu7le0j33e3afdvjdarc357juclkwz4dwf25qs7egfgga7xhqs&network=Preprod" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.data | if . then length else "Error or no data" end'

echo ""
echo "2. Payment Source Status:"
curl -s -X GET "http://159.203.90.91:3001/api/v1/extended-payment-sources" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.data.ExtendedPaymentSources[0] | {id, status, lastCheckedAt, network}'

echo ""
echo "3. Total agents in registry:"
COUNT=$(curl -s -X POST "http://159.203.90.91:3000/api/v1/registry-entry/" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" \
  -d '{"network": "Preprod", "limit": 100}' 2>/dev/null | jq '.data.entries | length')
echo "   Agents registered: $COUNT"

echo ""
echo "4. Recent registration attempts (checking for our IDs):"
echo "   - cmbw5wm7k000krtbs7ogg16m1 (latest)"
echo "   - cmbvoj38o0000rtbsrfr3hcvn"
echo "   - cmbvp836r000grtbs02zmltta"

echo ""
echo "5. Checking registry source sync status:"
curl -s -X GET "http://159.203.90.91:3000/api/v1/registry-source/?limit=10" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.data.sources[0] | {latestPage, latestIdentifier, lastSync: .updatedAt}'

echo ""
echo "HYPOTHESIS: The contract may be funded but the payment source might need:"
echo "  - Manual restart of the payment service"
echo "  - Time for the service to detect the funding"
echo "  - Or there may be another configuration issue"
echo ""
echo "=== END DIAGNOSTIC ===" 