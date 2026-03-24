-- Add like_count to articles
ALTER TABLE articles ADD COLUMN like_count INTEGER DEFAULT 0;

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'reply', 'node_comment', 'article')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS likes_target_idx ON likes (target_type, target_id);
CREATE INDEX IF NOT EXISTS likes_user_idx   ON likes (user_id, created_at DESC);
