#!/bin/bash

echo "Checking Payment Source Activation Status..."
echo ""

# Get the extended payment source data we already have
echo "Payment Source Details:"
echo "ID: cmbvnq16d0002rtbs57kcx6rk"
echo "Status: Inactive (as shown in UI)"
echo "Smart Contract: addr_test1wpgyu7le0j33e3afdvjdarc357juclkwz4dwf25qs7egfgga7xhqs"
echo ""

echo "Checking if smart contract needs initial funding..."
# The smart contract might need ADA to operate
curl -s -X GET "http://159.203.90.91:3001/api/v1/utxos/?address=addr_test1wpgyu7le0j33e3afdvjdarc357juclkwz4dwf25qs7egfgga7xhqs&network=Preprod" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" | jq '.data | if . then {utxo_count: length, total_ada: (map(.value[0].quantity // 0 | tonumber) | add / 1000000)} else "No UTXOs" end'

echo ""
echo "Testing if we can activate the payment source..."
# Try different activation endpoints
endpoints=(
    "/api/v1/payment-source/cmbvnq16d0002rtbs57kcx6rk/activate"
    "/api/v1/smart-contract/cmbvnq16d0002rtbs57kcx6rk/activate"
    "/api/v1/payment-sources/cmbvnq16d0002rtbs57kcx6rk/activate"
    "/api/v1/activate/cmbvnq16d0002rtbs57kcx6rk"
)

for endpoint in "${endpoints[@]}"; do
    echo "Trying: $endpoint"
    response=$(curl -s -X POST "http://159.203.90.91:3001$endpoint" \
      -H "token: 6db15c0fe770cad286d9c3c81e621844" \
      -H "Content-Type: application/json" \
      -d '{"network": "Preprod"}')
    
    if [[ ! "$response" =~ "Can not" ]] && [[ ! "$response" =~ "Cannot" ]]; then
        echo "Response: $response" | jq '.' 2>/dev/null || echo "Response: $response"
    fi
done

echo ""
echo "DIAGNOSIS: The Payment Source shows as 'Inactive' in the UI."
echo "This is likely why registrations are failing - they're accepted but can't complete"
echo "because the payment source isn't active to process the blockchain transaction." 