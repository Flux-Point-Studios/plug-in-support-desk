#!/bin/bash

# Register the AI Support Agent with new payment source
curl -X POST "http://localhost:3001/api/v1/registry/" \
  -H "token: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "network": "Preprod",
    "smartContractAddress": "addr_test1wq4tmx0g9agqn0ey2e3y72k5nf5xymeqawhvjmxfdt4a4qhhpd6j",
    "sellingWalletVkey": "addr_test1qzncpjrwwgugzwkhxg9sn4qu9pxcuy5m09hwq5u3h68cd2c224nmdd2elynq2caexzacfar09zyz4rfff9xwg2wpdfkqs54kja",
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