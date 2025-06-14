# Generate PAY-scoped API key for Masumi services
# Creates an API key with ReadAndPay permission for agent registration

param(
    [string]$AdminKey
)

Write-Host "🔑 Generating PAY-scoped API key for Masumi services..." -ForegroundColor Green
Write-Host "   This key allows payment operations and agent registration" -ForegroundColor Cyan
Write-Host ""

# Check if admin key was provided as parameter
if (!$AdminKey) {
    # Try to read from masumi-services/.env
    $envPath = "masumi-services/.env"
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath -Raw
        if ($envContent -match 'ADMIN_KEY="([^"]+)"') {
            $AdminKey = $matches[1]
            Write-Host "📋 Using admin key from .env file" -ForegroundColor Cyan
        }
    }
    
    # If still no key, prompt user
    if (!$AdminKey) {
        $AdminKey = Read-Host "Please enter your ADMIN_KEY"
    }
}

# Create the API key with PAY scope (ReadAndPay permission)
try {
    $headers = @{
        "Content-Type" = "application/json"
        "token" = $AdminKey
    }
    
    $body = @{
        permission = "ReadAndPay"      # PAY scope
        usageLimited = $false
        networkLimit = @("Preprod")    # For testnet
    } | ConvertTo-Json
    
    Write-Host "📡 Calling Masumi Payment Service API..." -ForegroundColor Yellow
    Write-Host "   POST http://localhost:3001/api/v1/api-key" -ForegroundColor Gray
    Write-Host ""
    
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/api-key" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    if ($response.data.token) {
        Write-Host "✅ PAY-scoped API key generated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔐 Your PAY API Key:" -ForegroundColor Cyan
        Write-Host "   $($response.data.token)" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Key Details:" -ForegroundColor Cyan
        Write-Host "   Permission: $($response.data.permission) (PAY scope)" -ForegroundColor White
        Write-Host "   Network: $($response.data.networkLimit -join ', ')" -ForegroundColor White
        Write-Host "   Usage Limited: $($response.data.usageLimited)" -ForegroundColor White
        Write-Host ""
        Write-Host "📝 Add this to your .env file:" -ForegroundColor Yellow
        Write-Host "   VITE_MASUMI_API_KEY=$($response.data.token)" -ForegroundColor White
        Write-Host ""
        
        # Optionally append to .env file
        $addToEnv = Read-Host "Would you like to add this to your .env file? (y/n)"
        if ($addToEnv -eq 'y') {
            $envFile = ".env"
            if (Test-Path $envFile) {
                # Check if VITE_MASUMI_API_KEY already exists
                $envContent = Get-Content $envFile -Raw
                if ($envContent -match 'VITE_MASUMI_API_KEY=') {
                    Write-Host "⚠️  VITE_MASUMI_API_KEY already exists in .env. Updating..." -ForegroundColor Yellow
                    $envContent = $envContent -replace 'VITE_MASUMI_API_KEY=.*', "VITE_MASUMI_API_KEY=$($response.data.token)"
                    Set-Content $envFile $envContent -NoNewline
                } else {
                    Add-Content $envFile "`nVITE_MASUMI_API_KEY=$($response.data.token)"
                }
                Write-Host "✅ Added to .env file" -ForegroundColor Green
            } else {
                Write-Host "⚠️  .env file not found. Please add manually." -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
        Write-Host "💡 Note: This PAY-scope key has limited permissions:" -ForegroundColor Yellow
        Write-Host "   ✅ Can create payments and register agents" -ForegroundColor Green
        Write-Host "   ❌ Cannot create new API keys or wallets" -ForegroundColor Red
        Write-Host "   Keep it secure but it's safer than an ADMIN key" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Unexpected response format:" -ForegroundColor Red
        Write-Host $response | ConvertTo-Json -Depth 5
    }
    
} catch {
    Write-Host "❌ Error generating API key:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error details: $($errorDetails | ConvertTo-Json -Depth 5)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. 401 Unauthorized: Wrong admin key (must have ADMIN scope to create keys)" -ForegroundColor Yellow
    Write-Host "  2. 403 Forbidden: Using wrong header (must be 'token:' not 'Authorization:')" -ForegroundColor Yellow
    Write-Host "  3. Connection error: Masumi services not running (check: docker compose ps)" -ForegroundColor Yellow
    Write-Host "  4. 404 Not Found: Wrong endpoint (should be /api/v1/api-key)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can also use the Admin UI:" -ForegroundColor Cyan
    Write-Host "  1. Open http://localhost:3001/admin" -ForegroundColor White
    Write-Host "  2. Login with your ADMIN_KEY" -ForegroundColor White
    Write-Host "  3. Go to API Keys → New Key" -ForegroundColor White
    Write-Host "  4. Choose Permission = ReadAndPay" -ForegroundColor White
    Write-Host "  5. Keep networkLimit = Preprod" -ForegroundColor White
    Write-Host "  6. Click Create" -ForegroundColor White
} 