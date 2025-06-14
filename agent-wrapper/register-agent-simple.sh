#!/bin/bash

# Simple registration script using JSON file

echo "🚀 Registering AI Support Agent with Masumi..."
echo ""

curl -X POST "http://localhost:3001/api/v1/registry/" \
  -H "Content-Type: application/json" \
  -H "token: 6db15c0fe770cad286d9c3c81e621844" \
  -d @register-payload.json \
  | tee registration-response.json

echo ""
echo "📝 Registration response saved to registration-response.json" 