# Trackmail Web Dashboard Environment Setup Script
# This script helps you set up your .env.local file for the Next.js dashboard

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Trackmail Web Dashboard Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local already exists
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Exiting without changes." -ForegroundColor Yellow
        exit
    }
}

# Generate NextAuth Secret
Write-Host "🔐 Generating secure NextAuth secret..." -ForegroundColor Green
$nextauthSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Check if DATABASE_URL exists in .env
$databaseUrl = ""
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'DATABASE_URL="(.+)"') {
        $databaseUrl = $matches[1]
        Write-Host "✅ Found existing DATABASE_URL in .env" -ForegroundColor Green
    }
}

# If not found, ask user
if ([string]::IsNullOrEmpty($databaseUrl)) {
    Write-Host ""
    Write-Host "📦 Database Configuration" -ForegroundColor Cyan
    $databaseUrl = Read-Host "Enter your DATABASE_URL (or press Enter for default)"
    if ([string]::IsNullOrEmpty($databaseUrl)) {
        $databaseUrl = "postgresql://postgres:postgres@localhost:5432/trackmail"
    }
}

# Check if JOBMAIL_API_KEY exists in .env
$apiKey = ""
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'JOBMAIL_API_KEY="(.+)"') {
        $apiKey = $matches[1]
        Write-Host "✅ Found existing JOBMAIL_API_KEY in .env" -ForegroundColor Green
    }
}

# If not found, ask user
if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Host ""
    Write-Host "🔑 API Key Configuration" -ForegroundColor Cyan
    $apiKey = Read-Host "Enter your JOBMAIL_API_KEY (or press Enter for default)"
    if ([string]::IsNullOrEmpty($apiKey)) {
        $apiKey = "dev-key-12345"
    }
}

# Ask about OAuth setup
Write-Host ""
Write-Host "🔐 OAuth Configuration (Optional)" -ForegroundColor Cyan
Write-Host "You can set up GitHub and/or Google OAuth for user authentication."
Write-Host "You can skip this now and add it later."
Write-Host ""

$setupGithub = Read-Host "Do you want to set up GitHub OAuth? (y/n)"
$githubId = ""
$githubSecret = ""
if ($setupGithub -eq "y") {
    Write-Host ""
    Write-Host "To set up GitHub OAuth:" -ForegroundColor Yellow
    Write-Host "1. Go to https://github.com/settings/developers" -ForegroundColor Yellow
    Write-Host "2. Click 'New OAuth App'" -ForegroundColor Yellow
    Write-Host "3. Homepage URL: http://localhost:3000" -ForegroundColor Yellow
    Write-Host "4. Callback URL: http://localhost:3000/api/auth/callback/github" -ForegroundColor Yellow
    Write-Host ""
    $githubId = Read-Host "Enter your GitHub Client ID"
    $githubSecret = Read-Host "Enter your GitHub Client Secret"
}

$setupGoogle = Read-Host "Do you want to set up Google OAuth? (y/n)"
$googleId = ""
$googleSecret = ""
if ($setupGoogle -eq "y") {
    Write-Host ""
    Write-Host "To set up Google OAuth:" -ForegroundColor Yellow
    Write-Host "1. Go to https://console.cloud.google.com/" -ForegroundColor Yellow
    Write-Host "2. Create OAuth 2.0 Client ID" -ForegroundColor Yellow
    Write-Host "3. Authorized redirect URI: http://localhost:3000/api/auth/callback/google" -ForegroundColor Yellow
    Write-Host ""
    $googleId = Read-Host "Enter your Google Client ID"
    $googleSecret = Read-Host "Enter your Google Client Secret"
}

# Create .env.local content
$envContent = @"
# Database
DATABASE_URL="$databaseUrl"

# NextAuth Configuration
NEXTAUTH_SECRET="$nextauthSecret"
NEXTAUTH_URL="http://localhost:3000"

# API Configuration
JOBMAIL_API_KEY="$apiKey"

# Frontend API URL
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
"@

# Add GitHub OAuth if provided
if (![string]::IsNullOrEmpty($githubId)) {
    $envContent += @"


# GitHub OAuth
GITHUB_ID="$githubId"
GITHUB_SECRET="$githubSecret"
"@
}

# Add Google OAuth if provided
if (![string]::IsNullOrEmpty($googleId)) {
    $envContent += @"


# Google OAuth
GOOGLE_CLIENT_ID="$googleId"
GOOGLE_CLIENT_SECRET="$googleSecret"
"@
}

# Write to file
$envContent | Out-File -FilePath ".env.local" -Encoding utf8

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Created .env.local with your configuration" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run database migrations:" -ForegroundColor White
Write-Host "   npm run db:generate" -ForegroundColor Yellow
Write-Host "   npm run db:migrate:dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Open your browser:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

if ([string]::IsNullOrEmpty($githubId) -and [string]::IsNullOrEmpty($googleId)) {
    Write-Host "⚠️  Note: You skipped OAuth setup." -ForegroundColor Yellow
    Write-Host "   You can add OAuth credentials to .env.local later." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "📚 For detailed documentation, see:" -ForegroundColor Cyan
Write-Host "   - README_WEB.md (comprehensive guide)" -ForegroundColor White
Write-Host "   - DEPLOYMENT_GUIDE.md (deployment instructions)" -ForegroundColor White
Write-Host ""
