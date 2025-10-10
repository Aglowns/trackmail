# Quick Deploy Script for JobMail
# One-command deployment of entire stack

param(
    [Parameter(Mandatory=$true)]
    [string]$NeonDatabaseUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$NeonDirectUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$JobmailApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$NextAuthSecret,
    
    [switch]$SkipTests,
    [switch]$SkipAppsScript
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   JobMail Quick Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Generate secrets if not provided
if (-not $JobmailApiKey) {
    Write-Host "Generating API key..." -ForegroundColor Yellow
    
    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
    if ($opensslPath) {
        $JobmailApiKey = openssl rand -base64 32
    } else {
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
        $rng.GetBytes($bytes)
        $JobmailApiKey = [Convert]::ToBase64String($bytes)
        $rng.Dispose()
    }
    
    Write-Host "  Generated: $JobmailApiKey" -ForegroundColor Green
}

if (-not $NextAuthSecret) {
    Write-Host "Generating NextAuth secret..." -ForegroundColor Yellow
    
    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
    if ($opensslPath) {
        $NextAuthSecret = openssl rand -base64 32
    } else {
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
        $rng.GetBytes($bytes)
        $NextAuthSecret = [Convert]::ToBase64String($bytes)
        $rng.Dispose()
    }
    
    Write-Host "  Generated: $NextAuthSecret" -ForegroundColor Green
}

if (-not $NeonDirectUrl) {
    $NeonDirectUrl = $NeonDatabaseUrl
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Database URL: $($NeonDatabaseUrl.Substring(0, 30))..." -ForegroundColor Gray
Write-Host "  API Key: $($JobmailApiKey.Substring(0, 10))..." -ForegroundColor Gray
Write-Host ""

# Step 1: Install dependencies
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "Step 2: Running tests..." -ForegroundColor Cyan
    npm test
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests failed" -ForegroundColor Red
        $response = Read-Host "Continue anyway? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            exit 1
        }
    } else {
        Write-Host "✓ Tests passed" -ForegroundColor Green
    }
} else {
    Write-Host "Step 2: Skipping tests" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Deploy to Vercel
Write-Host "Step 3: Deploying to Vercel..." -ForegroundColor Cyan

# Check if Vercel CLI is installed
$vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelCmd) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Link project if not linked
if (-not (Test-Path ".vercel/project.json")) {
    Write-Host "Linking to Vercel project..." -ForegroundColor Yellow
    vercel link
}

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Gray

$envVars = @{
    "DATABASE_URL" = $NeonDatabaseUrl
    "DIRECT_URL" = $NeonDirectUrl
    "JOBMAIL_API_KEY" = $JobmailApiKey
    "NEXTAUTH_SECRET" = $NextAuthSecret
    "NODE_ENV" = "production"
}

foreach ($key in $envVars.Keys) {
    Write-Host "  Setting $key..." -ForegroundColor DarkGray
    
    # Remove existing if present
    vercel env rm $key production --yes 2>$null
    
    # Add new value
    echo $envVars[$key] | vercel env add $key production
}

# Get deployment URL before deploying (from project config)
$project = Get-Content .vercel/project.json | ConvertFrom-Json
$deploymentUrl = "https://$($project.name).vercel.app"

# Set NEXTAUTH_URL
Write-Host "  Setting NEXTAUTH_URL..." -ForegroundColor DarkGray
vercel env rm NEXTAUTH_URL production --yes 2>$null
echo $deploymentUrl | vercel env add NEXTAUTH_URL production

Write-Host ""
Write-Host "Deploying to production..." -ForegroundColor Gray
vercel --prod --yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Deployed to Vercel: $deploymentUrl" -ForegroundColor Green
Write-Host ""

# Step 4: Run database migrations
Write-Host "Step 4: Running database migrations..." -ForegroundColor Cyan

$env:DATABASE_URL = $NeonDatabaseUrl
npx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database migration failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Database schema created" -ForegroundColor Green
Write-Host ""

# Step 5: Verify deployment
Write-Host "Step 5: Verifying deployment..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

try {
    $health = Invoke-RestMethod -Uri "$deploymentUrl/api/health" -Method GET
    
    if ($health.status -eq "ok" -and $health.database -eq "connected") {
        Write-Host "✓ Health check passed!" -ForegroundColor Green
        Write-Host "  Database: connected" -ForegroundColor Gray
        Write-Host "  Version: $($health.version)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Health check returned unexpected status" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Deploy Apps Script (optional)
if (-not $SkipAppsScript) {
    Write-Host "Step 6: Deploying Apps Script..." -ForegroundColor Cyan
    
    try {
        & "$PSScriptRoot\deploy-apps-script.ps1" `
            -VercelApiUrl $deploymentUrl `
            -ApiKey $JobmailApiKey
    } catch {
        Write-Host "⚠️  Apps Script deployment failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "You can deploy manually later" -ForegroundColor Gray
    }
} else {
    Write-Host "Step 6: Skipping Apps Script deployment" -ForegroundColor Yellow
}

Write-Host ""

# Success summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Production URL: $deploymentUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credentials (SAVE THESE!):" -ForegroundColor Yellow
Write-Host "  JOBMAIL_API_KEY=$JobmailApiKey" -ForegroundColor White
Write-Host "  NEXTAUTH_SECRET=$NextAuthSecret" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run smoke tests: .\scripts\smoke-test-api.ps1 -ApiUrl '$deploymentUrl' -ApiKey '$JobmailApiKey'" -ForegroundColor White

if ($SkipAppsScript) {
    Write-Host "  2. Deploy Apps Script: .\scripts\deploy-apps-script.ps1 -VercelApiUrl '$deploymentUrl' -ApiKey '$JobmailApiKey'" -ForegroundColor White
}

Write-Host "  3. Test in Gmail: Open any job email and check sidebar" -ForegroundColor White
Write-Host "  4. View dashboard: $deploymentUrl" -ForegroundColor White
Write-Host ""
Write-Host "Happy job hunting! 🚀" -ForegroundColor Cyan
Write-Host ""

# Clean up
Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue

