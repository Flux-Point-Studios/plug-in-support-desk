#!/bin/bash

echo "🚀 Registering AI Support Agent with Hosted Masumi Services..."
echo ""

# Hosted Masumi endpoints
PAYMENT_URL="https://payment.masumi.network"
REGISTRY_URL="https://registry.masumi.network"

# Your API key (same one works for hosted services)
API_KEY="6db15c0fe770cad286d9c3c81e621844"

echo "📡 Using hosted Masumi services:"
echo "   Payment Service: $PAYMENT_URL"
echo "   Registry Service: $REGISTRY_URL"
echo ""

# Check if register-payload.json exists
if [ ! -f "register-payload.json" ]; then
    echo "❌ register-payload.json not found!"
    exit 1
fi

echo "📝 Submitting registration..."
echo ""

# Register the agent using the hosted payment service
RESPONSE=$(curl -s -X POST "$PAYMENT_URL/api/v1/registry/" \
  -H "Content-Type: application/json" \
  -H "token: $API_KEY" \
  -d @register-payload.json)

# Save the response
echo "$RESPONSE" > hosted-registration-response.json

# Check if registration was successful
if echo "$RESPONSE" | grep -q '"status":"success"'; then
    echo "✅ Registration submitted successfully!"
    echo ""
    
    # Extract the agent ID
    AGENT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "📋 Agent ID: $AGENT_ID"
    echo ""
    
    # Extract the state
    STATE=$(echo "$RESPONSE" | grep -o '"state":"[^"]*"' | cut -d'"' -f4)
    echo "📊 Initial State: $STATE"
    echo ""
    
    echo "⏳ Registration will be processed on-chain. This can take 1-5 minutes."
    echo "   Use check-hosted-registration.sh to check status."
else
    echo "❌ Registration failed!"
    echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
fi

echo ""
echo "📝 Full response saved to hosted-registration-response.json" 