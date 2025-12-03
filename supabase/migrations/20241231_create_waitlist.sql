-- =====================================================
-- WAITLIST TABLE - Simple & Practical
-- =====================================================
-- This table stores users who join the waitlist during onboarding
-- No user account is created yet - just capturing leads

-- Create the waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User information (required)
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  
  -- Onboarding data (optional)
  recipe_goal_category TEXT CHECK (recipe_goal_category IN ('40-or-less', '40-60', '60-or-more') OR recipe_goal_category IS NULL),
  
  -- Partner information (optional)
  has_partner BOOLEAN NOT NULL DEFAULT FALSE,
  partner_first_name TEXT,
  partner_last_name TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'converted', 'unsubscribed')),
  invited_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index on email (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);

-- Create index on created_at for sorting (newest first)
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist(status);

-- Add comments for documentation
COMMENT ON TABLE public.waitlist IS 'Pre-launch waitlist for capturing leads during onboarding';
COMMENT ON COLUMN public.waitlist.status IS 'Status: pending (new signup), invited (sent access email), converted (became paying user), unsubscribed (opted out)';
COMMENT ON COLUMN public.waitlist.email IS 'Email address - must be unique';

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_waitlist_updated_at 
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for admin operations)
-- The service role bypasses RLS, but we create this for clarity
CREATE POLICY "Service role has full access to waitlist"
  ON public.waitlist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: No public access (waitlist is admin-only)
-- Users can insert via API but not query directly
CREATE POLICY "Public can insert to waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this, verify with:
-- SELECT * FROM public.waitlist;
-- Should return empty table with all columns visible

