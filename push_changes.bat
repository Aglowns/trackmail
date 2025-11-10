@echo off
echo ============================================================
echo FIXING GIT PUSH - Removing problematic file
echo ============================================================

cd /d C:\Users\aglon\Desktop\CURSOR\trackmail

echo.
echo Step 1: Remove the file with Stripe keys from this commit...
git rm FIX_STRIPE_503_ERROR.md
git add db/migrations/0007_subscriptions.sql
git add db/migrations/0010_update_pro_pricing.sql
git add COMPLETE_SUBSCRIPTION_SYSTEM.md
git add SUBSCRIPTION_SYSTEM_SUMMARY.md
git add ALL_PHASES_COMPLETE.md
git add PHASE_6_FRONTEND_COMPLETE.md
git add STRIPE_SETUP_GUIDE.md

echo.
echo Step 2: Amend the commit to remove the problematic file...
git commit --amend -m "Update Pro plan pricing to $2.99/month and $29.99/year"

echo.
echo Step 3: Force push to override the previous commit...
git push origin main --force-with-lease

echo.
echo ============================================================
echo Step 4: Now pushing to FRONTEND repo...
echo ============================================================

cd jobmail-frontend
git add src/app/page.tsx
git commit -m "Update pricing to $2.99/month"
git push origin main

echo.
echo ============================================================
echo ✅ ALL DONE!
echo ============================================================
pause

