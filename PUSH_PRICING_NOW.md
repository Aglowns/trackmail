# Push Pricing Update - Simple Instructions

## The Problem
GitHub blocked the push because an old commit had Stripe test keys in `FIX_STRIPE_503_ERROR.md`.

## The Solution
I've deleted that file and created a script to push everything properly.

---

## How to Push (Choose One Method)

### Method 1: Run the Batch File (EASIEST)

1. Open File Explorer
2. Navigate to `C:\Users\aglon\Desktop\CURSOR\trackmail`
3. **Double-click** `push_changes.bat`
4. Done!

---

### Method 2: Manual Commands

Copy and paste these commands in PowerShell:

```powershell
# Go to backend repo
cd C:\Users\aglon\Desktop\CURSOR\trackmail

# Remove the problematic file and add the pricing files
git rm FIX_STRIPE_503_ERROR.md
git add db/migrations/0007_subscriptions.sql
git add db/migrations/0010_update_pro_pricing.sql
git add COMPLETE_SUBSCRIPTION_SYSTEM.md
git add SUBSCRIPTION_SYSTEM_SUMMARY.md
git add ALL_PHASES_COMPLETE.md
git add PHASE_6_FRONTEND_COMPLETE.md
git add STRIPE_SETUP_GUIDE.md

# Amend the commit to remove the file
git commit --amend -m "Update Pro plan pricing to $2.99/month and $29.99/year"

# Force push (safe version)
git push origin main --force-with-lease

# Now push frontend
cd jobmail-frontend
git add src/app/page.tsx
git commit -m "Update pricing to $2.99/month"
git push origin main
```

---

## What This Does

1. ✅ Removes `FIX_STRIPE_503_ERROR.md` from git (had Stripe keys)
2. ✅ Adds all the pricing update files
3. ✅ Pushes to backend repo (`Jobmail`)
4. ✅ Pushes to frontend repo (`jobmail-frontend`)

---

## After Push

1. **Render** will auto-deploy backend (2-3 min)
2. **Vercel** will auto-deploy frontend (1-2 min)
3. Test your site - pricing should show **$2.99/month** and **$29.99/year**!

---

## If You Get Any Errors

Just send me the error message and I'll help you fix it!

---

**Ready? Run the batch file or use the manual commands above!** 🚀

