# Test JobMail API

Write-Host "Testing JobMail API..." -ForegroundColor Cyan
Write-Host ""

$apiKey = "AV16iK6nMLWuK6CWYPi5YjXTAL3fjUexS+V2vx1CR/k="
$baseUrl = "http://localhost:3000"

# Test 1: Health Check
Write-Host "[1] Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    Write-Host "   ✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ✅ Database: $($health.database)" -ForegroundColor Green
    Write-Host "   ✅ Version: $($health.version)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: List Applications
Write-Host "[2] Testing List Applications..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
    }
    $apps = Invoke-RestMethod -Uri "$baseUrl/api/applications" -Method Get -Headers $headers
    Write-Host "   ✅ Found $($apps.pagination.total) applications" -ForegroundColor Green
    Write-Host "   ✅ Page: $($apps.pagination.page) of $($apps.pagination.totalPages)" -ForegroundColor Green
    
    if ($apps.data.Count -gt 0) {
        Write-Host ""
        Write-Host "   Sample Applications:" -ForegroundColor Cyan
        foreach ($app in $apps.data) {
            Write-Host "      - $($app.company) - $($app.title) [$($app.status)]" -ForegroundColor White
        }
    }
} catch {
    Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Create Test Application
Write-Host "[3] Testing Create Application..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }
    $body = @{
        threadId = "test_thread_$(Get-Date -Format 'yyyyMMddHHmmss')"
        lastEmailId = "test_email_123"
        company = "Test Company"
        title = "API Test Engineer"
        status = "NEW"
        source = "GMAIL"
        confidence = "HIGH"
    } | ConvertTo-Json
    
    $newApp = Invoke-RestMethod -Uri "$baseUrl/api/applications/upsert" -Method Post -Headers $headers -Body $body
    Write-Host "   ✅ Created application: $($newApp.id)" -ForegroundColor Green
    Write-Host "   ✅ Company: $($newApp.company)" -ForegroundColor Green
    Write-Host "   ✅ Status: $($newApp.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "All tests completed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server running at: http://localhost:3000" -ForegroundColor Green
Write-Host "Open Prisma Studio: npm run db:studio" -ForegroundColor Gray
Write-Host "Run unit tests: npm test" -ForegroundColor Gray

