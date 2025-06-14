#!/bin/bash

# Setup script for Masumi services

echo "🚀 Setting up Masumi services..."

# Navigate to masumi-services directory
cd masumi-services

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate encryption key
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    echo "🔐 Generated encryption key: $ENCRYPTION_KEY"
    
    # Generate admin key
    ADMIN_KEY=$(openssl rand -hex 16)
    echo "🔑 Generated admin key: $ADMIN_KEY"
    
    # Update .env file with generated keys
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/ENCRYPTION_KEY=\".*\"/ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"/" .env
        sed -i '' "s/ADMIN_KEY=\".*\"/ADMIN_KEY=\"$ADMIN_KEY\"/" .env
    else
        # Linux
        sed -i "s/ENCRYPTION_KEY=\".*\"/ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"/" .env
        sed -i "s/ADMIN_KEY=\".*\"/ADMIN_KEY=\"$ADMIN_KEY\"/" .env
    fi
    
    echo ""
    echo "⚠️  IMPORTANT: Please update the following in masumi-services/.env:"
    echo "   - BLOCKFROST_API_KEY_PREPROD (get from https://blockfrost.io/)"
    echo ""
    echo "📋 Your admin key is: $ADMIN_KEY"
    echo "   Save this key! You'll need it to generate API keys."
    echo ""
else
    echo "✅ .env file already exists"
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker compose ps

# Generate PAY-scoped API key
echo ""
echo "🔑 To generate a PAY-scoped API key, run:"
echo "   ./scripts/generate-masumi-key.sh"
echo ""
echo "✅ Masumi services setup complete!"
echo "   Registry: http://localhost:3000/docs"
echo "   Payment: http://localhost:3001/docs" 