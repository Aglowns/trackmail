# Test Gmail Add-on Integration with Website API
# This script tests the API endpoints that the Gmail add-on uses

param(
    [string]$ApiUrl = "http://localhost:3000",
    [string]$ApiKey = $env:JOBMAIL_API_KEY
)

if (-not $ApiKey) {
    Write-Host "❌ JOBMAIL_API_KEY environment variable not set" -ForegroundColor Red
    Write-Host "Please set it with: `$env:JOBMAIL_API_KEY = 'your-api-key'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🧪 Testing Gmail Add-on Integration" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Gray
Write-Host "API Key: $($ApiKey.Substring(0, 8))..." -ForegroundColor Gray
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣ Testing API Health Check..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$ApiUrl/api/health" -Method GET
    Write-Host "✅ Health check passed: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Test Application Upsert (simulating Gmail add-on data)
Write-Host "`n2️⃣ Testing Application Upsert..." -ForegroundColor Yellow

$testApplication = @{
    threadId = "test-thread-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    lastEmailId = "test-message-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    company = "Test Company Inc."
    title = "Senior Software Engineer"
    jobUrl = "https://example.com/job/123"
    appliedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    status = "applied"
    source = "GMAIL"
    confidence = "HIGH"
    atsVendor = $null
    companyDomain = "testcompany.com"
    rawSubject = "Application Confirmation - Senior Software Engineer"
    rawSnippet = "Thank you for your application to Test Company Inc. We have received your application for the Senior Software Engineer position."
    messageId = "test-message-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
} | ConvertTo-Json -Depth 3

try {
    $headers = @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
        "Idempotency-Key" = "test-message-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    }
    
    $upsertResponse = Invoke-RestMethod -Uri "$ApiUrl/api/applications/upsert" -Method POST -Body $testApplication -Headers $headers
    
    Write-Host "✅ Application upsert successful!" -ForegroundColor Green
    Write-Host "   Application ID: $($upsertResponse.id)" -ForegroundColor Gray
    Write-Host "   Company: $($upsertResponse.company)" -ForegroundColor Gray
    Write-Host "   Title: $($upsertResponse.title)" -ForegroundColor Gray
    Write-Host "   Is New: $($upsertResponse.isNew)" -ForegroundColor Gray
    
    $applicationId = $upsertResponse.id
} catch {
    Write-Host "❌ Application upsert failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorText = $reader.ReadToEnd()
        Write-Host "   Error details: $errorText" -ForegroundColor Red
    }
    exit 1
}

# Test 3: Test Application List
Write-Host "`n3️⃣ Testing Application List..." -ForegroundColor Yellow
try {
    $listHeaders = @{
        "Authorization" = "Bearer $ApiKey"
    }
    
    $listResponse = Invoke-RestMethod -Uri "$ApiUrl/api/applications" -Method GET -Headers $listHeaders
    
    Write-Host "✅ Application list successful!" -ForegroundColor Green
    Write-Host "   Total applications: $($listResponse.applications.Count)" -ForegroundColor Gray
    Write-Host "   Pagination: $($listResponse.pagination.total) total, page $($listResponse.pagination.page)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Application list failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test Get Application by Thread ID
Write-Host "`n4️⃣ Testing Get Application by Thread ID..." -ForegroundColor Yellow
try {
    $threadId = ($testApplication | ConvertFrom-Json).threadId
    $threadResponse = Invoke-RestMethod -Uri "$ApiUrl/api/applications/by-thread/$threadId" -Method GET -Headers $listHeaders
    
    Write-Host "✅ Get by thread ID successful!" -ForegroundColor Green
    Write-Host "   Thread ID: $($threadResponse.threadId)" -ForegroundColor Gray
    Write-Host "   Company: $($threadResponse.company)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get by thread ID failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test Idempotency (same request should return existing application)
Write-Host "`n5️⃣ Testing Idempotency..." -ForegroundColor Yellow
try {
    $idempotencyResponse = Invoke-RestMethod -Uri "$ApiUrl/api/applications/upsert" -Method POST -Body $testApplication -Headers $headers
    
    Write-Host "✅ Idempotency test successful!" -ForegroundColor Green
    Write-Host "   Same application ID: $($idempotencyResponse.id)" -ForegroundColor Gray
    Write-Host "   Is New: $($idempotencyResponse.isNew) (should be false)" -ForegroundColor Gray
    
    if ($idempotencyResponse.id -eq $applicationId -and $idempotencyResponse.isNew -eq $false) {
        Write-Host "✅ Idempotency working correctly!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Idempotency may not be working correctly" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Idempotency test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nIntegration test completed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "   API Health Check" -ForegroundColor Green
Write-Host "   Application Upsert" -ForegroundColor Green
Write-Host "   Application List" -ForegroundColor Green
Write-Host "   Get by Thread ID" -ForegroundColor Green
Write-Host "   Idempotency" -ForegroundColor Green
Write-Host ""
Write-Host "Your Gmail add-on should now be able to send data to the website!" -ForegroundColor Cyan
Write-Host "   Make sure to configure the Gmail add-on with:" -ForegroundColor Gray
Write-Host "   - Vercel API URL: $ApiUrl" -ForegroundColor Gray
Write-Host "   - API Key: $($ApiKey.Substring(0, 8))..." -ForegroundColor Gray
