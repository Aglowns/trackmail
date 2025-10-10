# Smoke Test Script for JobMail API
# Tests all critical endpoints to verify production deployment

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

# Configuration
$ErrorActionPreference = "Continue"
$testsPassed = 0
$testsFailed = 0

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   JobMail API Smoke Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API URL: $ApiUrl" -ForegroundColor White
Write-Host "Testing..." -ForegroundColor White
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "[$Name]" -ForegroundColor Yellow -NoNewline
    Write-Host " $Method $Endpoint" -ForegroundColor Gray
    
    try {
        $uri = "$ApiUrl$Endpoint"
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "  ✓ PASS" -ForegroundColor Green
            Write-Host "    Status: $($response.StatusCode)" -ForegroundColor Gray
            
            if ($response.Content) {
                $json = $response.Content | ConvertFrom-Json
                Write-Host "    Response: $($json | ConvertTo-Json -Compress -Depth 2)" -ForegroundColor Gray
            }
            
            $script:testsPassed++
            return $json
        } else {
            Write-Host "  ✗ FAIL" -ForegroundColor Red
            Write-Host "    Expected: $ExpectedStatus, Got: $($response.StatusCode)" -ForegroundColor Red
            $script:testsFailed++
            return $null
        }
    }
    catch {
        Write-Host "  ✗ FAIL" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "    Status: $statusCode" -ForegroundColor Red
        }
        
        $script:testsFailed++
        return $null
    }
    
    Write-Host ""
}

# Prepare headers
$authHeaders = @{
    "Authorization" = "Bearer $ApiKey"
}

# Test 1: Health Check (No auth required)
Write-Host "Test 1: Health Check" -ForegroundColor Cyan
$health = Test-Endpoint -Name "Health" -Method "GET" -Endpoint "/api/health"
Write-Host ""

# Test 2: Create Application
Write-Host "Test 2: Create Application" -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testApp = @{
    threadId = "smoke-test-$timestamp"
    lastEmailId = "email-$timestamp"
    company = "Smoke Test Corp"
    title = "Senior Test Engineer"
    status = "applied"
    source = "GMAIL"
    confidence = "HIGH"
}

$authHeadersWithIdempotency = @{
    "Authorization" = "Bearer $ApiKey"
    "Idempotency-Key" = "smoke-test-$timestamp"
}

$created = Test-Endpoint `
    -Name "Create" `
    -Method "POST" `
    -Endpoint "/api/applications/upsert" `
    -Headers $authHeadersWithIdempotency `
    -Body $testApp `
    -ExpectedStatus 201

Write-Host ""

if (-not $created) {
    Write-Host "⚠️  Cannot continue tests without created application" -ForegroundColor Yellow
    exit 1
}

$appId = $created.id
$threadId = $created.threadId

# Test 3: List Applications
Write-Host "Test 3: List Applications" -ForegroundColor Cyan
$list = Test-Endpoint `
    -Name "List" `
    -Method "GET" `
    -Endpoint "/api/applications?limit=10" `
    -Headers $authHeaders

Write-Host ""

# Test 4: Get by Thread ID
Write-Host "Test 4: Get by Thread ID" -ForegroundColor Cyan
$byThread = Test-Endpoint `
    -Name "GetByThread" `
    -Method "GET" `
    -Endpoint "/api/applications/by-thread/$threadId" `
    -Headers $authHeaders

Write-Host ""

# Test 5: Update Status
Write-Host "Test 5: Update Application Status" -ForegroundColor Cyan
$updateBody = @{
    status = "interview"
}

$updated = Test-Endpoint `
    -Name "UpdateStatus" `
    -Method "PATCH" `
    -Endpoint "/api/applications/$appId/status" `
    -Headers $authHeaders `
    -Body $updateBody

Write-Host ""

# Test 6: Idempotency Check (same request should return existing)
Write-Host "Test 6: Idempotency Check" -ForegroundColor Cyan
$duplicate = Test-Endpoint `
    -Name "Idempotency" `
    -Method "POST" `
    -Endpoint "/api/applications/upsert" `
    -Headers $authHeadersWithIdempotency `
    -Body $testApp `
    -ExpectedStatus 200

Write-Host ""

# Test 7: Invalid Auth
Write-Host "Test 7: Invalid Authentication" -ForegroundColor Cyan
$badHeaders = @{
    "Authorization" = "Bearer invalid-key-123"
}

$unauthorized = Test-Endpoint `
    -Name "InvalidAuth" `
    -Method "GET" `
    -Endpoint "/api/applications" `
    -Headers $badHeaders `
    -ExpectedStatus 401

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Passed: $testsPassed" -ForegroundColor Green
Write-Host "  Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ All smoke tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your API is production-ready! 🚀" -ForegroundColor Cyan
    Write-Host ""
    exit 0
} else {
    Write-Host "✗ Some tests failed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the errors above and check:" -ForegroundColor Yellow
    Write-Host "  - Vercel deployment is successful" -ForegroundColor White
    Write-Host "  - Database migrations are applied" -ForegroundColor White
    Write-Host "  - Environment variables are set correctly" -ForegroundColor White
    Write-Host "  - API key matches Vercel JOBMAIL_API_KEY" -ForegroundColor White
    Write-Host ""
    exit 1
}

