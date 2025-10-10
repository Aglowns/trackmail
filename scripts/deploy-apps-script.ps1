# Apps Script Deployment Script for JobMail
# Automates the build and deployment of Gmail Add-on

param(
    [Parameter(Mandatory=$false)]
    [string]$VercelApiUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey,
    
    [switch]$SkipConfig
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Apps Script Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to apps-script directory
$appsScriptDir = Join-Path $PSScriptRoot "..\apps-script"

if (-not (Test-Path $appsScriptDir)) {
    Write-Host "❌ apps-script directory not found" -ForegroundColor Red
    exit 1
}

Set-Location $appsScriptDir

# Check if clasp is installed
$claspCmd = Get-Command clasp -ErrorAction SilentlyContinue

if (-not $claspCmd) {
    Write-Host "❌ clasp not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing @google/clasp..." -ForegroundColor Yellow
    npm install -g @google/clasp
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install clasp" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ clasp installed" -ForegroundColor Green
}

# Check if logged in to clasp
$clasprcPath = Join-Path $env:USERPROFILE ".clasprc.json"

if (-not (Test-Path $clasprcPath)) {
    Write-Host "⚠️  Not logged in to clasp" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Logging in..." -ForegroundColor Cyan
    clasp login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to login" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Logged in successfully" -ForegroundColor Green
}

# Check if project exists
if (-not (Test-Path ".clasp.json")) {
    Write-Host "⚠️  No Apps Script project found" -ForegroundColor Yellow
    Write-Host ""
    
    $response = Read-Host "Create new Apps Script project? (y/N)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Creating project..." -ForegroundColor Cyan
        clasp create --title "JobMail Gmail Add-on" --type standalone --rootDir ./
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to create project" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✓ Project created" -ForegroundColor Green
    } else {
        Write-Host "Deployment cancelled" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "✓ Project found" -ForegroundColor Green
Write-Host ""

# Install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Build TypeScript
Write-Host "Building TypeScript..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build successful" -ForegroundColor Green
Write-Host ""

# Push to Apps Script
Write-Host "Pushing to Apps Script..." -ForegroundColor Cyan
clasp push --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Code pushed successfully" -ForegroundColor Green
Write-Host ""

# Configure Script Properties (if parameters provided)
if (-not $SkipConfig -and $VercelApiUrl -and $ApiKey) {
    Write-Host "Configuring Script Properties..." -ForegroundColor Cyan
    
    # Create a temporary setup script
    $setupScript = @"
function setupFromCLI() {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    'VERCEL_API_URL': '$VercelApiUrl',
    'JOBMAIL_API_KEY': '$ApiKey',
    'DASHBOARD_URL': '$VercelApiUrl'
  });
  console.log('Configuration completed!');
  return 'Configuration completed!';
}
"@
    
    $setupScript | Out-File -FilePath "dist/setup-temp.js" -Encoding UTF8
    
    # Push and run setup
    clasp push --force
    
    Write-Host "  Running setup function..." -ForegroundColor Gray
    clasp run setupFromCLI
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Script Properties configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Automatic config failed. Please set manually:" -ForegroundColor Yellow
        Write-Host "    1. Run: clasp open" -ForegroundColor White
        Write-Host "    2. Go to: Project Settings → Script Properties" -ForegroundColor White
        Write-Host "    3. Add: VERCEL_API_URL = $VercelApiUrl" -ForegroundColor White
        Write-Host "    4. Add: JOBMAIL_API_KEY = $ApiKey" -ForegroundColor White
        Write-Host "    5. Add: DASHBOARD_URL = $VercelApiUrl" -ForegroundColor White
    }
    
    # Clean up
    Remove-Item "dist/setup-temp.js" -ErrorAction SilentlyContinue
    Write-Host ""
}

# Setup triggers
Write-Host "Setting up time triggers..." -ForegroundColor Cyan
Write-Host "  You need to run this manually in Apps Script editor:" -ForegroundColor Gray
Write-Host "  1. Run: clasp open" -ForegroundColor White
Write-Host "  2. Select 'setupTriggers' function from dropdown" -ForegroundColor White
Write-Host "  3. Click 'Run' button" -ForegroundColor White
Write-Host "  4. Grant permissions if prompted" -ForegroundColor White
Write-Host ""

# Create deployment
Write-Host "Creating deployment..." -ForegroundColor Cyan
$deploymentDescription = "Production v$(Get-Date -Format 'yyyyMMdd-HHmmss')"
clasp deploy --description $deploymentDescription

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Deployment created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Deployment creation failed (may require manual deploy)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Apps Script deployment complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open Apps Script editor: clasp open" -ForegroundColor White
Write-Host "  2. Deploy as test add-on: Deploy → Test deployments → Install" -ForegroundColor White
Write-Host "  3. Setup triggers: Run 'setupTriggers' function" -ForegroundColor White
Write-Host "  4. Test in Gmail: Open any email and check sidebar" -ForegroundColor White
Write-Host ""

# Return to original directory
Set-Location (Split-Path $PSScriptRoot -Parent)

