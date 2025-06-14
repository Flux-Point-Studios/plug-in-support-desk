#!/bin/bash

echo "🔍 Checking registration state for AI Support Agent..."
echo ""

# Read the registration ID from our saved response
if [ ! -f "registration-response.json" ]; then
    echo "❌ No registration-response.json found"
    exit 1
fi

# Extract the agent ID
AGENT_ID=$(cat registration-response.json | grep -o '"id":"cmbvgb97q000csafwnpp59vr6"' | cut -d'"' -f4)
echo "📋 Agent ID: $AGENT_ID"

# Extract the state from the registration response
STATE=$(cat registration-response.json | grep -o '"state":"[^"]*"' | cut -d'"' -f4)
echo "📊 Initial State: $STATE"
echo ""

# Query the Payment Service to check current registration status
echo "🔎 Checking current registration status..."

# Note: According to docs, we might need to query the registry service 
# to see if the agent has been successfully registered on-chain

# First, let's check if the agent appears in the registry
REGISTRY_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/registry-entry" \
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
if echo "$REGISTRY_RESPONSE" | grep -q '"AI Support Agent"'; then
    echo "✅ Agent successfully registered on-chain!"
    echo ""
    
    # Extract agent identifier
    AGENT_IDENTIFIER=$(echo "$REGISTRY_RESPONSE" | grep -o '"agentIdentifier":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$AGENT_IDENTIFIER" ]; then
        echo "🆔 Agent Identifier: $AGENT_IDENTIFIER"
        echo "$AGENT_IDENTIFIER" > agent-identifier.txt
        echo ""
        echo "🎉 Registration complete! Your agent is now live on Masumi."
        echo "💾 Agent identifier saved to agent-identifier.txt"
    fi
else
    echo "⏳ Agent not yet confirmed on-chain"
    echo ""
    echo "Current status: $STATE"
    echo ""
    echo "Possible reasons:"
    echo "1. Transaction is still being processed (can take 1-5 minutes)"
    echo "2. Transaction failed - check payment service logs"
    echo "3. Network issues prevented blockchain submission"
    echo ""
    
    # Check how long ago the registration was attempted
    echo "Registration was attempted at: $(cat registration-response.json | grep -o '"createdAt":"[^"]*"' | cut -d'"' -f4)"
    echo ""
    echo "💡 Tips:"
    echo "- If it's been over 5 minutes, the transaction may have failed"
    echo "- Check docker logs masumi-payment-service for errors"
    echo "- Ensure your selling wallet has sufficient ADA for fees"
fi

echo ""
echo "📝 Full registry response saved to state-check-response.json"
echo "$REGISTRY_RESPONSE" > state-check-response.json 