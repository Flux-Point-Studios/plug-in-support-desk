# Setup Masumi Credentials
# Fetches both VITE_MASUMI_API_KEY and VITE_MASUMI_VKEY in one go

param(
    [string]$AdminKey
)

Write-Host "🚀 Masumi Credentials Setup" -ForegroundColor Cyan
Write-Host "   This script will fetch both required Masumi values:" -ForegroundColor Gray
Write-Host "   - PAY-scoped API Key (for agent registration)" -ForegroundColor Gray
Write-Host "   - Selling Wallet VKey (for receiving payments)" -ForegroundColor Gray
Write-Host ""

# Check if admin key was provided as parameter
if (!$AdminKey) {
    # Try to read from masumi-services/.env
    $envPath = "masumi-services/.env"
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath -Raw
        if ($envContent -match 'ADMIN_KEY="([^"]+)"') {
            $AdminKey = $matches[1]
            Write-Host "📋 Using admin key from masumi-services/.env" -ForegroundColor Cyan
        }
    }
    
    # If still no key, prompt user
    if (!$AdminKey) {
        $AdminKey = Read-Host "Please enter your ADMIN_KEY"
    }
}

$credentials = @{}
$errors = @()

# Step 1: Fetch Selling Wallet VKey
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📍 Step 1: Fetching Selling Wallet VKey" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

try {
    $walletResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/wallet?walletType=Selling&id=1" `
        -Method GET `
        -Headers @{ "token" = $AdminKey } `
        -ErrorAction Stop
    
    if ($walletResponse.data.walletVkey) {
        $credentials.vkey = $walletResponse.data.walletVkey
        $credentials.address = $walletResponse.data.walletAddress
        
        Write-Host "✅ Successfully retrieved wallet information!" -ForegroundColor Green
        Write-Host "🔐 VKey: $($credentials.vkey)" -ForegroundColor White
        Write-Host "📍 Address: $($credentials.address)" -ForegroundColor White
        
        # Verify it's a testnet address
        if ($credentials.address -like "addr_test*") {
            Write-Host "✅ Confirmed: Preprod testnet wallet" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Warning: Not a testnet address" -ForegroundColor Yellow
        }
    } else {
        $errors += "Failed to get wallet vkey"
        Write-Host "❌ No wallet vkey found in response" -ForegroundColor Red
    }
} catch {
    $errors += "Wallet fetch error: $($_.Exception.Message)"
    Write-Host "❌ Error fetching wallet: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Generate PAY-scoped API Key
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🔑 Step 2: Generating PAY-scoped API Key" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

try {
    $body = @{
        permission = "ReadAndPay"
        usageLimited = $false
        networkLimit = @("Preprod")
    } | ConvertTo-Json
    
    $apiKeyResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/api-key" `
        -Method POST `
        -Headers @{ "token" = $AdminKey; "Content-Type" = "application/json" } `
        -Body $body `
        -ErrorAction Stop
    
    if ($apiKeyResponse.data.token) {
        $credentials.apiKey = $apiKeyResponse.data.token
        
        Write-Host "✅ Successfully generated API key!" -ForegroundColor Green
        Write-Host "🔐 API Key: $($credentials.apiKey)" -ForegroundColor White
        Write-Host "📋 Permission: $($apiKeyResponse.data.permission) (PAY scope)" -ForegroundColor White
    } else {
        $errors += "Failed to generate API key"
        Write-Host "❌ No API key in response" -ForegroundColor Red
    }
} catch {
    $errors += "API key generation error: $($_.Exception.Message)"
    Write-Host "❌ Error generating API key: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📊 Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

if ($errors.Count -eq 0) {
    Write-Host "✅ All credentials retrieved successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Add these to your .env file:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "VITE_MASUMI_API_KEY=$($credentials.apiKey)" -ForegroundColor White
    Write-Host "VITE_MASUMI_VKEY=$($credentials.vkey)" -ForegroundColor White
    Write-Host ""
    
    # Offer to update .env file
    $updateEnv = Read-Host "Would you like to update your .env file automatically? (y/n)"
    if ($updateEnv -eq 'y') {
        $envFile = ".env"
        $updated = 0
        
        if (Test-Path $envFile) {
            $envContent = Get-Content $envFile -Raw
            
            # Update API Key
            if ($envContent -match 'VITE_MASUMI_API_KEY=') {
                $envContent = $envContent -replace 'VITE_MASUMI_API_KEY=.*', "VITE_MASUMI_API_KEY=$($credentials.apiKey)"
                $updated++
            } else {
                $envContent += "`nVITE_MASUMI_API_KEY=$($credentials.apiKey)"
                $updated++
            }
            
            # Update VKey
            if ($envContent -match 'VITE_MASUMI_VKEY=') {
                $envContent = $envContent -replace 'VITE_MASUMI_VKEY=.*', "VITE_MASUMI_VKEY=$($credentials.vkey)"
                $updated++
            } else {
                $envContent += "`nVITE_MASUMI_VKEY=$($credentials.vkey)"
                $updated++
            }
            
            Set-Content $envFile $envContent -NoNewline
            Write-Host "✅ Updated $updated values in .env file" -ForegroundColor Green
        } else {
            # Create new .env file
            @"
VITE_MASUMI_API_KEY=$($credentials.apiKey)
VITE_MASUMI_VKEY=$($credentials.vkey)
"@ | Out-File -FilePath $envFile -Encoding UTF8
            Write-Host "✅ Created new .env file with credentials" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ Errors encountered:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   - $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "   1. Check if Masumi services are running: docker compose ps" -ForegroundColor White
    Write-Host "   2. Verify your admin key has ADMIN scope" -ForegroundColor White
    Write-Host "   3. Try the Admin UI at http://localhost:3001/admin" -ForegroundColor White
    Write-Host "   4. Check the documentation you provided for manual steps" -ForegroundColor White
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray 