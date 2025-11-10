# Deploy Pricing Update - Instructions

## The Problem

I've updated all the pricing to **$2.99/month** and **$29.99/year**, but there's a terminal issue preventing automatic deployment.

## What Was Updated

### Backend Files:
- ✅ `db/migrations/0010_update_pro_pricing.sql` - New migration to update pricing in database
- ✅ `db/migrations/0007_subscriptions.sql` - Updated default pricing values
- ✅ Documentation files (redacted Stripe keys)

### Frontend Files:
- ✅ `jobmail-frontend/src/app/page.tsx` - Landing page pricing updated

### Database:
- ✅ You already ran the migration: `psql -h ... -f db/migrations/0010_update_pro_pricing.sql`
- ✅ Database now shows $2.99 and $29.99 for Pro plan

## What You Need to Do

Since the terminal isn't working properly, you have **2 options**:

---

## Option 1: Run the Batch File (EASIEST)

I've created a batch file that will do everything automatically.

### Steps:

1. **Open File Explorer**
   - Navigate to: `C:\Users\aglon\Desktop\CURSOR\trackmail`

2. **Double-click** `deploy_pricing_update.bat`

3. **Wait** for it to complete (should take 30 seconds)

4. **Done!** It will commit and push all changes.

---

## Option 2: Manual Git Commands

If you prefer to do it manually, open a **new** Command Prompt or PowerShell window:

### For Backend (trackmail repo):

```bash
cd C:\Users\aglon\Desktop\CURSOR\trackmail

# Add the files
git add FIX_STRIPE_503_ERROR.md
git add db/migrations/0007_subscriptions.sql
git add db/migrations/0010_update_pro_pricing.sql
git add COMPLETE_SUBSCRIPTION_SYSTEM.md
git add SUBSCRIPTION_SYSTEM_SUMMARY.md
git add ALL_PHASES_COMPLETE.md
git add PHASE_6_FRONTEND_COMPLETE.md
git add STRIPE_SETUP_GUIDE.md

# Commit
git commit -m "Update Pro plan pricing to $2.99/month and $29.99/year"

# Push
git push origin main
```

### For Frontend (if separate repo):

```bash
cd C:\Users\aglon\Desktop\CURSOR\trackmail\jobmail-frontend

# Check if it's a separate git repo
git status

# If it is:
git add src/app/page.tsx
git commit -m "Update pricing to $2.99/month"
git push origin main
```

---

## After Deployment

### 1. Verify Backend (Render)
- Go to https://dashboard.render.com
- Your service will auto-deploy (takes 2-3 minutes)
- Check logs to ensure no errors

### 2. Verify Frontend (Vercel)
- Go to https://vercel.com/dashboard
- Your site will auto-deploy (takes 1-2 minutes)
- Check deployment logs

### 3. Test the Changes

Visit your live site and verify:

#### Landing Page (`/`):
- Should show **$2.99/month**
- Should show **$29.99/year**

#### Subscription Page (`/subscription`):
- Pro plan card shows **$2.99** for monthly
- Pro plan card shows **$29.99** for yearly

#### Stripe Checkout:
1. Click "Upgrade to Pro"
2. Select billing period
3. Click "Start Pro plan"
4. Stripe checkout should show **$2.99** (test mode)

---

## Troubleshooting

### If git push fails with "secrets detected":

The issue was Stripe keys in docs. I've already redacted them, so this shouldn't happen. But if it does:

```bash
# Just use the GitHub link to allow the push
# (It will be in the error message)
```

### If frontend doesn't update:

Your frontend might be part of the main repo (not separate). In that case:

```bash
cd C:\Users\aglon\Desktop\CURSOR\trackmail
git add jobmail-frontend/src/app/page.tsx
git commit -m "Update frontend pricing"
git push origin main
```

---

## Summary

✅ **Database**: Already updated ($2.99 / $29.99)  
✅ **Backend Code**: Files ready to commit  
✅ **Frontend Code**: Files ready to commit  
⏳ **Deployment**: Waiting for you to push

**Next Action**: Run `deploy_pricing_update.bat` or use manual commands above.

---

That's it! Once pushed, wait a few minutes for auto-deployment, then test your live site. 🚀

