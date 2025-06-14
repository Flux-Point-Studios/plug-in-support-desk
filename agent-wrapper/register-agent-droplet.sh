#!/bin/bash

# Register the AI Support Agent on DigitalOcean droplet
# Using the new payment source and seller wallet

echo "Registering AI Support Agent on DigitalOcean droplet..."

curl -X POST "http://159.203.90.91:3001/api/v1/registry/" \
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
  }' | jq

echo ""
echo "Registration request sent. Check the response above." 