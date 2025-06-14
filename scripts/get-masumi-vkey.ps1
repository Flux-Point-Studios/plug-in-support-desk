# Get Masumi Selling Wallet VKey

param(
    [string]$AdminKey
)

Write-Host "🔑 Fetching Masumi Selling Wallet VKey..." -ForegroundColor Green

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

# Fetch the wallet info
try {
    Write-Host "📡 Fetching wallet information..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/wallet?walletType=Selling&id=1" `
        -Method GET `
        -Headers @{ "token" = $AdminKey } `
        -ErrorAction Stop
    
    if ($response.data.walletVkey) {
        Write-Host ""
        Write-Host "✅ Successfully retrieved wallet information!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔐 Selling Wallet VKey:" -ForegroundColor Cyan
        Write-Host "   $($response.data.walletVkey)" -ForegroundColor White
        Write-Host ""
        Write-Host "📍 Wallet Address:" -ForegroundColor Cyan
        Write-Host "   $($response.data.walletAddress)" -ForegroundColor White
        Write-Host ""
        
        # Verify it's a testnet address
        if ($response.data.walletAddress -like "addr_test*") {
            Write-Host "✅ Confirmed: This is a Preprod testnet wallet" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Warning: This doesn't appear to be a testnet address" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "📝 Add this to your .env file:" -ForegroundColor Yellow
        Write-Host "   VITE_MASUMI_VKEY=$($response.data.walletVkey)" -ForegroundColor White
        Write-Host ""
        
        # Optionally append to .env file
        $addToEnv = Read-Host "Would you like to add this to your .env file? (y/n)"
        if ($addToEnv -eq 'y') {
            $envFile = ".env"
            if (Test-Path $envFile) {
                # Check if VITE_MASUMI_VKEY already exists
                $envContent = Get-Content $envFile -Raw
                if ($envContent -match 'VITE_MASUMI_VKEY=') {
                    Write-Host "⚠️  VITE_MASUMI_VKEY already exists in .env. Updating..." -ForegroundColor Yellow
                    $envContent = $envContent -replace 'VITE_MASUMI_VKEY=.*', "VITE_MASUMI_VKEY=$($response.data.walletVkey)"
                    Set-Content $envFile $envContent -NoNewline
                } else {
                    Add-Content $envFile "`nVITE_MASUMI_VKEY=$($response.data.walletVkey)"
                }
                Write-Host "✅ Added to .env file" -ForegroundColor Green
            } else {
                Write-Host "⚠️  .env file not found. Please add manually." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "❌ No wallet vkey found in response" -ForegroundColor Red
        Write-Host $response | ConvertTo-Json -Depth 5
    }
    
} catch {
    Write-Host "❌ Error fetching wallet info:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Masumi services are running (docker compose ps)" -ForegroundColor Yellow
    Write-Host "  2. Your admin key is correct" -ForegroundColor Yellow
    Write-Host "  3. The Payment Service is accessible at http://localhost:3001" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can also check via the Admin UI:" -ForegroundColor Cyan
    Write-Host "  1. Open http://localhost:3001/admin" -ForegroundColor White
    Write-Host "  2. Login with your ADMIN_KEY" -ForegroundColor White
    Write-Host "  3. Go to Wallets → Selling → Copy the Public vkey" -ForegroundColor White
} 