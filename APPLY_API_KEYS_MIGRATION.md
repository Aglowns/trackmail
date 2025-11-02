# Apply API Keys Migration

## Quick Method: Via Supabase SQL Editor (Recommended)

This is the easiest way to apply the migration:

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New query"**

3. **Copy and Paste the Migration**
   - Open the file: `db/migrations/0005_add_api_keys.sql`
   - Copy ALL the SQL content (from BEGIN to COMMIT)
   - Paste it into the SQL Editor

4. **Run the Migration**
   - Click **"Run"** button (or press Ctrl+Enter)
   - You should see: "Success. No rows returned"

5. **Verify It Worked**
   - Go to **"Table Editor"** in the sidebar
   - You should see a new table called **`api_keys`**
   - Check that it has these columns:
     - `id` (UUID)
     - `user_id` (UUID)
     - `api_key` (TEXT)
     - `name` (TEXT)
     - `created_at` (TIMESTAMPTZ)
     - `last_used_at` (TIMESTAMPTZ)
     - `expires_at` (TIMESTAMPTZ)

### What This Migration Does:

- Creates the `api_keys` table
- Sets up Row-Level Security (RLS) policies
- Creates indexes for fast lookups
- Allows users to manage their own API keys

## After Migration

Once the migration is applied:

1. **Deploy your backend** (the new API key endpoints are ready)
2. **Deploy your frontend** (Settings page can generate API keys)
3. **Update Gmail Add-on** (already uses API keys in the code)

## Testing

1. Go to Settings page
2. Click "Generate API Key"
3. Copy the API key
4. Paste it in Gmail add-on
5. Try tracking an email - it should work!

---

**Note**: If you see any errors in the SQL Editor, make sure you're running the complete migration (from BEGIN to COMMIT).

