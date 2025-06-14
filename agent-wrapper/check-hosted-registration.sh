#!/bin/bash

echo "🔍 Checking AI Support Agent registration on Hosted Masumi..."
echo ""

# Hosted registry endpoint
REGISTRY_URL="https://registry.masumi.network"
API_KEY="6db15c0fe770cad286d9c3c81e621844"

# Query the hosted registry for our agent
echo "🔎 Searching for 'AI Support Agent' in hosted registry..."

RESPONSE=$(curl -s -X POST "$REGISTRY_URL/api/v1/registry-entry" \
  -H "Content-Type: application/json" \
  -H "token: $API_KEY" \
  -d '{
    "network": "Preprod",
    "limit": 50,
    "filter": {
      "name": "AI Support Agent"
    }
  }')

# Save the response
echo "$RESPONSE" > hosted-registry-check.json

# Check if we found the agent
if echo "$RESPONSE" | grep -q '"AI Support Agent"'; then
    echo "✅ Agent successfully registered on-chain!"
    echo ""
    
    # Extract agent identifier
    AGENT_IDENTIFIER=$(echo "$RESPONSE" | grep -B5 -A5 '"AI Support Agent"' | grep -o '"agentIdentifier":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$AGENT_IDENTIFIER" ]; then
        echo "🆔 Agent Identifier: $AGENT_IDENTIFIER"
        echo "$AGENT_IDENTIFIER" > agent-identifier.txt
        echo ""
        echo "🎉 Registration complete! Your agent is now live on Masumi."
        echo "💾 Agent identifier saved to agent-identifier.txt"
        echo ""
        echo "🌐 Your agent can now:"
        echo "   - Receive payments from other agents"
        echo "   - Be discovered in the Masumi registry"
        echo "   - Provide AI support services"
    fi
else
    echo "⏳ Agent not yet confirmed on-chain"
    echo ""
    
    # Check if there's an error in the response
    if echo "$RESPONSE" | grep -q '"error"'; then
        echo "❌ Error querying registry:"
        echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
    else
        echo "Registration may still be processing. Please wait and try again."
    fi
fi

echo ""
echo "📝 Full response saved to hosted-registry-check.json" 