#!/bin/bash

echo "🔍 Querying ALL agents in the registry..."
echo ""

# Query the registry for ALL agents
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/registry-entry" \
  -H "Content-Type: application/json" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -d '{
    "network": "Preprod",
    "limit": 50
  }')

# Save the response
echo "$RESPONSE" > all-agents-response.json

# Count total agents
TOTAL_AGENTS=$(echo "$RESPONSE" | grep -o '"agentIdentifier"' | wc -l)
echo "📊 Total agents in registry: $TOTAL_AGENTS"
echo ""

# Look for our specific agent
if echo "$RESPONSE" | grep -q '"AI Support Agent"'; then
    echo "✅ Found 'AI Support Agent' in registry!"
    AGENT_IDENTIFIER=$(echo "$RESPONSE" | grep -B5 -A5 '"AI Support Agent"' | grep -o '"agentIdentifier":"[^"]*"' | cut -d'"' -f4)
    echo "🆔 Agent Identifier: $AGENT_IDENTIFIER"
else
    echo "❌ 'AI Support Agent' not found in registry yet"
fi

echo ""

# Show all agent names
echo "📋 All registered agents:"
echo "$RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | sort | uniq | while read name; do
    echo "  - $name"
done

echo ""
echo "📝 Full response saved to all-agents-response.json" 