-- TrackMail Database Schema - Initial Migration
-- This migration creates the core database structure with Row-Level Security (RLS)

-- What is Row-Level Security (RLS)?
-- RLS is a PostgreSQL feature that restricts which rows users can see and modify.
-- Each policy defines rules like "users can only see their own data."
-- Even if someone gets direct database access, RLS prevents them from seeing others' data.

BEGIN;

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- Create enum type for application status
-- Enums ensure only valid status values can be stored
CREATE TYPE application_status AS ENUM (
    'wishlist',      -- Jobs user wants to apply to
    'applied',       -- Application submitted
    'screening',     -- Initial screening (phone, recruiter)
    'interviewing',  -- In interview process
    'offer',         -- Offer received
    'rejected',      -- Application rejected
    'accepted',      -- Offer accepted
    'withdrawn'      -- User withdrew application
);

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- Profiles table mirrors Supabase auth.users
-- We store user-specific settings and preferences here
-- The id field matches the user's ID in auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    
    -- Tracking timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row-Level Security on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Users can insert their own profile (happens on signup)
CREATE POLICY "Users can insert own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- APPLICATIONS TABLE
-- ============================================================================

-- Core table for tracking job applications
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Job details
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    status application_status NOT NULL DEFAULT 'applied',
    
    -- Optional fields
    source_url TEXT,         -- Link to job posting
    location TEXT,           -- Job location
    notes TEXT,              -- User's notes about the application
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT applications_company_not_empty CHECK (LENGTH(TRIM(company)) > 0),
    CONSTRAINT applications_position_not_empty CHECK (LENGTH(TRIM(position)) > 0)
);

-- Enable Row-Level Security on applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own applications
CREATE POLICY "Users can view own applications"
    ON applications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own applications
CREATE POLICY "Users can insert own applications"
    ON applications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own applications
CREATE POLICY "Users can update own applications"
    ON applications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own applications
CREATE POLICY "Users can delete own applications"
    ON applications
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- APPLICATION_EVENTS TABLE
-- ============================================================================

-- Track the history and timeline of each application
-- Every status change creates an event
CREATE TABLE application_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Event details
    event_type TEXT NOT NULL,            -- e.g., 'status_change', 'interview_scheduled', 'email_received'
    status application_status,           -- New status if this is a status change
    notes TEXT,                          -- Additional context
    metadata JSONB,                      -- Flexible storage for event-specific data
    
    -- When did this event happen?
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row-Level Security on events
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view events for their own applications
-- This uses a subquery to check application ownership
CREATE POLICY "Users can view events for own applications"
    ON application_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_events.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Policy: Users can insert events for their own applications
CREATE POLICY "Users can insert events for own applications"
    ON application_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_events.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Policy: Users can update events for their own applications
CREATE POLICY "Users can update events for own applications"
    ON application_events
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_events.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Policy: Users can delete events for their own applications
CREATE POLICY "Users can delete events for own applications"
    ON application_events
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_events.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- ============================================================================
-- EMAIL_MESSAGES TABLE
-- ============================================================================

-- Store emails related to job applications
-- Links to applications for context and history
CREATE TABLE email_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    
    -- Email details
    sender TEXT NOT NULL,
    subject TEXT NOT NULL,
    text_body TEXT,           -- Plain text version
    html_body TEXT,           -- HTML version
    
    -- Parsing results
    parsed_data JSONB,        -- Extracted information from email
    
    -- Timestamps
    received_at TIMESTAMPTZ,  -- When the email was received
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row-Level Security on email messages
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view emails for their own applications
-- Also allow viewing emails not yet linked to an application (application_id IS NULL)
-- This is needed during the ingestion process
CREATE POLICY "Users can view emails for own applications"
    ON email_messages
    FOR SELECT
    USING (
        application_id IS NULL  -- Unlinked emails (during processing)
        OR EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = email_messages.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Policy: Users can insert emails (for forwarding/ingestion)
-- The email will be linked to their application after processing
CREATE POLICY "Users can insert emails"
    ON email_messages
    FOR INSERT
    WITH CHECK (
        application_id IS NULL  -- Allow inserting unlinked emails
        OR EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = email_messages.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Policy: Users can update emails for their own applications
CREATE POLICY "Users can update emails for own applications"
    ON email_messages
    FOR UPDATE
    USING (
        application_id IS NULL
        OR EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = email_messages.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Policy: Users can delete emails for their own applications
CREATE POLICY "Users can delete emails for own applications"
    ON email_messages
    FOR DELETE
    USING (
        application_id IS NULL
        OR EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = email_messages.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- What are indexes?
-- Indexes speed up queries by creating efficient lookup structures
-- Think of them like a book's index - helps find information quickly
-- Trade-off: Faster reads, slightly slower writes, uses more disk space

-- Applications table indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_company ON applications(company);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX idx_applications_updated_at ON applications(updated_at DESC);

-- Events table indexes
CREATE INDEX idx_application_events_application_id ON application_events(application_id);
CREATE INDEX idx_application_events_created_at ON application_events(created_at DESC);
CREATE INDEX idx_application_events_event_type ON application_events(event_type);

-- Email messages table indexes
CREATE INDEX idx_email_messages_application_id ON email_messages(application_id);
CREATE INDEX idx_email_messages_sender ON email_messages(sender);
CREATE INDEX idx_email_messages_received_at ON email_messages(received_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- What are triggers?
-- Triggers automatically run functions when certain events happen
-- Used here to automatically update the updated_at timestamp

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for applications table
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================

-- You can add seed data here if needed
-- For example, creating a test user profile

-- Example (commented out):
-- INSERT INTO profiles (id, email, full_name)
-- VALUES (
--     'some-uuid-from-supabase-auth',
--     'test@example.com',
--     'Test User'
-- );

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- What was created:
-- ✅ Custom enum type for application status
-- ✅ 4 tables: profiles, applications, application_events, email_messages
-- ✅ Row-Level Security policies for all tables
-- ✅ Indexes for query performance
-- ✅ Automatic timestamp updates via triggers
--
-- Next steps:
-- 1. Run this migration: python scripts/apply_migrations.py
-- 2. Verify in Supabase dashboard: Tables should be visible
-- 3. Test RLS: Try querying as different users

