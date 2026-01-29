-- Migration: Create purchase_activations table for secure account activation
-- Purpose: Store unique activation tokens for users who have paid and need account access

CREATE TABLE purchase_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_intent_id UUID NOT NULL REFERENCES purchase_intents(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Track which admin created this activation
  created_by UUID REFERENCES profiles(id)
);

-- Create index for fast token lookups
CREATE INDEX idx_purchase_activations_token ON purchase_activations(token) WHERE used = false;
CREATE INDEX idx_purchase_activations_purchase_intent ON purchase_activations(purchase_intent_id);
CREATE INDEX idx_purchase_activations_email ON purchase_activations(email);

-- RLS: Only admins can create/view activations, anyone can check token validity
ALTER TABLE purchase_activations ENABLE ROW LEVEL SECURITY;

-- Admins can view all activations
CREATE POLICY "Admins can view all purchase activations" ON purchase_activations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@smallplates%'
    )
  );

-- Admins can create activations
CREATE POLICY "Admins can create purchase activations" ON purchase_activations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@smallplates%'
    )
  );

-- Anyone can check if a token is valid (for the activation page)
CREATE POLICY "Anyone can check token validity" ON purchase_activations
  FOR SELECT USING (true);

-- Only the system can update activations (mark as used)
-- This is done via service role, so no RLS policy needed for updates

-- Add comment for documentation
COMMENT ON TABLE purchase_activations IS 'Secure activation tokens for users who have paid. Tokens are single-use and expire after 30 days.';
