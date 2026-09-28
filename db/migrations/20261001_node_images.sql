-- ============================================================
-- node_images — gallery images for nodes (heritage artifacts first)
--
-- Filled by scripts/enrich-heritage.mts from the Korea Heritage Service image API.
-- Images are NOT mirrored to Storage — `url` points at khs.go.kr.
-- Only commercially usable KOGL licenses are stored:
--   kogl-1 (Type 1: attribution)            → any use, crop OK
--   kogl-3 (Type 3: attribution + no change) → shown uncropped only
-- Type 2/4 (non-commercial) images are never inserted.
--
-- RLS on, no policies → service role only. Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS node_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id     UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption_ko  TEXT,
  caption_en  TEXT,
  license     TEXT NOT NULL CHECK (license IN ('kogl-1', 'kogl-3')),
  source      TEXT NOT NULL DEFAULT 'khs',
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (node_id, url)
);

CREATE INDEX IF NOT EXISTS node_images_node_idx ON node_images (node_id, sort_order);
ALTER TABLE node_images ENABLE ROW LEVEL SECURITY;
