#!/bin/bash

echo "🚀 Setting up Vercel environment variables for Masumi Agent"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm i -g vercel"
    exit 1
fi

echo "📝 This script will help you set the required environment variables in Vercel"
echo ""

# Environment variables to set
echo "Setting the following environment variables:"
echo "- FLUX_POINT_API_URL"
echo "- FLUX_POINT_API_KEY" 
echo "- MASUMI_PAYMENT_URL"
echo "- MASUMI_API_KEY"
echo "- AGENT_IDENTIFIER (after registration)"
echo ""

# Set Flux Point API variables
vercel env add FLUX_POINT_API_URL production <<< "https://api.fluxpointstudios.com/chat"
vercel env add FLUX_POINT_API_KEY production <<< "6c3bb3eedc9441978bbc44af20f0b82d"

# Set Masumi variables (using production Masumi services)
vercel env add MASUMI_PAYMENT_URL production <<< "https://payment.masumi.network"
vercel env add MASUMI_API_KEY production <<< "6db15c0fe770cad286d9c3c81e621844"

echo ""
echo "✅ Environment variables set!"
echo ""
echo "Next steps:"
echo "1. Deploy your changes: git push (or vercel --prod)"
echo "2. Test the agent API: https://support-bot-builder.vercel.app/api/agent/health"
echo "3. Register the agent with Masumi using the public URL"
echo "4. Update AGENT_IDENTIFIER in Vercel after registration" 