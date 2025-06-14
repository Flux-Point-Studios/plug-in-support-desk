#!/bin/bash

# Script to check agent registration status

echo "🔍 Checking AI Support Agent registration status..."
echo ""

# Check if we have a registration response file
if [ ! -f "registration-response.json" ]; then
    echo "❌ No registration-response.json found. Please run register-agent-simple.sh first."
    exit 1
fi

# Extract the agent ID from the registration response (nested in data object)
# Try multiple methods to extract the ID
AGENT_ID=$(cat registration-response.json | grep -o '"data":{[^}]*"id":"[^"]*"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

# If that doesn't work, try a more direct approach
if [ -z "$AGENT_ID" ]; then
    # Extract the specific ID we know is there
    AGENT_ID=$(cat registration-response.json | grep -o 'cmbvgb97q000csafwnpp59vr6' | head -1)
fi

if [ -z "$AGENT_ID" ]; then
    echo "❌ Could not find agent ID in registration response"
    exit 1
fi

echo "📋 Agent ID: $AGENT_ID"
echo ""

# Query the registry for our agent
echo "🔎 Searching for agent in registry..."

RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/registry-entry" \
  -H "Content-Type: application/json" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -d '{
    "network": "Preprod",
    "limit": 50,
    "filter": {
      "name": "AI Support Agent"
    }
  }')

# Check if we found the agent
if echo "$RESPONSE" | grep -q '"AI Support Agent"'; then
    echo "✅ Agent found in registry!"
    echo ""
    
    # Extract agent identifier
    AGENT_IDENTIFIER=$(echo "$RESPONSE" | grep -o '"agentIdentifier":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$AGENT_IDENTIFIER" ]; then
        echo "🆔 Agent Identifier: $AGENT_IDENTIFIER"
        echo ""
        echo "🎉 Registration confirmed on-chain!"
        
        # Save the identifier to a file
        echo "$AGENT_IDENTIFIER" > agent-identifier.txt
        echo ""
        echo "💾 Agent identifier saved to agent-identifier.txt"
    fi
else
    echo "⏳ Agent not yet confirmed in registry"
    echo "   Registration may still be processing on-chain."
    echo "   Please wait a few minutes and try again."
fi

echo ""
echo "📝 Full response saved to check-status-response.json"
echo "$RESPONSE" | python -m json.tool > check-status-response.json 2>/dev/null || echo "$RESPONSE" > check-status-response.json 