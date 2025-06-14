#!/bin/bash

AGENT_ID="cmbw7imyc0014rtbsjanhx6ui"
TOKEN="6db15c0fe770cad286d9c3c81e621844"

echo "=== MONITORING MAINNET REGISTRATION ==="
echo "Agent ID: $AGENT_ID"
echo "Start time: $(date)"
echo ""

for i in {1..20}; do
  echo "--- Check $i/20 ($(date)) ---"
  
  # Check payment source status
  echo "Payment Source Status:"
  curl -s -X GET "http://159.203.90.91:3001/api/v1/extended-payment-sources" \
    -H "token: $TOKEN" \
    -H "Content-Type: application/json" | jq '.data.ExtendedPaymentSources[] | select(.network == "Mainnet") | {id, network, status, lastCheckedAt}'
  
  echo ""
  
  # Check registry
  echo "Registry Status:"
  RESULT=$(curl -s -X POST "http://159.203.90.91:3000/api/v1/registry-entry/" \
    -H "token: $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"network": "Mainnet"}' 2>/dev/null)
  
  COUNT=$(echo "$RESULT" | jq '.data.entries | length' 2>/dev/null || echo "0")
  echo "   Total Mainnet agents: $COUNT"
  
  if [ "$COUNT" -gt 0 ]; then
    echo "   Agent details:"
    echo "$RESULT" | jq '.data.entries[] | {name, state, identifier}'
    
    # Check if our specific agent is registered and active
    OUR_AGENT=$(echo "$RESULT" | jq -r '.data.entries[] | select(.identifier == "'$AGENT_ID'") | .state' 2>/dev/null || echo "none")
    
    if [ "$OUR_AGENT" != "none" ] && [ "$OUR_AGENT" != "null" ]; then
      echo ""
      echo "🎉 SUCCESS! Our agent is registered with state: $OUR_AGENT"
      
      if [ "$OUR_AGENT" = "Active" ]; then
        echo ""
        echo "✅ REGISTRATION COMPLETE!"
        echo "Agent is now live on Mainnet and ready to receive payments!"
        break
      fi
    fi
  fi
  
  echo ""
  
  if [ $i -lt 20 ]; then
    echo "Waiting 30 seconds..."
    sleep 30
  fi
done

echo ""
echo "=== MONITORING COMPLETED ==="
echo "End time: $(date)" 