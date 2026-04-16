-- MIGRATION: Fix guest recipe submission failure for anonymous guests
-- =============================================================================
--
-- Applied to production on: 2026-04-16
-- Incident: Regina Morones (mother of the bride) could not submit her recipe
-- via the public /collect/[token] flow. Failed 4 times between Apr 14-16.
--
-- PROBLEM:
-- Anonymous guests submitting recipes via /collect/[token] hit
-- "new row violates row-level security policy" errors.
--
-- ROOT CAUSE:
-- Two PERMISSIVE SELECT policies on guest_recipes. When PostgREST wraps an
-- INSERT with RETURNING (standard behavior when the client calls .select()
-- after .insert()), the returned row must pass SELECT RLS. The combination
-- of two PERMISSIVE policies + anonymous auth.uid() + nested subquery to
-- group_members caused the SELECT evaluation to fail for anonymous guests.
--
-- The INSERT itself passed the WITH CHECK policy. It was the RETURNING
-- SELECT wrapper that failed, reported ambiguously as "RLS violation"
-- (Postgres command_tag in logs was "SELECT", not "INSERT").
--
-- SOLUTION:
-- Replace the two SELECT policies with a single unified policy that
-- explicitly covers all three access cases (auth-owner, auth-group-member,
-- anon-public) in one clean OR expression.
--
-- IMPACT (verified in production):
-- - Fixes anonymous guest recipe submission (primary bug)
-- - Preserves access to 298+ recipes accessible via group membership
-- - No functional change for authenticated users (owner or group members)
-- =============================================================================

BEGIN;

-- Drop existing SELECT policies on guest_recipes
DROP POLICY IF EXISTS "Users can view guest recipes" ON public.guest_recipes;
DROP POLICY IF EXISTS "Users can view own recipes and group recipes" ON public.guest_recipes;

-- Create unified SELECT policy covering all three access patterns
CREATE POLICY "guest_recipes_select_unified"
  ON public.guest_recipes
  FOR SELECT
  USING (
    -- Case 1: authenticated user is the cookbook owner
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Case 2: authenticated user is a member of a group where the recipe lives
    (auth.uid() IS NOT NULL AND id IN (
      SELECT gr.recipe_id
      FROM group_recipes gr
      JOIN group_members gm ON gr.group_id = gm.group_id
      WHERE gm.profile_id = auth.uid()
    ))
    OR
    -- Case 3: anonymous user and cookbook has public collection enabled
    -- (required for PostgREST to return the RETURNING clause of a guest INSERT)
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = guest_recipes.user_id
        AND p.collection_enabled = true
        AND p.collection_link_token IS NOT NULL
    ))
  );

COMMIT;
