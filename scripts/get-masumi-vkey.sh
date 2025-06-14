#!/bin/bash

# Get Masumi Selling Wallet VKey

echo -e "\033[32m🔑 Fetching Masumi Selling Wallet VKey...\033[0m"

# Check if admin key was provided as parameter
ADMIN_KEY=$1

if [ -z "$ADMIN_KEY" ]; then
    # Try to read from masumi-services/.env
    if [ -f "masumi-services/.env" ]; then
        ADMIN_KEY=$(grep 'ADMIN_KEY=' masumi-services/.env | cut -d'"' -f2)
        if [ ! -z "$ADMIN_KEY" ]; then
            echo -e "\033[36m📋 Using admin key from .env file\033[0m"
        fi
    fi
    
    # If still no key, prompt user
    if [ -z "$ADMIN_KEY" ]; then
        read -p "Please enter your ADMIN_KEY: " ADMIN_KEY
    fi
fi

# Fetch the wallet info
echo -e "\033[33m📡 Fetching wallet information...\033[0m"

RESPONSE=$(curl -s -X GET "http://localhost:3001/api/v1/wallet?walletType=Selling&id=1" \
    -H "token: $ADMIN_KEY" \
    -H "Content-Type: application/json")

# Check if curl was successful
if [ $? -eq 0 ]; then
    # Extract vkey and address using jq or grep
    if command -v jq &> /dev/null; then
        VKEY=$(echo "$RESPONSE" | jq -r '.data.walletVkey')
        ADDRESS=$(echo "$RESPONSE" | jq -r '.data.walletAddress')
    else
        # Fallback to grep if jq is not available
        VKEY=$(echo "$RESPONSE" | grep -o '"walletVkey":"[^"]*"' | cut -d'"' -f4)
        ADDRESS=$(echo "$RESPONSE" | grep -o '"walletAddress":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ ! -z "$VKEY" ] && [ "$VKEY" != "null" ]; then
        echo ""
        echo -e "\033[32m✅ Successfully retrieved wallet information!\033[0m"
        echo ""
        echo -e "\033[36m🔐 Selling Wallet VKey:\033[0m"
        echo "   $VKEY"
        echo ""
        echo -e "\033[36m📍 Wallet Address:\033[0m"
        echo "   $ADDRESS"
        echo ""
        
        # Verify it's a testnet address
        if [[ "$ADDRESS" == addr_test* ]]; then
            echo -e "\033[32m✅ Confirmed: This is a Preprod testnet wallet\033[0m"
        else
            echo -e "\033[33m⚠️  Warning: This doesn't appear to be a testnet address\033[0m"
        fi
        
        echo ""
        echo -e "\033[33m📝 Add this to your .env file:\033[0m"
        echo "   VITE_MASUMI_VKEY=$VKEY"
        echo ""
        
        # Optionally append to .env file
        read -p "Would you like to add this to your .env file? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ -f ".env" ]; then
                # Check if VITE_MASUMI_VKEY already exists
                if grep -q "VITE_MASUMI_VKEY=" .env; then
                    echo -e "\033[33m⚠️  VITE_MASUMI_VKEY already exists in .env. Updating...\033[0m"
                    sed -i.bak "s/VITE_MASUMI_VKEY=.*/VITE_MASUMI_VKEY=$VKEY/" .env
                else
                    echo "VITE_MASUMI_VKEY=$VKEY" >> .env
                fi
                echo -e "\033[32m✅ Added to .env file\033[0m"
            else
                echo -e "\033[33m⚠️  .env file not found. Please add manually.\033[0m"
            fi
        fi
    else
        echo -e "\033[31m❌ No wallet vkey found in response\033[0m"
        echo "$RESPONSE"
    fi
else
    echo -e "\033[31m❌ Error fetching wallet info\033[0m"
    echo ""
    echo -e "\033[33mMake sure:\033[0m"
    echo "  1. Masumi services are running (docker compose ps)"
    echo "  2. Your admin key is correct"
    echo "  3. The Payment Service is accessible at http://localhost:3001"
    echo ""
    echo -e "\033[36mYou can also check via the Admin UI:\033[0m"
    echo "  1. Open http://localhost:3001/admin"
    echo "  2. Login with your ADMIN_KEY"
    echo "  3. Go to Wallets → Selling → Copy the Public vkey"
fi 