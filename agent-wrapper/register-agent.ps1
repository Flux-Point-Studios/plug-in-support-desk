# PowerShell script to register AI Support Agent with Masumi

Write-Host "🚀 Registering AI Support Agent with Masumi..." -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "token" = "6db15c0fe770cad286d9c3c81e621844"
}

$payload = Get-Content -Path "register-payload.json" -Raw

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/registry/" `
        -Method POST `
        -Headers $headers `
        -Body $payload `
        -UseBasicParsing

    $responseContent = $response.Content
    $responseContent | Out-File -FilePath "registration-response.json"
    
    Write-Host ""
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "📝 Response saved to registration-response.json" -ForegroundColor Yellow
    
    # Pretty print the response
    $responseObj = $responseContent | ConvertFrom-Json
    $responseObj | ConvertTo-Json -Depth 10 | Write-Host
    
} catch {
    Write-Host ""
    Write-Host "❌ Registration failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorContent = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "Response: $errorContent" -ForegroundColor Red
        $errorContent | Out-File -FilePath "registration-error.json"
    }
} 