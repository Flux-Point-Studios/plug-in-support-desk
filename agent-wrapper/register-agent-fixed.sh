#!/bin/bash

# Register Agent with Masumi Script - Fixed JSON version

ADMIN_KEY="6db15c0fe770cad286d9c3c81e621844"
SELLING_WALLET_VKEY="3098520b410171508162069c1bf6951e478a86d859f9e1deae96ce08"

echo "🚀 Registering AI Support Agent with Masumi..."

# Create JSON payload in a temporary file to avoid shell escaping issues
cat > /tmp/register-payload.json << EOF
{
  "network": "Preprod",
  "name": "AI Support Agent",
  "description": "Intelligent customer support agent powered by Flux Point Studios AI. Provides instant, accurate support 24/7.",
  "Tags": ["support", "AI", "customer-service", "help-desk"],
  "ExampleOutputs": [
    {
      "name": "Password Reset Help",
      "url": "https://support-bot-builder.vercel.app/api/agent/execute",
      "mimeType": "application/json"
    }
  ],
  "Author": {
    "name": "Flux Point Studios",
    "organization": "Flux Point Studios",
    "contactEmail": "support@fluxpointstudios.com",
    "contactOther": ""
  },
  "Legal": {
    "terms": "https://fluxpointstudios.com/terms",
    "privacyPolicy": "https://fluxpointstudios.com/privacy",
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
        "unit": "",
        "amount": "1000000"
      }
    ]
  },
  "sellingWalletVkey": "$SELLING_WALLET_VKEY"
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
echo "Next steps:"
echo "1. Check the response for your agentIdentifier"
echo "2. Monitor the registration status"
echo "3. Check if the agent appears on the Masumi Explorer" 