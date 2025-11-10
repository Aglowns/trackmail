@echo off
echo ============================================================
echo PUSHING WEBHOOK FIX TO GITHUB
echo ============================================================

cd /d C:\Users\aglon\Desktop\CURSOR\trackmail

echo.
echo Adding files...
git add app/services/payment.py
git add WEBHOOK_FIX_COMPLETE.md
git add DEBUG_PAYMENT_NOT_UPGRADING.md
git add FIX_WEBHOOK_URL.md
git add GO_LIVE_WITH_STRIPE.md

echo.
echo Committing...
git commit -m "Fix webhook user_id mapping - add subscription_data metadata"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ============================================================
echo ✅ DONE! 
echo ============================================================
echo.
echo Render will auto-deploy in 2-3 minutes.
echo.
pause

