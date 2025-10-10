# Generate NextAuth secret for JobMail
# This script creates a cryptographically secure random secret for NextAuth.js

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  NextAuth Secret Generator" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if OpenSSL is available
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue

if ($opensslPath) {
    Write-Host "Using OpenSSL to generate secret..." -ForegroundColor Green
    $secret = openssl rand -base64 32
} else {
    Write-Host "OpenSSL not found. Using .NET crypto provider..." -ForegroundColor Yellow
    
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
    $rng.GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    $rng.Dispose()
}

# Display the secret
Write-Host ""
Write-Host "Generated NextAuth Secret:" -ForegroundColor Green
Write-Host ""
Write-Host "  $secret" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host ""

# Copy to clipboard if possible
try {
    Set-Clipboard -Value $secret
    Write-Host "✓ Copied to clipboard!" -ForegroundColor Green
} catch {
    Write-Host "! Could not copy to clipboard (no GUI available)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Add to Vercel environment variables:" -ForegroundColor White
Write-Host "     NEXTAUTH_SECRET=$secret"
Write-Host ""
Write-Host "  2. Add to local .env file:" -ForegroundColor White
Write-Host "     NEXTAUTH_SECRET=$secret"
Write-Host ""
Write-Host "⚠️  Keep this secret secure! Don't commit it to Git." -ForegroundColor Yellow
Write-Host ""

