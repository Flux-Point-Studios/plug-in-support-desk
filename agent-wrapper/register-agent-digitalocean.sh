#!/bin/bash

# Register Agent with DigitalOcean Masumi Instance

DROPLET_IP="159.203.90.91"
ADMIN_KEY="6db15c0fe770cad286d9c3c81e621844"
SELLING_WALLET_VKEY="3098520b410171508162069c1bf6951e478a86d859f9e1deae96ce08"

echo "🚀 Registering AI Support Agent with Masumi on DigitalOcean..."
echo ""

# Create registration payload
cat > /tmp/do-register-payload.json << 'EOF'
{
  "network": "Preprod",
  "name": "AI Support Agent",
  "description": "Intelligent customer support agent powered by Flux Point Studios AI",
  "Tags": ["support", "AI", "customer-service"],
  "ExampleOutputs": [
    {
      "name": "Support Response",
      "url": "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      "mimeType": "application/json"
    }
  ],
  "Author": {
    "name": "Flux Point Studios",
    "contactEmail": "support@fluxpointstudios.com",
    "organization": "Flux Point Studios"
  },
  "apiBaseUrl": "https://support-bot-builder.vercel.app/api/agent",
  "Legal": {
    "privacyPolicy": "https://fluxpointstudios.com/privacy",
    "terms": "https://fluxpointstudios.com/terms"
  },
  "sellingWalletVkey": "3098520b410171508162069c1bf6951e478a86d859f9e1deae96ce08",
  "Capability": {
    "name": "GPT-4 Support",
    "version": "1.0.0"
  },
  "AgentPricing": {
    "pricingType": "Fixed",
    "Pricing": [
      {
        "unit": "",
        "amount": "1000000"
      }
    ]
  }
}
EOF

echo "📡 Checking service health..."
curl -s http://$DROPLET_IP:3001/api/v1/health || echo "Payment service still starting..."

echo ""
echo "📝 Registering agent..."
RESPONSE=$(curl -s -X POST "http://$DROPLET_IP:3001/api/v1/registry/" \
  -H "token: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/do-register-payload.json)

echo "$RESPONSE" | jq '.' || echo "$RESPONSE"

# Extract agent ID if successful
AGENT_ID=$(echo "$RESPONSE" | jq -r '.data.id' 2>/dev/null)

if [ ! -z "$AGENT_ID" ] && [ "$AGENT_ID" != "null" ]; then
  echo ""
  echo "✅ Registration submitted! Agent ID: $AGENT_ID"
  echo ""
  echo "📊 Monitor status with:"
  echo "   bash check-registration-digitalocean.sh $AGENT_ID"
else
  echo ""
  echo "❌ Registration failed. Check the response above."
fi

# Cleanup
rm -f /tmp/do-register-payload.json 