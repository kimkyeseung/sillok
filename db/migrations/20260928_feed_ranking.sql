-- ============================================================
-- Feed ranking for the Reddit-style home feed
-- - threads.hot_score : gravity-decayed score (same formula as ranking tests)
--     (1 + replies * 0.5 + likes) / (age_days + 2) ^ 1.5
-- - threads.top_score : likes + replies (for "Top" sorting)
-- hot_score is refreshed on like/reply changes (trigger) and every 15 minutes
-- for time decay (pg_cron, when the extension is available).
-- ============================================================

ALTER TABLE threads ADD COLUMN IF NOT EXISTS hot_score DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS top_score INTEGER
  GENERATED ALWAYS AS (COALESCE(like_count, 0) + COALESCE(reply_count, 0)) STORED;

CREATE OR REPLACE FUNCTION thread_hot_score(likes INTEGER, replies INTEGER, created TIMESTAMPTZ)
RETURNS DOUBLE PRECISION AS $$
  SELECT (1 + COALESCE(replies, 0) * 0.5 + COALESCE(likes, 0))
       / power(GREATEST(EXTRACT(EPOCH FROM (NOW() - created)) / 86400.0, 0) + 2, 1.5)
$$ LANGUAGE sql STABLE;

-- Keep a row's score current when its engagement changes
CREATE OR REPLACE FUNCTION set_thread_hot_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hot_score = thread_hot_score(NEW.like_count, NEW.reply_count, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS threads_hot_score ON threads;
CREATE TRIGGER threads_hot_score
  BEFORE INSERT OR UPDATE OF like_count, reply_count ON threads
  FOR EACH ROW EXECUTE FUNCTION set_thread_hot_score();

-- updated_at should mean "content edited" — not score, like or reply-count changes.
-- (Otherwise the 15-minute refresh would mark every thread as modified in the sitemap.)
DROP TRIGGER IF EXISTS threads_updated_at ON threads;
CREATE TRIGGER threads_updated_at
  BEFORE UPDATE OF title, content, video_url, category, person_id, is_pinned, is_deleted ON threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Batch refresh for time decay
CREATE OR REPLACE FUNCTION refresh_thread_hot_scores()
RETURNS void AS $$
  UPDATE threads
  SET hot_score = thread_hot_score(like_count, reply_count, created_at)
  WHERE is_deleted = FALSE;
$$ LANGUAGE sql;

SELECT refresh_thread_hot_scores();

CREATE INDEX IF NOT EXISTS threads_feed_hot_idx ON threads (hot_score DESC, id DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS threads_feed_top_idx ON threads (top_score DESC, id DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS threads_feed_new_idx ON threads (created_at DESC, id DESC) WHERE is_deleted = FALSE;

-- Schedule the decay refresh when pg_cron is installed (Supabase: Database → Extensions)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('refresh-thread-hot-scores', '*/15 * * * *', 'SELECT refresh_thread_hot_scores()');
  END IF;
END $$;
