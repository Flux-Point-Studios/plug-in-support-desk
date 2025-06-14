#!/bin/bash

# Script to provide a complete summary of the agent registration

echo "=================================="
echo "🤖 AI AGENT REGISTRATION SUMMARY"
echo "=================================="
echo ""

# Check registration response
if [ -f "registration-response.json" ]; then
    echo "📄 Registration Response:"
    echo "------------------------"
    
    # Extract key fields
    AGENT_ID=$(cat registration-response.json | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    AGENT_NAME=$(cat registration-response.json | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    STATE=$(cat registration-response.json | grep -o '"state":"[^"]*"' | cut -d'"' -f4)
    API_URL=$(cat registration-response.json | grep -o '"apiBaseUrl":"[^"]*"' | cut -d'"' -f4)
    
    echo "  • ID: $AGENT_ID"
    echo "  • Name: $AGENT_NAME"
    echo "  • State: $STATE"
    echo "  • API URL: $API_URL"
else
    echo "❌ No registration response found"
    echo "   Run ./register-agent-simple.sh first"
    exit 1
fi

echo ""
echo "💰 Payment Details:"
echo "------------------"
# Extract pricing from registration response
AMOUNT=$(cat registration-response.json | grep -o '"amount":"[^"]*"' | cut -d'"' -f4)
if [ ! -z "$AMOUNT" ]; then
    # Convert lovelace to ADA (1 ADA = 1,000,000 lovelace)
    ADA_AMOUNT=$(echo "scale=2; $AMOUNT / 1000000" | bc 2>/dev/null || echo "$AMOUNT lovelace")
    echo "  • Price per call: $ADA_AMOUNT ADA"
fi

echo ""
echo "🔍 Checking On-Chain Status..."
echo "------------------------------"

# Query the registry
REGISTRY_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/registry-entry" \
  -H "Content-Type: application/json" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -d "{\"network\":\"Preprod\",\"limit\":10,\"filter\":{\"name\":\"$AGENT_NAME\"}}")

if echo "$REGISTRY_RESPONSE" | grep -q "\"$AGENT_NAME\""; then
    echo "✅ Agent confirmed on-chain!"
    
    # Extract agent identifier
    AGENT_IDENTIFIER=$(echo "$REGISTRY_RESPONSE" | grep -o '"agentIdentifier":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$AGENT_IDENTIFIER" ]; then
        echo ""
        echo "🆔 On-Chain Agent Identifier:"
        echo "  $AGENT_IDENTIFIER"
        
        # Save to file
        echo "$AGENT_IDENTIFIER" > agent-identifier.txt
    fi
else
    echo "⏳ Not yet confirmed on-chain"
    echo "   (This can take 1-5 minutes)"
fi

echo ""
echo "📁 Generated Files:"
echo "------------------"
[ -f "registration-response.json" ] && echo "  ✓ registration-response.json"
[ -f "agent-identifier.txt" ] && echo "  ✓ agent-identifier.txt"
[ -f "check-status-response.json" ] && echo "  ✓ check-status-response.json"

echo ""
echo "🚀 Next Steps:"
echo "--------------"
if [ -f "agent-identifier.txt" ]; then
    echo "  1. ✅ Registration complete!"
    echo "  2. Update your .env with the agent identifier"
    echo "  3. Start your agent service"
    echo "  4. Test the payment flow"
else
    echo "  1. Wait for on-chain confirmation"
    echo "  2. Run ./check-registration-status.sh to check again"
    echo "  3. Once confirmed, update your .env with the agent identifier"
fi

echo ""
echo "==================================" 