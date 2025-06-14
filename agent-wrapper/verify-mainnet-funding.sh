#!/bin/bash

echo "=== VERIFYING MAINNET FUNDING AND REGISTRATION ==="
echo "Date: $(date)"
echo ""

TOKEN="6db15c0fe770cad286d9c3c81e621844"
MAINNET_CONTRACT="addr1w9gyu7le0j33e3afdvjdarc357juclkwz4dwf25qs7egfggxkjt04"
SELLING_WALLET="addr1qx649s88qmejh5hzv359z0447m39emqa6kt8t8zh29qwkv3exnjh28vgskcq2knsy0dluya8zers3500c2q8y87fj9cqe7u5re"
BUYING_WALLET="addr1q8004dhyed07y0ysg8qup8xtg64zpt28wv2hp0l72v7n9j34r9my38f80dnhfkd0j6dgrnumk3wltu955qzz93z4t0zsa7vjrf"

echo "1. Checking smart contract funding..."
curl -s -X GET "http://159.203.90.91:3001/api/v1/utxos/?address=$MAINNET_CONTRACT&network=Mainnet" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" | jq '.data | if . then {utxo_count: length, message: "Contract is funded!"} else "Still needs funding" end'

echo ""
echo "2. Checking wallet balances..."
echo "   Selling wallet:"
curl -s -X GET "http://159.203.90.91:3001/api/v1/balance/?address=$SELLING_WALLET&network=Mainnet" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" | jq '.data.balance // "Error"'

echo "   Buying wallet:"
curl -s -X GET "http://159.203.90.91:3001/api/v1/balance/?address=$BUYING_WALLET&network=Mainnet" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" | jq '.data.balance // "Error"'

echo ""
echo "3. Checking payment source status..."
curl -s -X GET "http://159.203.90.91:3001/api/v1/extended-payment-sources" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" | jq '.data.ExtendedPaymentSources[] | select(.network == "Mainnet") | {id, network, status, lastCheckedAt}'

echo ""
echo "4. Checking if previous registration (cmbw6oeqy000zrtbsbl5t7s61) completed..."
curl -s -X POST "http://159.203.90.91:3000/api/v1/registry-entry/" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"network": "Mainnet"}' | jq '.data.entries | if length > 0 then .[0] | {name, state, identifier} else "No agents registered yet" end'

echo ""
echo "5. Total agents in Mainnet registry:"
curl -s -X POST "http://159.203.90.91:3000/api/v1/registry-entry/" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"network": "Mainnet"}' | jq '.data.entries | length'

echo ""
echo "6. If needed, will wait 60 seconds for blockchain confirmation..."
sleep 60

echo ""
echo "7. Checking registry again after wait..."
COUNT=$(curl -s -X POST "http://159.203.90.91:3000/api/v1/registry-entry/" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"network": "Mainnet"}' 2>/dev/null | jq '.data.entries | length')

echo "   Mainnet agents now: $COUNT"

if [ "$COUNT" -eq 0 ]; then
  echo ""
  echo "8. No agents found. Attempting new registration..."
  
  RESPONSE=$(curl -s -X POST "http://159.203.90.91:3001/api/v1/registry/" \
    -H "token: $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "network": "Mainnet",
      "smartContractAddress": "'$MAINNET_CONTRACT'",
      "sellingWalletVkey": "b552c0e706f32bd2e26468513eb5f6e25cec1dd596759c575140eb32",
      "name": "AI Support Agent (Mainnet)",
      "description": "An intelligent support agent that provides helpful responses to user queries",
      "apiBaseUrl": "https://support-bot-builder.vercel.app/api/agent",
      "Tags": ["support", "AI", "customer-service", "chatbot", "mainnet"],
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
  NEW_AGENT_ID=$(echo "$RESPONSE" | jq -r '.data.id // "none"')
  
  if [ "$NEW_AGENT_ID" != "none" ]; then
    echo ""
    echo "9. New registration submitted! ID: $NEW_AGENT_ID"
    echo "   Waiting another 60 seconds..."
    sleep 60
    
    echo ""
    echo "10. Final registry check..."
    curl -s -X POST "http://159.203.90.91:3000/api/v1/registry-entry/" \
      -H "token: $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"network": "Mainnet"}' | jq '.data.entries[] | {name, state, identifier}'
  fi
else
  echo "   SUCCESS! Agent found in registry!"
  curl -s -X POST "http://159.203.90.91:3000/api/v1/registry-entry/" \
    -H "token: $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"network": "Mainnet"}' | jq '.data.entries[] | {name, state, identifier}'
fi

echo ""
echo "=== VERIFICATION COMPLETE ===" 