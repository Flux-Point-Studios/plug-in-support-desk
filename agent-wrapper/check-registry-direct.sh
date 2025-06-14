#!/bin/bash

echo "🔍 Checking AI Support Agent registration directly in registry..."
echo ""

# Query the registry for our agent
echo "🔎 Searching for 'AI Support Agent' in registry..."

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

# Save the raw response
echo "$RESPONSE" > registry-query-response.json

# Check if we got any agents back
if echo "$RESPONSE" | grep -q '"agentIdentifier"'; then
    echo "✅ Found agent(s) in registry!"
    echo ""
    
    # Count how many agents we found
    AGENT_COUNT=$(echo "$RESPONSE" | grep -o '"agentIdentifier"' | wc -l)
    echo "📊 Found $AGENT_COUNT agent(s) matching the search"
    echo ""
    
    # Try to extract and display agent details
    if echo "$RESPONSE" | grep -q '"AI Support Agent"'; then
        echo "✅ Your 'AI Support Agent' is registered on-chain!"
        
        # Try to extract the agent identifier
        AGENT_IDENTIFIER=$(echo "$RESPONSE" | grep -o '"agentIdentifier":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ ! -z "$AGENT_IDENTIFIER" ]; then
            echo "🆔 Agent Identifier: $AGENT_IDENTIFIER"
            echo "$AGENT_IDENTIFIER" > agent-identifier.txt
            echo "💾 Agent identifier saved to agent-identifier.txt"
        fi
    fi
else
    echo "❌ No agents found in registry"
    echo ""
    echo "Possible reasons:"
    echo "1. Registration is still being processed on-chain (can take 5-10 minutes)"
    echo "2. Registry service is not running on port 3000"
    echo "3. There was an error during registration"
    echo ""
    echo "Raw response:"
    echo "$RESPONSE"
fi

echo ""
echo "📝 Full response saved to registry-query-response.json" 