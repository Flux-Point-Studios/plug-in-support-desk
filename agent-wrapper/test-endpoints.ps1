# Test different Masumi registry endpoint variations

$token = "6db15c0fe770cad286d9c3c81e621844"

Write-Host "Testing Masumi Registry Endpoints..." -ForegroundColor Cyan
Write-Host ""

# Test endpoints
$endpoints = @(
    @{Name="Registry API v1"; Url="http://localhost:3001/api/v1/registry/"; Method="GET"},
    @{Name="Registry Direct"; Url="http://localhost:3001/registry/"; Method="GET"},
    @{Name="Registry on Port 3000"; Url="http://localhost:3000/registry/"; Method="GET"},
    @{Name="Registry API v1 on 3000"; Url="http://localhost:3000/api/v1/registry/"; Method="GET"}
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing: $($endpoint.Name)" -ForegroundColor Yellow
    Write-Host "URL: $($endpoint.Url)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url `
            -Method $endpoint.Method `
            -Headers @{"token" = $token} `
            -UseBasicParsing `
            -TimeoutSec 5
        
        Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "Response: $($content.status)" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
} 