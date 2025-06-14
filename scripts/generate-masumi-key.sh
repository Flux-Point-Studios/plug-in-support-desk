#!/bin/bash

# Generate PAY-scoped API key for Masumi services
# Creates an API key with ReadAndPay permission for agent registration

echo -e "\033[32m🔑 Generating PAY-scoped API key for Masumi services...\033[0m"
echo -e "\033[36m   This key allows payment operations and agent registration\033[0m"
echo ""

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

# Create the API key with PAY scope (ReadAndPay permission)
echo -e "\033[33m📡 Calling Masumi Payment Service API...\033[0m"
echo -e "\033[90m   POST http://localhost:3001/api/v1/api-key\033[0m"
echo ""

# Make the request
RESPONSE=$(curl -s -X POST "http://localhost:3001/api/v1/api-key" \
    -H "Content-Type: application/json" \
    -H "token: $ADMIN_KEY" \
    -d '{
        "permission": "ReadAndPay",
        "usageLimited": false,
        "networkLimit": ["Preprod"]
    }')

# Check if curl was successful
if [ $? -eq 0 ]; then
    # Extract the token using jq or grep
    if command -v jq &> /dev/null; then
        TOKEN=$(echo "$RESPONSE" | jq -r '.data.token')
        PERMISSION=$(echo "$RESPONSE" | jq -r '.data.permission')
        NETWORK=$(echo "$RESPONSE" | jq -r '.data.networkLimit[]')
        USAGE_LIMITED=$(echo "$RESPONSE" | jq -r '.data.usageLimited')
    else
        # Fallback to grep if jq is not available
        TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        PERMISSION=$(echo "$RESPONSE" | grep -o '"permission":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "\033[32m✅ PAY-scoped API key generated successfully!\033[0m"
        echo ""
        echo -e "\033[36m🔐 Your PAY API Key:\033[0m"
        echo "   $TOKEN"
        echo ""
        
        if [ ! -z "$PERMISSION" ]; then
            echo -e "\033[36m📋 Key Details:\033[0m"
            echo "   Permission: $PERMISSION (PAY scope)"
            [ ! -z "$NETWORK" ] && echo "   Network: $NETWORK"
            [ ! -z "$USAGE_LIMITED" ] && echo "   Usage Limited: $USAGE_LIMITED"
            echo ""
        fi
        
        echo -e "\033[33m📝 Add this to your .env file:\033[0m"
        echo "   VITE_MASUMI_API_KEY=$TOKEN"
        echo ""
        
        # Optionally append to .env file
        read -p "Would you like to add this to your .env file? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ -f ".env" ]; then
                # Check if VITE_MASUMI_API_KEY already exists
                if grep -q "VITE_MASUMI_API_KEY=" .env; then
                    echo -e "\033[33m⚠️  VITE_MASUMI_API_KEY already exists in .env. Updating...\033[0m"
                    sed -i.bak "s/VITE_MASUMI_API_KEY=.*/VITE_MASUMI_API_KEY=$TOKEN/" .env
                else
                    echo "VITE_MASUMI_API_KEY=$TOKEN" >> .env
                fi
                echo -e "\033[32m✅ Added to .env file\033[0m"
            else
                echo -e "\033[33m⚠️  .env file not found. Please add manually.\033[0m"
            fi
        fi
        
        echo ""
        echo -e "\033[33m💡 Note: This PAY-scope key has limited permissions:\033[0m"
        echo -e "\033[32m   ✅ Can create payments and register agents\033[0m"
        echo -e "\033[31m   ❌ Cannot create new API keys or wallets\033[0m"
        echo -e "\033[36m   Keep it secure but it's safer than an ADMIN key\033[0m"
    else
        echo -e "\033[31m❌ Unexpected response format:\033[0m"
        echo "$RESPONSE"
        
        # Check for common error patterns
        if echo "$RESPONSE" | grep -q "401"; then
            echo ""
            echo -e "\033[33m⚠️  401 Unauthorized: Admin key might be wrong or lacks ADMIN permission\033[0m"
        elif echo "$RESPONSE" | grep -q "403"; then
            echo ""
            echo -e "\033[33m⚠️  403 Forbidden: Make sure to use 'token:' header, not 'Authorization:'\033[0m"
        fi
    fi
else
    echo -e "\033[31m❌ Error generating API key\033[0m"
    echo ""
    echo -e "\033[33mCommon issues:\033[0m"
    echo "  1. 401 Unauthorized: Wrong admin key (must have ADMIN scope to create keys)"
    echo "  2. 403 Forbidden: Using wrong header (must be 'token:' not 'Authorization:')"
    echo "  3. Connection error: Masumi services not running (check: docker compose ps)"
    echo "  4. 404 Not Found: Wrong endpoint (should be /api/v1/api-key)"
    echo ""
    echo -e "\033[36mYou can also use the Admin UI:\033[0m"
    echo "  1. Open http://localhost:3001/admin"
    echo "  2. Login with your ADMIN_KEY"
    echo "  3. Go to API Keys → New Key"
    echo "  4. Choose Permission = ReadAndPay"
    echo "  5. Keep networkLimit = Preprod"
    echo "  6. Click Create"
fi 