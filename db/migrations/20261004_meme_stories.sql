-- ============================================================
-- Memes: kind 'story' — twist-ending short fiction posted as a text-only thread
-- (content = { body }). Idempotent. Run BEFORE deploying the matching code.
-- ============================================================

ALTER TABLE memes DROP CONSTRAINT IF EXISTS memes_kind_check;
ALTER TABLE memes ADD CONSTRAINT memes_kind_check CHECK (kind IN ('template', 'translated', 'story'));
