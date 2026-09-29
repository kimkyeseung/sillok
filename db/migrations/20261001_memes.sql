-- ============================================================
-- Memes (admin-generated wojak memes + translated Korean memes)
--
-- kind = 'template'   → wojak template (format: feels-bro | drake | virgin-chad | its-over),
--                       content = captions, person_ids = figures in slot order
-- kind = 'translated' → uploaded Korean meme image with English text boxes,
--                       content = { boxes: [...] } (0..1 coords of the source image)
--
-- Rendered on demand by /api/og/meme/[id]. Drafts are admin-only.
-- RLS on, no policies → service role only.
-- Also creates the public 'memes' storage bucket (uploaded source images).
-- Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS memes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind             TEXT NOT NULL CHECK (kind IN ('template', 'translated')),
  format           TEXT NOT NULL,
  person_ids       UUID[] NOT NULL DEFAULT '{}',
  event_node_id    UUID REFERENCES nodes(id) ON DELETE SET NULL,
  content          JSONB NOT NULL,
  fact             TEXT,                 -- historical fact the joke is based on
  source_image_url TEXT,                 -- translated: uploaded original
  source_width     INTEGER,
  source_height    INTEGER,
  source_url       TEXT,                 -- translated: where the original came from
  source_credit    TEXT,
  is_ai_generated  BOOLEAN NOT NULL DEFAULT TRUE,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'rejected')),
  created_by       UUID REFERENCES profiles(id),
  published_at     TIMESTAMPTZ,
  is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS memes_admin_list_idx ON memes (status, created_at DESC, id DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS memes_person_ids_idx ON memes USING gin (person_ids);

DROP TRIGGER IF EXISTS memes_updated_at ON memes;
CREATE TRIGGER memes_updated_at
  BEFORE UPDATE ON memes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE memes ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('memes', 'memes', TRUE, 5242880, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;
