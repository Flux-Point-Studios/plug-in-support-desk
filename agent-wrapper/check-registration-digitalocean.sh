#!/bin/bash

# Check Registration Status on DigitalOcean

DROPLET_IP="159.203.90.91"
ADMIN_KEY="6db15c0fe770cad286d9c3c81e621844"

if [ -z "$1" ]; then
  echo "Usage: $0 <agent-id>"
  exit 1
fi

AGENT_ID=$1

echo "🔍 Checking registration status for agent: $AGENT_ID"
echo ""

# Check registry
RESPONSE=$(curl -s -X GET "http://$DROPLET_IP:3000/api/v1/registry-entry/?network=Preprod&agentId=$AGENT_ID" \
  -H "token: $ADMIN_KEY")

# Check if response is valid JSON
if echo "$RESPONSE" | jq '.' >/dev/null 2>&1; then
  STATUS=$(echo "$RESPONSE" | jq -r '.data.registryEntry[0].healthCheck' 2>/dev/null)
  
  if [ "$STATUS" = "true" ]; then
    echo "✅ Agent is registered and healthy!"
    echo ""
    echo "Full details:"
    echo "$RESPONSE" | jq '.data.registryEntry[0]'
  else
    echo "⏳ Registration is still processing..."
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.'
  fi
else
  echo "❌ Error checking status:"
  echo "$RESPONSE"
fi 