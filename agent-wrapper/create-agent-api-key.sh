#!/bin/bash

echo "🔑 Creating API key for agent operations..."

curl -X POST "http://localhost:3001/api/v1/api-key/" \
  -H "Content-Type: application/json" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -d '{
    "name": "Agent Wrapper Key",
    "permissions": [
      "PAYMENT_CREATE",
      "PAYMENT_READ", 
      "PAYMENT_UPDATE",
      "REGISTRY_CREATE",
      "REGISTRY_READ"
    ]
  }' | tee agent-api-key.json

echo ""
echo "📝 API key saved to agent-api-key.json"
echo "Update your agent-wrapper/.env with the new key" 