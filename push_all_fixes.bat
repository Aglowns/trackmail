@echo off
echo ============================================================
echo PUSHING ALL FIXES: Auto-Tracking + Email Detection
echo ============================================================

cd /d C:\Users\aglon\Desktop\CURSOR\trackmail

echo.
echo Step 1: Adding all fixed files...
git add gmail-addon/JobStatusDetection.gs
git add FIX_AUTO_TRACKING_AND_DETECTION.md
git add QUICK_TEST_GUIDE.md
git add COMPLETE_FIX_SUMMARY.md
git add push_all_fixes.bat
git add app/services/payment.py
git add WEBHOOK_FIX_COMPLETE.md

echo.
echo Step 2: Committing changes...
git commit -m "Fix: Improve rejection email detection and complete webhook user_id mapping"

echo.
echo Step 3: Pushing to GitHub...
git push origin main

echo.
echo ============================================================
echo ✅ PUSH COMPLETE!
echo ============================================================
echo.
echo Next steps:
echo 1. Wait for Render to redeploy backend (2-3 min)
echo 2. Redeploy Gmail add-on in Apps Script Editor
echo 3. Test all Pro features (see COMPLETE_FIX_SUMMARY.md)
echo.
pause

