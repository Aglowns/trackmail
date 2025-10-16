# Deploy TrackMail Backend to Render

## Quick Deployment Steps

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Connect GitHub Repository**
   - In Render dashboard, click "New +"
   - Select "Web Service"
   - Connect your GitHub account
   - Select the `trackmail` repository

3. **Configure Service**
   - **Name**: `trackmail-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python minimal_app.py`
   - **Instance Type**: `Free` (to start)

4. **Set Environment Variables**
   Click "Advanced" and add these environment variables:
   ```
   SUPABASE_URL=https://fvpggfqkmldgwjbanwyr.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzY5MjIsImV4cCI6MjA3NTg1MjkyMn0.bqVIUz4t-s6Tc-tmglITDTm1KeY5panOfTKkFzzqTwQ
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI3NjkyMiwiZXhwIjoyMDc1ODUyOTIyfQ.IOS86Nz_skmn_xiv9-cEX_RM82duRkXo_Ro28_Ct_vk
   DATABASE_URL=postgresql://postgres:GAL8p2$mHpLy8!p@db.fvpggfqkmldgwjbanwyr.supabase.co:5432/postgres
   JWT_AUDIENCE=authenticated
   JWT_ISSUER=https://fvpggfqkmldgwjbanwyr.supabase.co/auth/v1
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Test endpoints:
     - `https://your-service-name.onrender.com/health`
     - `https://your-service-name.onrender.com/`

## Expected Endpoints

Once deployed, these endpoints should work:
- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /v1/health` - V1 health check
- `POST /v1/ingest/email` - Email ingest endpoint
- `POST /ingest/email` - Email ingest (no prefix)
- `GET /test-env` - Test environment variables

## Troubleshooting

- Check Render service logs if deployment fails
- Ensure all environment variables are set correctly
- Free tier has cold starts (first request may be slow)
