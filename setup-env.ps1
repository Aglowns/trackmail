# JobMail Environment Setup Script
# Automatically creates .env file with secure keys

Write-Host "🚀 JobMail - Environment Setup" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Setup cancelled." -ForegroundColor Red
        exit 0
    }
}

# Create .env file content
$envContent = @"
# JobMail Environment Variables
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# ============================================================================
# DATABASE (Neon Postgres)
# ============================================================================
# IMPORTANT: Replace with your actual database URL!
# 
# Option 1 - Neon (Recommended):
#   Sign up at https://neon.tech and create a project
#
# Option 2 - Docker:
#   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=jobmail postgres
#   Then use: postgresql://postgres:password@localhost:5432/jobmail
#
# Option 3 - Local PostgreSQL:
#   Use your existing PostgreSQL installation

DATABASE_URL="postgresql://user:password@ep-example.us-east-2.aws.neon.tech/jobmail?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-example.us-east-2.aws.neon.tech/jobmail?sslmode=require"

# ============================================================================
# JOBMAIL API KEY (for Gmail Add-on authentication)
# ============================================================================
JOBMAIL_API_KEY="AV16iK6nMLWuK6CWYPi5YjXTAL3fjUexS+V2vx1CR/k="

# ============================================================================
# NEXTAUTH (Web Dashboard Sessions)
# ============================================================================
NEXTAUTH_SECRET="KO5wGs+F4fWz20/ajfmQvaVmyUueYLEJmsovuDmHDYA="
NEXTAUTH_URL="http://localhost:3000"

# ============================================================================
# OAUTH PROVIDERS (Optional - for web dashboard)
# ============================================================================
# Uncomment and fill these when setting up OAuth:
# GITHUB_ID="your_github_oauth_app_id"
# GITHUB_SECRET="your_github_oauth_app_secret"
# GOOGLE_CLIENT_ID="your_google_client_id"
# GOOGLE_CLIENT_SECRET="your_google_client_secret"

# ============================================================================
# NODE ENVIRONMENT
# ============================================================================
NODE_ENV="development"
"@

# Write .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env and add your DATABASE_URL" -ForegroundColor White
Write-Host "   - Recommended: Sign up at https://neon.tech (free)" -ForegroundColor Gray
Write-Host "   - Or use Docker/local PostgreSQL" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run database migrations:" -ForegroundColor White
Write-Host "   npm run db:migrate:dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. (Optional) Seed sample data:" -ForegroundColor White
Write-Host "   npm run db:seed" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Start the server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Test it:" -ForegroundColor White
Write-Host "   curl http://localhost:3000/api/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Need help? Check SETUP_LOCAL.md for detailed instructions" -ForegroundColor Cyan



