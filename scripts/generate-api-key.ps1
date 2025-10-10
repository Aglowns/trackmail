# Generate secure API key for JobMail
# This script creates a cryptographically secure random API key

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "   JobMail API Key Generator" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if OpenSSL is available (comes with Git for Windows)
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue

if ($opensslPath) {
    # Use OpenSSL (most secure)
    Write-Host "Using OpenSSL to generate key..." -ForegroundColor Green
    $apiKey = openssl rand -base64 32
} else {
    # Fallback to .NET RNGCryptoServiceProvider
    Write-Host "OpenSSL not found. Using .NET crypto provider..." -ForegroundColor Yellow
    
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
    $rng.GetBytes($bytes)
    $apiKey = [Convert]::ToBase64String($bytes)
    $rng.Dispose()
}

# Display the key
Write-Host ""
Write-Host "Generated API Key:" -ForegroundColor Green
Write-Host ""
Write-Host "  $apiKey" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host ""

# Copy to clipboard if possible
try {
    Set-Clipboard -Value $apiKey
    Write-Host "✓ Copied to clipboard!" -ForegroundColor Green
} catch {
    Write-Host "! Could not copy to clipboard (no GUI available)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Add to Vercel environment variables:" -ForegroundColor White
Write-Host "     JOBMAIL_API_KEY=$apiKey"
Write-Host ""
Write-Host "  2. Add to Apps Script properties:" -ForegroundColor White
Write-Host "     JOBMAIL_API_KEY=$apiKey"
Write-Host ""
Write-Host "⚠️  Keep this key secure! Don't commit it to Git." -ForegroundColor Yellow
Write-Host ""

