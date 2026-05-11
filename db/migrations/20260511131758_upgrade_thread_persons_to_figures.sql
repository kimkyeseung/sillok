-- Upgrade thread_persons from "related persons only" to a full figures table.
-- threads.person_id is intentionally kept for backward compatibility and fast
-- primary-figure lookups. The canonical multi-figure list can be read from
-- thread_persons, with exactly one primary row per thread.

CREATE TABLE IF NOT EXISTS thread_persons (
  thread_id  UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  person_id  UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (thread_id, person_id)
);

ALTER TABLE thread_persons
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE thread_persons ENABLE ROW LEVEL SECURITY;

-- Existing related-person rows should sort after the primary figure.
UPDATE thread_persons
SET sort_order = 1
WHERE is_primary = FALSE
  AND sort_order = 0;

-- Backfill every existing thread's primary figure into the figures table.
INSERT INTO thread_persons (thread_id, person_id, is_primary, sort_order, created_at)
SELECT id, person_id, TRUE, 0, created_at
FROM threads
WHERE person_id IS NOT NULL
ON CONFLICT (thread_id, person_id) DO UPDATE
SET is_primary = TRUE,
    sort_order = 0;

-- Keep only one primary figure per thread.
CREATE UNIQUE INDEX IF NOT EXISTS thread_persons_one_primary_idx
  ON thread_persons (thread_id)
  WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS thread_persons_person_id_idx
  ON thread_persons (person_id);

CREATE INDEX IF NOT EXISTS thread_persons_thread_id_idx
  ON thread_persons (thread_id);

CREATE INDEX IF NOT EXISTS thread_persons_thread_order_idx
  ON thread_persons (thread_id, sort_order);
