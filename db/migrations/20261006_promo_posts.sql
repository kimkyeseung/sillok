-- ============================================================
-- promo_posts — Share kit: social copy per thread and where it was posted
--
-- One row per platform (and per subreddit for Reddit). Drafts are written by
-- Claude or by hand in /admin/promo; an admin posts them manually and records
-- the URL (status 'posted') so the same thread isn't promoted twice.
-- RLS on, no policies → service role only. Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS promo_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('instagram', 'reddit', 'x', 'threads')),
  target          TEXT,                  -- reddit: subreddit name (no "r/")
  title           TEXT,                  -- reddit post title
  body            TEXT NOT NULL DEFAULT '',
  hashtags        TEXT[] NOT NULL DEFAULT '{}',
  alt_text        TEXT,                  -- instagram image description
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted')),
  posted_url      TEXT,
  posted_at       TIMESTAMPTZ,
  created_by      UUID REFERENCES profiles(id),
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS promo_posts_thread_idx ON promo_posts (thread_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS promo_posts_posted_idx ON promo_posts (platform, posted_at DESC) WHERE status = 'posted' AND is_deleted = FALSE;

DROP TRIGGER IF EXISTS promo_posts_updated_at ON promo_posts;
CREATE TRIGGER promo_posts_updated_at
  BEFORE UPDATE ON promo_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE promo_posts ENABLE ROW LEVEL SECURITY;
