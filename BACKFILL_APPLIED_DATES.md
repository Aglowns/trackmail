# Backfill Applied Dates for Existing Applications

## Quick Fix: Update Existing Applications

If you already have applications without `applied_at` dates, run this SQL query in Supabase:

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click on **"SQL Editor"** in the left sidebar

2. **Create New Query**
   - Click **"New query"**
   - Copy and paste the SQL below

3. **Run the Query**
   - Click **"Run"** button (or press Ctrl+Enter)
   - You should see: "Success" message with number of rows updated

## SQL Query to Run:

```sql
-- Backfill applied_at dates for existing applications
UPDATE public.applications app
SET applied_at = COALESCE(
    -- Try to get the earliest email date for this application
    (SELECT MIN(em.received_at)
     FROM public.email_messages em
     WHERE em.application_id = app.id
       AND em.received_at IS NOT NULL),
    -- Fallback to created_at if no emails exist
    app.created_at
)
WHERE app.applied_at IS NULL;
```

## What This Does:

- **For applications with emails**: Uses the earliest email's `received_at` date
- **For applications without emails**: Uses the `created_at` date as a fallback
- **Only updates NULL dates**: Won't overwrite existing dates

## Verify It Worked:

After running the query, refresh your frontend applications page and you should see dates in the "Date Applied" column!

