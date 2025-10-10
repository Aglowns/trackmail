# Daily Health Check Script for JobMail
# Run this every morning to verify system health

param(
    [string]$ApiUrl = $env:VERCEL_API_URL,
    [string]$ApiKey = $env:JOBMAIL_API_KEY
)

if (-not $ApiUrl -or -not $ApiKey) {
    Write-Host "❌ Error: API URL or API Key not provided" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\daily-health-check.ps1 -ApiUrl 'https://your-app.vercel.app' -ApiKey 'your-api-key'"
    Write-Host ""
    Write-Host "Or set environment variables:" -ForegroundColor Yellow
    Write-Host "  `$env:VERCEL_API_URL = 'https://your-app.vercel.app'"
    Write-Host "  `$env:JOBMAIL_API_KEY = 'your-api-key'"
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   JobMail Daily Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "API:  $ApiUrl" -ForegroundColor Gray
Write-Host ""

$allHealthy = $true

# Check 1: API Health
Write-Host "🔍 Checking API health..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$ApiUrl/api/health" -Method GET -UseBasicParsing
    
    if ($health.status -eq "ok") {
        Write-Host "  ✓ API is healthy" -ForegroundColor Green
        Write-Host "    Database: $($health.database)" -ForegroundColor Gray
        Write-Host "    Version: $($health.version)" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ API returned non-OK status" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host "  ✗ API health check failed: $($_.Exception.Message)" -ForegroundColor Red
    $allHealthy = $false
}
Write-Host ""

# Check 2: Database Connectivity
Write-Host "🔍 Checking database..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $ApiKey"
    }
    
    $apps = Invoke-RestMethod -Uri "$ApiUrl/api/applications?limit=1" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "  ✓ Database query successful" -ForegroundColor Green
    Write-Host "    Total applications: $($apps.total)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Database query failed: $($_.Exception.Message)" -ForegroundColor Red
    $allHealthy = $false
}
Write-Host ""

# Check 3: Response Time
Write-Host "🔍 Checking response time..." -ForegroundColor Cyan
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $null = Invoke-RestMethod -Uri "$ApiUrl/api/health" -Method GET -UseBasicParsing
    $stopwatch.Stop()
    
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 1000) {
        Write-Host "  ✓ Response time: ${responseTime}ms" -ForegroundColor Green
    } elseif ($responseTime -lt 3000) {
        Write-Host "  ⚠ Response time: ${responseTime}ms (slower than usual)" -ForegroundColor Yellow
    } else {
        Write-Host "  ✗ Response time: ${responseTime}ms (too slow)" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host "  ✗ Could not measure response time" -ForegroundColor Red
    $allHealthy = $false
}
Write-Host ""

# Check 4: Recent Errors (last 24 hours)
Write-Host "🔍 Checking for recent activity..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $ApiKey"
    }
    
    $yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
    $recent = Invoke-RestMethod -Uri "$ApiUrl/api/applications?limit=10" -Method GET -Headers $headers -UseBasicParsing
    
    $recentCount = $recent.applications.Count
    Write-Host "  ✓ Recent applications: $recentCount" -ForegroundColor Green
    
    if ($recentCount -eq 0) {
        Write-Host "    ℹ No new applications in recent query" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ✗ Could not fetch recent activity" -ForegroundColor Red
    $allHealthy = $false
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "  ✓ All systems healthy!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    exit 0
} else {
    Write-Host "  ✗ Some issues detected" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Recommended actions:" -ForegroundColor Yellow
    Write-Host "  1. Check Vercel deployment status" -ForegroundColor White
    Write-Host "  2. Review Vercel function logs" -ForegroundColor White
    Write-Host "  3. Verify Neon database is active" -ForegroundColor White
    Write-Host "  4. Check for any ongoing incidents" -ForegroundColor White
    Write-Host ""
    exit 1
}

