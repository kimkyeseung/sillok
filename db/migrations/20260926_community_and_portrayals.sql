-- ============================================================
-- Phase 3: community features + portrayals
-- - person_node_links.portrayed_by : actor who played the person in a film/drama
-- - person polls (choice-based, one vote per user, no ratings)
-- - personal status (Studied / Visited / Want to learn)
-- - threads.category (forum-style sections)
-- - person_suggestions ("Suggest a fact" → admin review)
-- New tables: RLS on, no policies → server (service role) access only.
-- ============================================================

-- 1. Portrayals
ALTER TABLE person_node_links ADD COLUMN IF NOT EXISTS portrayed_by TEXT;

-- 2. Polls
CREATE TABLE IF NOT EXISTS person_polls (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS person_polls_person_idx ON person_polls (person_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS person_poll_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     UUID NOT NULL REFERENCES person_polls(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS person_poll_options_poll_idx ON person_poll_options (poll_id, sort_order);

CREATE TABLE IF NOT EXISTS person_poll_votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     UUID NOT NULL REFERENCES person_polls(id) ON DELETE CASCADE,
  option_id   UUID NOT NULL REFERENCES person_poll_options(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (poll_id, user_id)
);
CREATE INDEX IF NOT EXISTS person_poll_votes_poll_idx ON person_poll_votes (poll_id, option_id);

-- 3. Personal status
CREATE TABLE IF NOT EXISTS person_user_status (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('STUDIED', 'VISITED', 'WANT_TO_LEARN')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (person_id, user_id, status)
);
CREATE INDEX IF NOT EXISTS person_user_status_person_idx ON person_user_status (person_id, status);

-- 4. Thread categories
ALTER TABLE threads ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'DISCUSSION';
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_category_check;
ALTER TABLE threads ADD CONSTRAINT threads_category_check
  CHECK (category IN ('DISCUSSION', 'TRIVIA', 'QNA', 'SOURCES', 'MEDIA'));
CREATE INDEX IF NOT EXISTS threads_category_idx ON threads (category) WHERE is_deleted = FALSE;

-- 5. Suggestions ("Suggest a fact")
CREATE TABLE IF NOT EXISTS person_suggestions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id    UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('FACT', 'ACHIEVEMENT', 'TRIVIA', 'SOURCE', 'CORRECTION')),
  content      TEXT NOT NULL,
  source_url   TEXT,
  status       TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_note   TEXT,
  reviewed_by  UUID REFERENCES auth.users(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS person_suggestions_status_idx ON person_suggestions (status, created_at);

ALTER TABLE person_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_suggestions ENABLE ROW LEVEL SECURITY;
