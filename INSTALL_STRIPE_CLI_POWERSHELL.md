# Install Stripe CLI - Windows PowerShell

## Option 1: Using Scoop (Easiest - Recommended)

### Step 1: Check if Scoop is Installed

```powershell
scoop --version
```

If Scoop is installed, skip to Step 2. If not, install Scoop first:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Step 2: Install Stripe CLI

```powershell
scoop install stripe
```

### Step 3: Verify Installation

```powershell
stripe --version
```

You should see something like: `stripe version 1.x.x`

---

## Option 2: Manual Installation

### Step 1: Download Stripe CLI

1. Go to: https://github.com/stripe/stripe-cli/releases/latest
2. Download `stripe_X.X.X_windows_x86_64.zip` (latest version)
3. Extract to a folder, e.g., `C:\stripe-cli`

### Step 2: Add to PATH

**Temporary (Current Session):**
```powershell
$env:Path += ";C:\stripe-cli"
```

**Permanent (Add to System PATH):**
```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\stripe-cli", "User")
```

Then restart PowerShell.

### Step 3: Verify Installation

```powershell
stripe --version
```

---

## Once Installed: Continue with Webhook Setup

After Stripe CLI is installed, follow `SETUP_WEBHOOK_POWERSHELL.md` for the next steps!

