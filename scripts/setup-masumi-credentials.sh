#!/bin/bash

# Setup Masumi Credentials
# Fetches both VITE_MASUMI_API_KEY and VITE_MASUMI_VKEY in one go

echo -e "\033[36m🚀 Masumi Credentials Setup\033[0m"
echo -e "\033[90m   This script will fetch both required Masumi values:\033[0m"
echo -e "\033[90m   - PAY-scoped API Key (for agent registration)\033[0m"
echo -e "\033[90m   - Selling Wallet VKey (for receiving payments)\033[0m"
echo ""

# Check if admin key was provided as parameter
ADMIN_KEY=$1

if [ -z "$ADMIN_KEY" ]; then
    # Try to read from masumi-services/.env
    if [ -f "masumi-services/.env" ]; then
        ADMIN_KEY=$(grep 'ADMIN_KEY=' masumi-services/.env | cut -d'"' -f2)
        if [ ! -z "$ADMIN_KEY" ]; then
            echo -e "\033[36m📋 Using admin key from masumi-services/.env\033[0m"
        fi
    fi
    
    # If still no key, prompt user
    if [ -z "$ADMIN_KEY" ]; then
        read -p "Please enter your ADMIN_KEY: " ADMIN_KEY
    fi
fi

# Initialize variables
VKEY=""
ADDRESS=""
API_KEY=""
ERRORS=()

# Step 1: Fetch Selling Wallet VKey
echo ""
echo -e "\033[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "\033[33m📍 Step 1: Fetching Selling Wallet VKey\033[0m"
echo -e "\033[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"

WALLET_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/v1/wallet?walletType=Selling&id=1" \
    -H "token: $ADMIN_KEY" \
    -H "Content-Type: application/json")

if [ $? -eq 0 ]; then
    # Extract vkey and address using jq or grep
    if command -v jq &> /dev/null; then
        VKEY=$(echo "$WALLET_RESPONSE" | jq -r '.data.walletVkey')
        ADDRESS=$(echo "$WALLET_RESPONSE" | jq -r '.data.walletAddress')
    else
        # Fallback to grep if jq is not available
        VKEY=$(echo "$WALLET_RESPONSE" | grep -o '"walletVkey":"[^"]*"' | cut -d'"' -f4)
        ADDRESS=$(echo "$WALLET_RESPONSE" | grep -o '"walletAddress":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ ! -z "$VKEY" ] && [ "$VKEY" != "null" ]; then
        echo -e "\033[32m✅ Successfully retrieved wallet information!\033[0m"
        echo "🔐 VKey: $VKEY"
        echo "📍 Address: $ADDRESS"
        
        # Verify it's a testnet address
        if [[ "$ADDRESS" == addr_test* ]]; then
            echo -e "\033[32m✅ Confirmed: Preprod testnet wallet\033[0m"
        else
            echo -e "\033[33m⚠️  Warning: Not a testnet address\033[0m"
        fi
    else
        ERRORS+=("Failed to get wallet vkey")
        echo -e "\033[31m❌ No wallet vkey found in response\033[0m"
    fi
else
    ERRORS+=("Wallet fetch error: curl failed")
    echo -e "\033[31m❌ Error fetching wallet\033[0m"
fi

# Step 2: Generate PAY-scoped API Key
echo ""
echo -e "\033[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "\033[33m🔑 Step 2: Generating PAY-scoped API Key\033[0m"
echo -e "\033[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"

API_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/v1/api-key" \
    -H "Content-Type: application/json" \
    -H "token: $ADMIN_KEY" \
    -d '{
        "permission": "ReadAndPay",
        "usageLimited": false,
        "networkLimit": ["Preprod"]
    }')

if [ $? -eq 0 ]; then
    # Extract the token using jq or grep
    if command -v jq &> /dev/null; then
        API_KEY=$(echo "$API_RESPONSE" | jq -r '.data.token')
        PERMISSION=$(echo "$API_RESPONSE" | jq -r '.data.permission')
    else
        # Fallback to grep if jq is not available
        API_KEY=$(echo "$API_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        PERMISSION=$(echo "$API_RESPONSE" | grep -o '"permission":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ ! -z "$API_KEY" ] && [ "$API_KEY" != "null" ]; then
        echo -e "\033[32m✅ Successfully generated API key!\033[0m"
        echo "🔐 API Key: $API_KEY"
        echo "📋 Permission: $PERMISSION (PAY scope)"
    else
        ERRORS+=("Failed to generate API key")
        echo -e "\033[31m❌ No API key in response\033[0m"
    fi
else
    ERRORS+=("API key generation error: curl failed")
    echo -e "\033[31m❌ Error generating API key\033[0m"
fi

# Summary
echo ""
echo -e "\033[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "\033[36m📊 Summary\033[0m"
echo -e "\033[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"

if [ ${#ERRORS[@]} -eq 0 ] && [ ! -z "$VKEY" ] && [ ! -z "$API_KEY" ]; then
    echo -e "\033[32m✅ All credentials retrieved successfully!\033[0m"
    echo ""
    echo -e "\033[33m📝 Add these to your .env file:\033[0m"
    echo ""
    echo "VITE_MASUMI_API_KEY=$API_KEY"
    echo "VITE_MASUMI_VKEY=$VKEY"
    echo ""
    
    # Offer to update .env file
    read -p "Would you like to update your .env file automatically? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ENV_FILE=".env"
        UPDATED=0
        
        if [ -f "$ENV_FILE" ]; then
            # Backup the file
            cp "$ENV_FILE" "$ENV_FILE.bak"
            
            # Update API Key
            if grep -q "VITE_MASUMI_API_KEY=" "$ENV_FILE"; then
                sed -i.tmp "s/VITE_MASUMI_API_KEY=.*/VITE_MASUMI_API_KEY=$API_KEY/" "$ENV_FILE"
                ((UPDATED++))
            else
                echo "VITE_MASUMI_API_KEY=$API_KEY" >> "$ENV_FILE"
                ((UPDATED++))
            fi
            
            # Update VKey
            if grep -q "VITE_MASUMI_VKEY=" "$ENV_FILE"; then
                sed -i.tmp "s/VITE_MASUMI_VKEY=.*/VITE_MASUMI_VKEY=$VKEY/" "$ENV_FILE"
                ((UPDATED++))
            else
                echo "VITE_MASUMI_VKEY=$VKEY" >> "$ENV_FILE"
                ((UPDATED++))
            fi
            
            # Clean up temp files
            rm -f "$ENV_FILE.tmp"
            
            echo -e "\033[32m✅ Updated $UPDATED values in .env file\033[0m"
        else
            # Create new .env file
            cat > "$ENV_FILE" <<EOF
VITE_MASUMI_API_KEY=$API_KEY
VITE_MASUMI_VKEY=$VKEY
EOF
            echo -e "\033[32m✅ Created new .env file with credentials\033[0m"
        fi
    fi
else
    echo -e "\033[31m❌ Errors encountered:\033[0m"
    for error in "${ERRORS[@]}"; do
        echo "   - $error"
    done
    echo ""
    echo -e "\033[33m💡 Troubleshooting tips:\033[0m"
    echo "   1. Check if Masumi services are running: docker compose ps"
    echo "   2. Verify your admin key has ADMIN scope"
    echo "   3. Try the Admin UI at http://localhost:3001/admin"
    echo "   4. Check the documentation you provided for manual steps"
fi

echo ""
echo -e "\033[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m" 