-- Migration: Create purchase_intents table for soft launch checkout flow
-- Purpose: Store lead information before payment processing is implemented

CREATE TABLE purchase_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  selected_tier TEXT NOT NULL CHECK (selected_tier IN ('the-book', 'family-collection', 'kitchen-table')),
  user_type TEXT NOT NULL CHECK (user_type IN ('couple', 'gift_giver')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'paid', 'cancelled')),

  -- Couple info (applies to both user types)
  couple_first_name TEXT,
  couple_last_name TEXT,
  partner_first_name TEXT,
  partner_last_name TEXT,
  wedding_date DATE,
  wedding_date_undecided BOOLEAN DEFAULT false,

  -- Couple-specific fields
  planning_stage TEXT,
  guest_count TEXT,

  -- Gift giver-specific fields
  gift_giver_name TEXT,
  relationship TEXT,
  timeline TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- For tracking migration to profiles after manual payment
  migrated_to_profile_id UUID REFERENCES profiles(id),
  migrated_at TIMESTAMPTZ
);

-- RLS: Allow inserts from anonymous users, reads only for authenticated admins
ALTER TABLE purchase_intents ENABLE ROW LEVEL SECURITY;

-- Anyone can insert purchase intents (for onboarding flow)
CREATE POLICY "Anyone can insert purchase intents" ON purchase_intents
  FOR INSERT WITH CHECK (true);

-- Only admins (smallplates team) can view all records
CREATE POLICY "Admins can view all purchase intents" ON purchase_intents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@smallplates%'
    )
  );

-- Only admins can update purchase intents (for status changes)
CREATE POLICY "Admins can update purchase intents" ON purchase_intents
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@smallplates%'
    )
  );

-- Add comment for documentation
COMMENT ON TABLE purchase_intents IS 'Soft launch table for storing purchase intent data before payment processing. Leads are contacted manually via Venmo.';
