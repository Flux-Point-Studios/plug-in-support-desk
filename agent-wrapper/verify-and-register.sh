#!/bin/bash

echo "=== VERIFYING CONTRACT FUNDING AND REGISTERING AGENT ==="
echo ""

# Step 1: Verify contract has funds
echo "1. Checking smart contract balance..."
CONTRACT="addr_test1wpgyu7le0j33e3afdvjdarc357juclkwz4dwf25qs7egfgga7xhqs"
curl -s -X GET "http://159.203.90.91:3001/api/v1/utxos/?address=$CONTRACT&network=Preprod" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" | jq '.data | if . then {utxo_count: length, total_ada: (map(.value[0].quantity // 0 | tonumber) | add / 1000000)} else "No UTXOs" end'

echo ""
echo "2. Checking payment source status..."
curl -s -X GET "http://159.203.90.91:3001/api/v1/extended-payment-sources" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" | jq '.data.ExtendedPaymentSources[0] | {id, status: .status, network, updated: .updatedAt}'

echo ""
echo "3. Registering AI Support Agent..."
RESPONSE=$(curl -s -X POST "http://159.203.90.91:3001/api/v1/registry/" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -H "Content-Type: application/json" \
  -d '{
    "network": "Preprod",
    "smartContractAddress": "addr_test1wpgyu7le0j33e3afdvjdarc357juclkwz4dwf25qs7egfgga7xhqs",
    "sellingWalletVkey": "a780c86e7238813ad7320b09d41c284d8e129b796ee05391be8f86ab",
    "name": "AI Support Agent",
    "description": "An intelligent support agent that provides helpful responses to user queries",
    "apiBaseUrl": "https://support-bot-builder.vercel.app/api/agent",
    "Tags": ["support", "AI", "customer-service", "chatbot"],
    "ExampleOutputs": [
      {
        "name": "Sample Support Response",
        "url": "https://support-bot-builder.vercel.app/api/agent/example-output",
        "mimeType": "application/json"
      }
    ],
    "Capability": {
      "name": "GPT-4 Based Support",
      "version": "1.0.0"
    },
    "Legal": {
      "privacyPolicy": "https://support-bot-builder.vercel.app/privacy",
      "terms": "https://support-bot-builder.vercel.app/terms",
      "other": ""
    },
    "AgentPricing": {
      "pricingType": "Fixed",
      "Pricing": [
        {
          "unit": "",
          "amount": "1000000"
        }
      ]
    },
    "Author": {
      "name": "Support Bot Builder",
      "organization": "AI Solutions Inc",
      "contactEmail": "support@example.com",
      "contactOther": ""
    }
  }')

echo "$RESPONSE" | jq '.'
AGENT_ID=$(echo "$RESPONSE" | jq -r '.data.id // "none"')

if [ "$AGENT_ID" != "none" ]; then
  echo ""
  echo "4. Registration submitted! Agent ID: $AGENT_ID"
  echo "   Waiting 30 seconds for blockchain confirmation..."
  sleep 30
  
  echo ""
  echo "5. Checking if agent appears in registry..."
  curl -s -X POST "http://159.203.90.91:3000/api/v1/registry-entry/" \
    -H "token: 6db15c0fe770cad286d9c3c81e621844" \
    -H "Content-Type: application/json" \
    -d '{"network": "Preprod", "filter": {"name": "AI Support Agent"}}' | jq '.data.entries[] | {name, state, identifier}'
fi

echo ""
echo "=== REGISTRATION COMPLETE ===" 