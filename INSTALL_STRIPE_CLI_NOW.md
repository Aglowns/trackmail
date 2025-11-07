# Install Stripe CLI - Quick Guide

## Quick Option: Install Scoop First (Recommended)

Scoop makes installing tools on Windows easy. Run this in PowerShell (as Administrator if needed):

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

Then install Stripe CLI:
```powershell
scoop install stripe
```

---

## Alternative: Manual Installation (No Scoop Needed)

### Step 1: Download Stripe CLI

1. Open your browser and go to:
   https://github.com/stripe/stripe-cli/releases/latest

2. Download the Windows version:
   - Look for: `stripe_X.X.X_windows_x86_64.zip`
   - Click to download

3. Extract the ZIP file:
   - Extract to: `C:\stripe-cli` (or any folder you prefer)
   - You should have a file: `C:\stripe-cli\stripe.exe`

### Step 2: Add to PATH (Temporary - Current Session Only)

Run this in PowerShell:

```powershell
$env:Path += ";C:\stripe-cli"
```

### Step 3: Test It Works

```powershell
stripe --version
```

If you see a version number, it's working!

**Note:** This PATH change only lasts for this PowerShell session. To make it permanent, see below.

---

## Make PATH Change Permanent

If you want Stripe CLI to work in all PowerShell sessions:

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\stripe-cli", "User")
```

Then close and reopen PowerShell.

---

## After Installation: Continue with Webhook Setup

Once `stripe --version` works, you can proceed with webhook setup!

See `SETUP_WEBHOOK_POWERSHELL.md` for the next steps.

