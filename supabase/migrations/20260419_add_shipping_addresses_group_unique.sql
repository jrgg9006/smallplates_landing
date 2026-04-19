-- Migration: add UNIQUE index on shipping_addresses.group_id
-- Reason: enforce "one shipping address per group" at the DB level,
-- enabling idempotent UPSERT in the shipping POST endpoint.
-- Replaces the destructive DELETE-then-INSERT pattern discovered
-- during Phase 7B recon and documented in Phase 9.
--
-- Applied manually to remote DB on 2026-04-19 before this file was committed.
-- This file is historical documentation of the schema change.

CREATE UNIQUE INDEX IF NOT EXISTS shipping_addresses_group_id_unique
  ON public.shipping_addresses(group_id)
  WHERE group_id IS NOT NULL;
