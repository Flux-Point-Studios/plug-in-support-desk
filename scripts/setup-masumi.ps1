# Setup script for Masumi services (Windows PowerShell)

Write-Host "🚀 Setting up Masumi services..." -ForegroundColor Green

# Navigate to masumi-services directory
Set-Location masumi-services

# Check if .env exists
if (!(Test-Path .env)) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    
    # Generate encryption key (32 hex chars = 16 bytes)
    $bytes = New-Object byte[] 16
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $ENCRYPTION_KEY = -join ($bytes | ForEach-Object { $_.ToString("x2") })
    Write-Host "🔐 Generated encryption key: $ENCRYPTION_KEY" -ForegroundColor Cyan
    
    # Generate admin key (32 hex chars)
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $ADMIN_KEY = -join ($bytes | ForEach-Object { $_.ToString("x2") })
    Write-Host "🔑 Generated admin key: $ADMIN_KEY" -ForegroundColor Cyan
    
    # Read .env content
    $envContent = Get-Content .env -Raw
    
    # Replace the keys
    $envContent = $envContent -replace 'ENCRYPTION_KEY=".*?"', "ENCRYPTION_KEY=`"$ENCRYPTION_KEY`""
    $envContent = $envContent -replace 'ADMIN_KEY=".*?"', "ADMIN_KEY=`"$ADMIN_KEY`""
    
    # Write back to file
    Set-Content .env $envContent -NoNewline
    
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please update the following in masumi-services/.env:" -ForegroundColor Yellow
    Write-Host "   - BLOCKFROST_API_KEY_PREPROD (get from https://blockfrost.io/)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Your admin key is: $ADMIN_KEY" -ForegroundColor Green
    Write-Host "   Save this key! You'll need it to generate API keys." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Start Docker containers
Write-Host "🐳 Starting Docker containers..." -ForegroundColor Cyan
docker compose up -d

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check if services are running
Write-Host "🔍 Checking service status..." -ForegroundColor Cyan
docker compose ps

# Return to root directory
Set-Location ..

Write-Host ""
Write-Host "🔑 To generate a PAY-scoped API key, run:" -ForegroundColor Yellow
Write-Host "   .\scripts\generate-masumi-key.ps1" -ForegroundColor White
Write-Host ""
Write-Host "✅ Masumi services setup complete!" -ForegroundColor Green
Write-Host "   Registry: http://localhost:3000/docs" -ForegroundColor White
Write-Host "   Payment: http://localhost:3001/docs" -ForegroundColor White 