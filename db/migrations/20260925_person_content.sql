-- ============================================================
-- Person editorial content (Phase 2)
-- - person_facts      : infobox rows (Reign, Tomb, Predecessor …)
-- - person_highlights : achievements, quotes, trivia
-- - person_sources    : primary records, encyclopedias, books
-- is_ai_generated = TRUE → shown with an "AI draft" label until an admin reviews it
-- Access only through the server (service role): RLS on, no policies.
-- ============================================================

CREATE TABLE IF NOT EXISTS person_facts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id        UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  label            TEXT NOT NULL,
  value            TEXT NOT NULL,
  linked_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_ai_generated  BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS person_facts_person_idx ON person_facts (person_id, sort_order) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS person_highlights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id        UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  kind             TEXT NOT NULL CHECK (kind IN ('ACHIEVEMENT', 'QUOTE', 'TRIVIA')),
  title            TEXT NOT NULL,
  body             TEXT,
  year             INTEGER,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_ai_generated  BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS person_highlights_person_idx ON person_highlights (person_id, kind, sort_order) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS person_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id        UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  kind             TEXT NOT NULL CHECK (kind IN ('PRIMARY', 'ENCYCLOPEDIA', 'BOOK', 'ARTICLE', 'WEB')),
  title            TEXT NOT NULL,
  url              TEXT,
  citation         TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_ai_generated  BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS person_sources_person_idx ON person_sources (person_id, sort_order) WHERE is_deleted = FALSE;

DROP TRIGGER IF EXISTS person_facts_updated_at ON person_facts;
CREATE TRIGGER person_facts_updated_at BEFORE UPDATE ON person_facts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS person_highlights_updated_at ON person_highlights;
CREATE TRIGGER person_highlights_updated_at BEFORE UPDATE ON person_highlights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS person_sources_updated_at ON person_sources;
CREATE TRIGGER person_sources_updated_at BEFORE UPDATE ON person_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE person_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_sources ENABLE ROW LEVEL SECURITY;
