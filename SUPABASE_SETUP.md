# Supabase Setup Guide for TrackMail

This guide will walk you through setting up a Supabase project for TrackMail, a beginner-friendly step-by-step process.

## What is Supabase?

Supabase is an open-source Firebase alternative that provides:
- **PostgreSQL database** - A powerful relational database
- **Authentication** - Built-in user authentication with JWT tokens
- **Row-Level Security (RLS)** - Database-level security policies
- **Real-time subscriptions** - Live data updates
- **Storage** - File storage capabilities

## Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"**
3. Sign up using GitHub, Google, or email

## Step 2: Create a New Project

1. Once logged in, click **"New Project"**
2. Fill in the project details:
   - **Name**: `trackmail` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the region closest to you
3. Click **"Create new project"**
4. Wait 2-3 minutes for your project to be provisioned

## Step 3: Gather Your Configuration Values

### 3.1 Get Your Project URL and API Keys

1. In your Supabase dashboard, click **"Settings"** (gear icon in sidebar)
2. Click **"API"** in the settings menu
3. You'll see several important values:

#### SUPABASE_URL
- Look for **"Project URL"**
- Format: `https://xxxxxxxxxxxxx.supabase.co`
- Copy this entire URL

#### SUPABASE_ANON_KEY
- Look for **"Project API keys"** section
- Find **"anon public"** key
- This is a long string starting with `eyJ...`
- This key is safe to use in frontend code (it respects RLS policies)

#### SUPABASE_SERVICE_ROLE_KEY
- In the same **"Project API keys"** section
- Find **"service_role"** key
- **⚠️ IMPORTANT**: This key bypasses Row-Level Security
- **Never** expose this key in frontend code
- Only use on the backend server

### 3.2 Get Your Database Connection String

1. Still in **Settings**, click **"Database"** in the left menu
2. Scroll down to **"Connection string"**
3. Select the **"URI"** tab
4. You'll see a connection string like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. Copy this and replace `[YOUR-PASSWORD]` with the database password you created in Step 2
6. This is your `DATABASE_URL`

**Note**: You can also find connection pooling strings here, but for now, the direct connection is fine.

### 3.3 Get Your JWT Settings

1. In **Settings**, click **"API"**
2. Scroll down to **"JWT Settings"**

#### JWT_AUDIENCE
- This is typically `authenticated`
- Used to verify tokens are intended for authenticated users

#### JWT_ISSUER
- Format: `https://xxxxxxxxxxxxx.supabase.co/auth/v1`
- This is your project URL + `/auth/v1`
- Used to verify tokens came from your Supabase project

## Step 4: Configure Your Backend

1. In your TrackMail project, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your values:
   ```env
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DATABASE_URL=postgresql://postgres:your-password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   JWT_AUDIENCE=authenticated
   JWT_ISSUER=https://xxxxxxxxxxxxx.supabase.co/auth/v1
   ```

3. Save the file

## Step 5: Apply Database Migrations

After setting up your `.env` file:

1. Install Python dependencies:
   ```bash
   pip install -e ".[dev]"
   ```

2. Run the migration script:
   ```bash
   python scripts/apply_migrations.py
   ```

This will create all the necessary tables, indexes, and Row-Level Security policies.

## Step 6: Enable Row-Level Security

Our migration script automatically enables RLS, but you can verify:

1. In Supabase dashboard, click **"Table Editor"**
2. Select a table (e.g., `applications`)
3. Click **"...""** menu → **"View policies"**
4. You should see policies like "Users can only view their own applications"

## Step 7: Test Your Setup

1. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

2. Visit `http://localhost:8000/health`
3. You should see: `{"status": "ok"}`

## Understanding the Keys

### When to Use Each Key

| Key | Use Case | Location | Bypasses RLS? |
|-----|----------|----------|---------------|
| `SUPABASE_ANON_KEY` | Frontend API calls | Frontend | ❌ No |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend operations | Backend only | ✅ Yes |

### Security Best Practices

1. **Never commit `.env` to git** - It's in `.gitignore` for a reason
2. **Don't share your service role key** - Treat it like a password
3. **Use environment variables in production** - Don't hardcode keys
4. **Rotate keys if exposed** - You can regenerate them in Supabase settings

## Common Issues

### "Invalid API key"
- Double-check you copied the entire key (they're very long)
- Make sure there are no extra spaces or line breaks

### "Database connection failed"
- Verify your database password is correct
- Check that your IP is not blocked (Supabase allows all IPs by default)
- Ensure the connection string format is correct

### "JWT verification failed"
- Confirm `JWT_ISSUER` matches your project URL + `/auth/v1`
- Check that `JWT_AUDIENCE` is set to `authenticated`

## Next Steps

Now that your Supabase project is configured:

1. ✅ Your database schema is created
2. ✅ Row-Level Security is enabled
3. ✅ Your backend can authenticate users
4. 🎯 Next: Build the frontend and start creating applications!

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Need Help?** Check the Supabase Discord community or the TrackMail GitHub issues.

