@echo off
echo ============================================================
echo DEPLOYING PRICING UPDATE: $2.99/month, $29.99/year
echo ============================================================

cd /d C:\Users\aglon\Desktop\CURSOR\trackmail

echo.
echo ============================================================
echo STEP 1: Adding files to git...
echo ============================================================
git add FIX_STRIPE_503_ERROR.md
git add db/migrations/0007_subscriptions.sql
git add db/migrations/0010_update_pro_pricing.sql
git add COMPLETE_SUBSCRIPTION_SYSTEM.md
git add SUBSCRIPTION_SYSTEM_SUMMARY.md
git add ALL_PHASES_COMPLETE.md
git add PHASE_6_FRONTEND_COMPLETE.md
git add STRIPE_SETUP_GUIDE.md

echo.
echo ============================================================
echo STEP 2: Committing changes...
echo ============================================================
git commit -m "Update Pro plan pricing to $2.99/month and $29.99/year"

echo.
echo ============================================================
echo STEP 3: Pushing to GitHub...
echo ============================================================
git push origin main

echo.
echo ============================================================
echo STEP 4: Handling frontend (if separate repo)...
echo ============================================================
if exist jobmail-frontend\.git (
    echo Frontend is a separate git repository
    cd jobmail-frontend
    git add src/app/page.tsx
    git commit -m "Update pricing to $2.99/month"
    git push origin main
    cd ..
) else (
    echo Frontend is part of main repository
    git add jobmail-frontend/src/app/page.tsx
    git commit -m "Update frontend pricing to $2.99/month"
    git push origin main
)

echo.
echo ============================================================
echo ✅ DONE!
echo ============================================================
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for Render to redeploy backend
echo 2. Wait 2-3 minutes for Vercel to redeploy frontend
echo 3. Test at your live site!
echo.
pause

