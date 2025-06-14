#!/bin/bash

echo "🧪 Testing Masumi Agent on Vercel"
echo ""

AGENT_URL="https://support-bot-builder.vercel.app/api/agent"

echo "1️⃣ Testing health endpoint..."
curl -s "$AGENT_URL/health" | python -m json.tool
echo ""

echo "2️⃣ Testing root endpoint..."
curl -s "$AGENT_URL/" | python -m json.tool
echo ""

echo "3️⃣ Testing availability..."
curl -s "$AGENT_URL/availability" | python -m json.tool
echo ""

echo "4️⃣ Testing input schema..."
curl -s "$AGENT_URL/input_schema" | python -m json.tool
echo ""

echo "5️⃣ Testing output schema..."
curl -s "$AGENT_URL/output_schema" | python -m json.tool
echo ""

echo "✅ If all endpoints return valid JSON, your agent is ready for registration!" 