#!/bin/bash

echo "=== MAINNET AGENT REGISTRATION ==="
echo ""

MAINNET_CONTRACT="addr1w9gyu7le0j33e3afdvjdarc357juclkwz4dwf25qs7egfggxkjt04"
SELLING_VKEY="b552c0e706f32bd2e26468513eb5f6e25cec1dd596759c575140eb32"
TOKEN="6db15c0fe770cad286d9c3c81e621844"

echo "1. Checking Mainnet smart contract funding..."
curl -s -X GET "http://159.203.90.91:3001/api/v1/utxos/?address=$MAINNET_CONTRACT&network=Mainnet" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" | jq '.data | if . then {utxo_count: length, message: "Contract has UTXOs"} else "Contract needs funding" end'

echo ""
echo "2. Checking Mainnet payment source status..."
curl -s -X GET "http://159.203.90.91:3001/api/v1/extended-payment-sources" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" | jq '.data.ExtendedPaymentSources[] | select(.network == "Mainnet") | {id, network, status, smartContractAddress}'

echo ""
echo "3. Checking wallet balances..."
echo "   Selling wallet balance:"
curl -s -X GET "http://159.203.90.91:3001/api/v1/balance/?address=addr1qx649s88qmejh5hzv359z0447m39emqa6kt8t8zh29qwkv3exnjh28vgskcq2knsy0dluya8zers3500c2q8y87fj9cqe7u5re&network=Mainnet" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.data.balance // "Error getting balance"'

echo "   Buying wallet balance:"
curl -s -X GET "http://159.203.90.91:3001/api/v1/balance/?address=addr1q8004dhyed07y0ysg8qup8xtg64zpt28wv2hp0l72v7n9j34r9my38f80dnhfkd0j6dgrnumk3wltu955qzz93z4t0zsa7vjrf&network=Mainnet" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.data.balance // "Error getting balance"'

echo ""
echo "4. Registering AI Support Agent on Mainnet..."
RESPONSE=$(curl -s -X POST "http://159.203.90.91:3001/api/v1/registry/" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "network": "Mainnet",
    "smartContractAddress": "'$MAINNET_CONTRACT'",
    "sellingWalletVkey": "'$SELLING_VKEY'",
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
  echo "5. Registration submitted! Agent ID: $AGENT_ID"
  echo "   Waiting 30 seconds for blockchain confirmation..."
  sleep 30
  
  echo ""
  echo "6. Checking Mainnet registry..."
  curl -s -X POST "http://159.203.90.91:3000/api/v1/registry-entry/" \
    -H "token: $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"network": "Mainnet", "filter": {"name": "AI Support Agent"}}' | jq '.data.entries[] | {name, state, identifier}'
fi

echo ""
echo "=== MAINNET REGISTRATION COMPLETE ===" 