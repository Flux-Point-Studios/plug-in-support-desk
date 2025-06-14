#!/bin/bash

# Check registration status

echo "🔍 Checking registration status..."
echo ""

curl -X GET "http://localhost:3001/registry/?network=Preprod" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  | jq '.data.Assets[] | select(.name == "AI Support Agent")' \
  | tee registration-status.json

echo ""
echo "📝 Status saved to registration-status.json"
echo ""
echo "Look for:"
echo "- state: should be 'RegistrationConfirmed'"
echo "- agentIdentifier: this is what you need for your .env file" 