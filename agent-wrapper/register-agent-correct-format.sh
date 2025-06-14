#!/bin/bash

# Register Agent with Masumi Script - Matching successful format

ADMIN_KEY="6db15c0fe770cad286d9c3c81e621844"
SELLING_WALLET_VKEY="3098520b410171508162069c1bf6951e478a86d859f9e1deae96ce08"

echo "🚀 Registering AI Support Agent with Masumi (correct metadata format)..."

# Create JSON payload matching successful registration structure
cat > /tmp/register-payload.json << 'EOF'
{
  "network": "Preprod",
  "name": "AI Support Agent",
  "description": "Intelligent customer support agent powered by Flux Point Studios AI",
  "Tags": ["support", "AI", "customer-service"],
  "ExampleOutputs": [],
  "Author": {
    "name": "Flux Point Studios",
    "organization": "Flux Point Studios", 
    "contactEmail": "support@fluxpointstudios.com",
    "contactOther": ""
  },
  "Legal": {
    "terms": "",
    "privacyPolicy": "",
    "other": ""
  },
  "apiBaseUrl": "https://support-bot-builder.vercel.app/api/agent",
  "Capability": {
    "name": "Customer Support AI",
    "version": "1.0.0"
  },
  "AgentPricing": {
    "pricingType": "Fixed",
    "Pricing": [
      {
        "unit": "lovelace",
        "amount": "10000000"
      }
    ]
  },
  "sellingWalletVkey": "3098520b410171508162069c1bf6951e478a86d859f9e1deae96ce08"
}
EOF

# Send the registration request
curl -X POST "http://localhost:3001/api/v1/registry/" \
  -H "Content-Type: application/json" \
  -H "token: $ADMIN_KEY" \
  -d @/tmp/register-payload.json | tee registration-response.json

# Clean up
rm -f /tmp/register-payload.json

echo ""
echo "📝 Registration response saved to registration-response.json"
echo ""
echo "📊 To monitor registration status:"
echo "   bash check-registration-status.sh <agent_id>"
echo ""
echo "⏱️  Monitoring for errors..."
docker logs -f masumi-payment-service 2>&1 | grep -E "registering|Error|error|tx/submit" & 