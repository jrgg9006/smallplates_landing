-- Migration: UNIQUE constraint on shipping_addresses.group_id
-- Reason: enforce "one shipping address per group" at the DB level,
-- enabling idempotent UPSERT in the shipping POST endpoint.
-- Replaces the destructive DELETE-then-INSERT pattern discovered
-- during Phase 7B recon and documented in Phase 9.
--
-- HISTORY NOTE: An initial version of this migration used a partial
-- UNIQUE index (WHERE group_id IS NOT NULL). It was applied to
-- remote DB on 2026-04-19 but failed at runtime because Postgres
-- does not recognize partial indexes for ON CONFLICT resolution
-- unless the predicate is explicitly passed in the query — and
-- Supabase client's upsert() does not support that.
--
-- The partial index was dropped and replaced with a standard
-- UNIQUE constraint (this migration). In SQL, multiple NULL values
-- do not violate a UNIQUE constraint (NULL != NULL), so the
-- behavior is equivalent for non-null group_ids.
--
-- Applied manually to remote DB on 2026-04-19 via SQL Editor.
-- This file is historical documentation of the schema change.

-- Drop the partial index if it exists (from the failed initial attempt)
DROP INDEX IF EXISTS public.shipping_addresses_group_id_unique;

-- Create the full UNIQUE constraint
ALTER TABLE public.shipping_addresses
  ADD CONSTRAINT shipping_addresses_group_id_unique UNIQUE (group_id);
