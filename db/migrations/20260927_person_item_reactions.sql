-- ============================================================
-- Hearts and comments on person page items
-- Targets (scoped by person_id):
--   HIGHLIGHT  target_key = person_highlights.id   (achievements, quotes, trivia)
--   GALLERY    target_key = gallery image id        ('portrait', 'node-<uuid>', 'thread-<uuid>')
--   PORTRAYAL  target_key = nodes.id                (film/drama depicting the person)
-- Hearts only — no dislikes. Comments are single-level, text only.
-- RLS on, no policies → server (service role) access only.
-- ============================================================

CREATE TABLE IF NOT EXISTS person_item_likes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id    UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  target_type  TEXT NOT NULL CHECK (target_type IN ('HIGHLIGHT', 'GALLERY', 'PORTRAYAL')),
  target_key   TEXT NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (person_id, target_type, target_key, user_id)
);
CREATE INDEX IF NOT EXISTS person_item_likes_person_idx ON person_item_likes (person_id);

CREATE TABLE IF NOT EXISTS person_item_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id    UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  target_type  TEXT NOT NULL CHECK (target_type IN ('HIGHLIGHT', 'GALLERY', 'PORTRAYAL')),
  target_key   TEXT NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS person_item_comments_target_idx
  ON person_item_comments (person_id, target_type, target_key, created_at)
  WHERE is_deleted = FALSE;

DROP TRIGGER IF EXISTS person_item_comments_updated_at ON person_item_comments;
CREATE TRIGGER person_item_comments_updated_at BEFORE UPDATE ON person_item_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE person_item_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_item_comments ENABLE ROW LEVEL SECURITY;

-- Reports can target the new comments
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_target_type_check;
ALTER TABLE reports ADD CONSTRAINT reports_target_type_check
  CHECK (target_type IN ('THREAD', 'THREAD_REPLY', 'NODE_COMMENT', 'PERSON_ITEM_COMMENT'));
