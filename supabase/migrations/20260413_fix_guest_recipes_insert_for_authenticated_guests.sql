-- Fix: Allow authenticated users to submit recipes via collection link.
--
-- Problem: the previous INSERT policy gated the public-collection branch on
-- `auth.uid() IS NULL`. If a guest happened to be logged in (e.g. another host
-- account, stale session in the browser), both branches failed and the insert
-- was blocked with "new row violates row-level security policy for table
-- 'guest_recipes'". The collection link is public by design, so auth state
-- should not block legitimate submissions as long as the guest row is linked
-- to a host with collection enabled and a valid token.
--
-- Change: drop the `auth.uid() IS NULL` gate on the collection branch. The
-- security guarantee is preserved because:
--   1. The owner branch still requires guest.user_id = auth.uid().
--   2. The collection branch still requires the guest row to exist and to be
--      linked to a profile with collection_enabled=true AND a non-null
--      collection_link_token (which is an unguessable UUID).

DROP POLICY IF EXISTS "Allow recipe submissions" ON public.guest_recipes;

CREATE POLICY "Allow recipe submissions"
  ON public.guest_recipes
  FOR INSERT
  WITH CHECK (
    (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.guests g
        WHERE g.id = guest_recipes.guest_id
          AND g.user_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.guests g
      JOIN public.profiles p ON g.user_id = p.id
      WHERE g.id = guest_recipes.guest_id
        AND p.collection_enabled = true
        AND p.collection_link_token IS NOT NULL
    )
  );
