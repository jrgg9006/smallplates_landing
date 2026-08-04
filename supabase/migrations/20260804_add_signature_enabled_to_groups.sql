-- Per-book gate for the guest signature feature.
--
-- Default TRUE so every new book gets the "Sign it." step automatically.
-- Existing books are backfilled to FALSE: the feature is still incomplete for
-- them and we don't want some guests of a book-in-progress to get the step while
-- earlier contributors didn't. Each existing book is opted in one at a time, by
-- hand, after its couple agrees:
--
--   UPDATE groups SET signature_enabled = true WHERE id = '<group_id>';

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS signature_enabled boolean NOT NULL DEFAULT true;

-- Backfill: turn it OFF for every book that already exists at migration time.
-- (New rows created after this point keep the column default of true.)
UPDATE groups SET signature_enabled = false;
