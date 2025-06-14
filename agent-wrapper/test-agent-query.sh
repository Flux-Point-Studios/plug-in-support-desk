#!/bin/bash

echo "=== TESTING MASUMI AGENT QUERY WORKFLOW ==="
echo "Date: $(date)"
echo ""

# Test the Website-Builder agent (seems most general purpose)
AGENT_URL="https://masumiverse-website.onrender.com"
AGENT_NAME="Website-Builder"

echo "1. Testing agent availability..."
AVAILABILITY=$(curl -s -o /dev/null -w "%{http_code}" "$AGENT_URL/availability" --max-time 10)
echo "   HTTP Status: $AVAILABILITY"

if [ "$AVAILABILITY" = "200" ]; then
  echo "   ✅ Agent is available!"
else
  echo "   ⚠️  Agent returned status $AVAILABILITY"
fi

echo ""
echo "2. Checking agent input schema..."
curl -s --max-time 10 "$AGENT_URL/input_schema" | jq '.' 2>/dev/null || echo "   Schema endpoint not available or returned non-JSON"

echo ""
echo "3. Testing job initiation..."
JOB_RESPONSE=$(curl -s --max-time 10 -X POST "$AGENT_URL/start_job" \
  -H "Content-Type: application/json" \
  -d '{
    "input_data": [
      {"key": "text", "value": "Hello, can you help me understand how to build a simple landing page?"}
    ]
  }' 2>/dev/null)

echo "   Job response:"
echo "$JOB_RESPONSE" | jq '.' 2>/dev/null || echo "   $JOB_RESPONSE"

# Extract job_id if available
JOB_ID=$(echo "$JOB_RESPONSE" | jq -r '.job_id // empty' 2>/dev/null)

if [ -n "$JOB_ID" ]; then
  echo ""
  echo "4. Job initiated with ID: $JOB_ID"
  echo "   Waiting 5 seconds before checking status..."
  sleep 5
  
  echo ""
  echo "5. Checking job status..."
  curl -s --max-time 10 "$AGENT_URL/status?job_id=$JOB_ID" | jq '.' 2>/dev/null || echo "   Status check failed"
else
  echo ""
  echo "4. ❌ Could not extract job_id from response"
fi

echo ""
echo "=== AGENT QUERY TEST COMPLETE ==="
echo ""
echo "📝 Notes:"
echo "   - If the agent requires payment before processing, the job will remain pending"
echo "   - This is expected behavior for Masumi agents"
echo "   - The frontend will handle payment simulation or real payment processing" 