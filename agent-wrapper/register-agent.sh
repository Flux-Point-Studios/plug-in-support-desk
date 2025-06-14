#!/bin/bash

# Register Agent with Masumi Script

ADMIN_KEY="6db15c0fe770cad286d9c3c81e621844"
SELLING_WALLET_VKEY="3098520b410171508162069c1bf6951e478a86d859f9e1deae96ce08"

echo "🚀 Registering AI Support Agent with Masumi..."

curl -X POST "http://localhost:3001/api/v1/registry/" \
  -H "Content-Type: application/json" \
  -H "token: $ADMIN_KEY" \
  -d '{
    "network": "Preprod",
    "name": "AI Support Agent",
    "description": "Intelligent customer support agent powered by Flux Point Studios AI. Provides instant, accurate support 24/7.",
    "Tags": ["support", "AI", "customer-service", "help-desk"],
    "ExampleOutputs": [
      {
        "input": "How do I reset my password?",
        "output": "I can help you reset your password. Please go to the login page and click on 'Forgot Password'. You will receive an email with reset instructions."
      },
      {
        "input": "What are your business hours?",
        "output": "Our AI support is available 24/7 to assist you. For human support, we are available Monday-Friday 9am-5pm EST."
      }
    ],
    "Author": {
      "name": "Flux Point Studios",
      "email": "support@fluxpointstudios.com"
    },
    "Legal": {
      "terms": "https://fluxpointstudios.com/terms",
      "privacy": "https://fluxpointstudios.com/privacy"
    },
    "apiBaseUrl": "http://localhost:8000",
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
    "sellingWalletVkey": "'"$SELLING_WALLET_VKEY"'"
  }' | tee registration-response.json

echo ""
echo "📝 Registration response saved to registration-response.json"
echo ""
echo "Next steps:"
echo "1. Check the response for your agentIdentifier"
echo "2. Add it to agent-wrapper/.env as AGENT_IDENTIFIER=<your_identifier>"
echo "3. Restart the agent wrapper service" 