# Vercel Deployment Script for JobMail
# Automates Vercel CLI deployment with environment variable checks

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelCmd) {
    Write-Host "❌ Vercel CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Vercel CLI installed" -ForegroundColor Green
}

# Check if project is linked
if (-not (Test-Path ".vercel/project.json")) {
    Write-Host "⚠️  Project not linked to Vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Linking project..." -ForegroundColor Cyan
    vercel link
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to link project" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Project linked" -ForegroundColor Green
Write-Host ""

# Check required environment variables
Write-Host "Checking environment variables..." -ForegroundColor Cyan

$requiredEnvVars = @(
    "DATABASE_URL",
    "DIRECT_URL",
    "JOBMAIL_API_KEY",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL"
)

Write-Host "Pulling environment variables from Vercel..." -ForegroundColor Gray
vercel env pull .env.production.local --yes

$missingVars = @()

foreach ($varName in $requiredEnvVars) {
    $value = (Get-Content .env.production.local | Select-String "^$varName=").ToString()
    
    if ($value) {
        Write-Host "  ✓ $varName" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $varName (missing)" -ForegroundColor Red
        $missingVars += $varName
    }
}

Write-Host ""

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "  - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please set these in Vercel dashboard:" -ForegroundColor Yellow
    Write-Host "  https://vercel.com/dashboard → Settings → Environment Variables"
    Write-Host ""
    exit 1
}

# Run tests before deploying
Write-Host "Running tests..." -ForegroundColor Cyan
npm test

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Tests failed! Aborting deployment." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "✓ All tests passed" -ForegroundColor Green
Write-Host ""

# Build locally to catch errors early
Write-Host "Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed! Aborting deployment." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "✓ Build successful" -ForegroundColor Green
Write-Host ""

# Deploy to production
Write-Host "Deploying to Vercel production..." -ForegroundColor Cyan
Write-Host ""

vercel --prod

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Deployment successful!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get deployment URL
$project = Get-Content .vercel/project.json | ConvertFrom-Json
$deploymentUrl = "https://$($project.name).vercel.app"

Write-Host "Production URL: $deploymentUrl" -ForegroundColor Cyan
Write-Host ""

# Run health check
Write-Host "Running health check..." -ForegroundColor Cyan
Start-Sleep -Seconds 5  # Wait for deployment to propagate

try {
    $health = Invoke-RestMethod -Uri "$deploymentUrl/api/health" -Method GET
    
    if ($health.status -eq "ok") {
        Write-Host "✓ Health check passed!" -ForegroundColor Green
        Write-Host "  Database: $($health.database)" -ForegroundColor Gray
        Write-Host "  Version: $($health.version)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Health check returned non-OK status" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This may be temporary. Check Vercel dashboard for status." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify deployment: $deploymentUrl" -ForegroundColor White
Write-Host "  2. Run smoke tests: .\scripts\smoke-test-api.ps1" -ForegroundColor White
Write-Host "  3. Update Apps Script VERCEL_API_URL to: $deploymentUrl" -ForegroundColor White
Write-Host ""

# Clean up
Remove-Item .env.production.local -ErrorAction SilentlyContinue

