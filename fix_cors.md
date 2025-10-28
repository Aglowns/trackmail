# Fix CORS and Profile Loading Issues

## Issue 1: CORS Policy Error

The backend is blocking requests from the frontend because the CORS_ORIGINS environment variable doesn't include the Vercel URL.

### Solution:

1. Go to **Render Dashboard** → **trackmail-backend1** → **Environment**

2. Find or add the `CORS_ORIGINS` variable and set it to:
   ```
   https://trackmail-frontend.vercel.app,http://localhost:3000,http://localhost:5173
   ```

3. **Save** the environment variable

4. **Redeploy** the backend:
   - Go to **"Deploy"** tab
   - Click **"Manual Deploy"**
   - Check **"Clear build cache"**
   - Click **"Deploy"**

## Issue 2: 500 Internal Server Error on Profile Creation

The profile creation endpoint is returning a 500 error. This is likely because:

1. The profile already exists (can't insert duplicate)
2. There's a missing field in the database
3. The user email is not being retrieved correctly

### Debug Steps:

After fixing CORS, check the Render logs:
1. Go to **Render Dashboard** → **trackmail-backend1** → **Logs**
2. Try to load the settings page
3. Look for error messages that show what's failing

### Expected Fix:

The profile creation logic should:
- First try to get existing profile
- If it doesn't exist, create one
- Handle duplicate key errors gracefully

This is already implemented, but the CORS issue is preventing the request from reaching the backend properly.

## Testing After Fix:

1. Wait 2-3 minutes for backend to redeploy
2. Clear browser cache and reload
3. Log out and log back in
4. Go to settings page
5. Profile should load correctly

