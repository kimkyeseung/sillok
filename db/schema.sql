-- ============================================================
-- Sillok (실록) — 전체 DB 스키마
-- Supabase (PostgreSQL) 기준
-- SPEC v2.0 섹션 4 기반 — 29개 테이블
-- ============================================================

-- 확장 모듈
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- ENUM 타입
-- ============================================================

CREATE TYPE relation_type AS ENUM (
  'FAMILY',        -- 가족/혈연 (양방향)
  'TEACHER',       -- 스승/제자 (단방향: from=스승, to=제자)
  'ALLY',          -- 협력자/동지 (양방향)
  'RIVAL',         -- 대립/적대 (양방향)
  'LORD_VASSAL',   -- 군신 관계 (단방향: from=왕, to=신하)
  'INFLUENCE'      -- 영향 (단방향: from=영향을 준 사람, to=받은 사람)
);

-- ============================================================
-- 공통 updated_at 트리거 함수
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. profiles (유저 프로필) — auth.users 참조
-- ============================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname      TEXT UNIQUE,
  avatar_url    TEXT,
  role          TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  is_banned     BOOLEAN DEFAULT FALSE,
  ban_until     TIMESTAMPTZ,
  warning_count INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. persons (인물)
-- ============================================================

CREATE TABLE persons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  name_ko          TEXT NOT NULL,
  name_hanja       TEXT,
  name_en          TEXT,
  birth_year       INTEGER,
  birth_date       TEXT,
  death_year       INTEGER,
  death_date       TEXT,
  birth_place      TEXT,
  summary          TEXT,
  thumbnail        TEXT,
  is_controversial BOOLEAN DEFAULT FALSE,
  is_alive         BOOLEAN DEFAULT FALSE,
  is_published     BOOLEAN DEFAULT FALSE,
  is_deleted       BOOLEAN DEFAULT FALSE,
  view_count       INTEGER DEFAULT 0,
  follow_count     INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX persons_name_ko_trgm    ON persons USING gin(name_ko gin_trgm_ops);
CREATE INDEX persons_name_hanja_trgm ON persons USING gin(name_hanja gin_trgm_ops);
CREATE INDEX persons_birth_year_idx  ON persons (birth_year);
CREATE INDEX persons_is_published_idx ON persons (is_published) WHERE is_deleted = FALSE;
CREATE INDEX persons_birth_date_idx  ON persons (birth_date);
CREATE INDEX persons_death_date_idx  ON persons (death_date);

CREATE TRIGGER persons_updated_at
  BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. tags (태그)
-- ============================================================

CREATE TABLE tags (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL,
  type  TEXT NOT NULL CHECK (type IN ('ERA', 'FIELD', 'CUSTOM'))
);

-- ============================================================
-- 4. person_tags (인물-태그 연결)
-- ============================================================

CREATE TABLE person_tags (
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  tag_id    UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, tag_id)
);

CREATE INDEX person_tags_person_id_idx ON person_tags (person_id);
CREATE INDEX person_tags_tag_id_idx    ON person_tags (tag_id);

-- ============================================================
-- 5. nodes (노드: 유물/미디어/사건)
-- ============================================================

CREATE TABLE nodes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  node_type    TEXT NOT NULL CHECK (node_type IN ('ARTIFACT', 'MEDIA', 'EVENT')),
  title        TEXT NOT NULL,
  description  TEXT,
  thumbnail    TEXT,
  metadata     JSONB,
  is_published BOOLEAN DEFAULT FALSE,
  is_deleted   BOOLEAN DEFAULT FALSE,
  view_count   INTEGER DEFAULT 0,
  follow_count INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX nodes_title_trgm ON nodes USING gin(title gin_trgm_ops);
CREATE INDEX nodes_type_idx   ON nodes (node_type) WHERE is_deleted = FALSE;

CREATE TRIGGER nodes_updated_at
  BEFORE UPDATE ON nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. person_node_links (인물-노드 연결)
-- ============================================================

CREATE TABLE person_node_links (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  node_id   UUID REFERENCES nodes(id) ON DELETE CASCADE,
  link_type TEXT,
  UNIQUE (person_id, node_id)
);

CREATE INDEX person_node_links_person_id_idx ON person_node_links (person_id);
CREATE INDEX person_node_links_node_id_idx   ON person_node_links (node_id);

-- ============================================================
-- 7. person_relations (인물 간 관계)
-- ============================================================

CREATE TABLE person_relations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  to_person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  relation_type  relation_type NOT NULL,
  description    TEXT,
  source_url     TEXT,
  is_approved    BOOLEAN DEFAULT FALSE,
  suggested_by   UUID REFERENCES auth.users(id),
  approved_by    UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (from_person_id, to_person_id, relation_type)
);

CREATE INDEX person_relations_from_idx ON person_relations (from_person_id);
CREATE INDEX person_relations_to_idx   ON person_relations (to_person_id);

-- 양방향 관계 조회 헬퍼 함수
CREATE OR REPLACE FUNCTION get_person_relations(p_id UUID)
RETURNS TABLE (
  relation_id     UUID,
  other_person_id UUID,
  rel_type        relation_type,
  direction       TEXT,
  rel_description TEXT
) AS $$
  SELECT
    id, to_person_id, relation_type,
    CASE WHEN relation_type IN ('FAMILY','ALLY','RIVAL') THEN 'both' ELSE 'outgoing' END,
    description
  FROM person_relations
  WHERE from_person_id = p_id AND is_approved = TRUE
  UNION ALL
  SELECT
    id, from_person_id, relation_type,
    CASE WHEN relation_type IN ('FAMILY','ALLY','RIVAL') THEN 'both' ELSE 'incoming' END,
    description
  FROM person_relations
  WHERE to_person_id = p_id AND is_approved = TRUE
    AND relation_type NOT IN ('FAMILY','ALLY','RIVAL')
$$ LANGUAGE sql;

-- ============================================================
-- 8. threads (스레드)
-- ============================================================

CREATE TABLE threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES profiles(id),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  video_url   TEXT,
  is_pinned   BOOLEAN DEFAULT FALSE,
  is_deleted  BOOLEAN DEFAULT FALSE,
  view_count  INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  like_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX threads_person_id_idx   ON threads (person_id) WHERE is_deleted = FALSE;
CREATE INDEX threads_author_id_idx   ON threads (author_id);
CREATE INDEX threads_created_at_idx  ON threads (created_at DESC);

CREATE TRIGGER threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 9. thread_replies (스레드 댓글)
-- ============================================================

CREATE TABLE thread_replies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES thread_replies(id) ON DELETE SET NULL,
  author_id  UUID REFERENCES profiles(id),
  content    TEXT NOT NULL,
  depth      INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX thread_replies_thread_id_idx ON thread_replies (thread_id);
CREATE INDEX thread_replies_parent_id_idx ON thread_replies (parent_id);

CREATE TRIGGER thread_replies_updated_at
  BEFORE UPDATE ON thread_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 10. thread_images (스레드 이미지, 최대 3장)
-- ============================================================

CREATE TABLE thread_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT max_images_per_thread CHECK (sort_order BETWEEN 0 AND 2)
);

CREATE INDEX thread_images_thread_id_idx ON thread_images (thread_id, sort_order);

-- ============================================================
-- 11. node_comments (노드 댓글)
-- ============================================================

CREATE TABLE node_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id    UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES profiles(id),
  content    TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX node_comments_node_id_idx ON node_comments (node_id) WHERE is_deleted = FALSE;

CREATE TRIGGER node_comments_updated_at
  BEFORE UPDATE ON node_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 12. view_logs (조회 로그 — race condition 방지)
-- ============================================================

CREATE TABLE view_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('PERSON', 'NODE', 'THREAD')),
  target_id   UUID NOT NULL,
  viewer_ip   TEXT,
  viewed_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX view_logs_target_idx ON view_logs (target_type, target_id, viewed_at);

-- ============================================================
-- 13. person_timeline (인물 타임라인)
-- ============================================================

CREATE TABLE person_timeline (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  year        INTEGER NOT NULL,
  month       INTEGER CHECK (month BETWEEN 1 AND 12),
  title       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER DEFAULT 0
);

CREATE INDEX person_timeline_person_id_idx ON person_timeline (person_id);

-- ============================================================
-- 14. person_requests (인물 추가 요청)
-- ============================================================

CREATE TABLE person_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID REFERENCES profiles(id),
  name_ko         TEXT NOT NULL,
  birth_year      INTEGER,
  death_year      INTEGER,
  reason          TEXT NOT NULL,
  source_url      TEXT NOT NULL,
  status          TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_note      TEXT,
  duplicate_count INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX person_requests_status_idx ON person_requests (status, duplicate_count DESC);

CREATE TRIGGER person_requests_updated_at
  BEFORE UPDATE ON person_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 15. reports (신고)
-- ============================================================

CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('THREAD', 'THREAD_REPLY', 'NODE_COMMENT')),
  target_id   UUID NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
  resolved_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (reporter_id, target_type, target_id)
);

CREATE INDEX reports_status_idx ON reports (status, created_at ASC);

-- ============================================================
-- 16. collections (컬렉션)
-- ============================================================

CREATE TABLE collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  title       TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN DEFAULT TRUE,
  item_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX collections_user_id_idx ON collections (user_id);
CREATE INDEX collections_public_idx  ON collections (is_public, created_at DESC);

CREATE TRIGGER collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 17. collection_items (컬렉션 아이템)
-- ============================================================

CREATE TABLE collection_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  person_id     UUID REFERENCES persons(id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (collection_id, person_id)
);

CREATE INDEX collection_items_collection_id_idx ON collection_items (collection_id);

-- ============================================================
-- 18. notifications (알림)
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
    'THREAD_REPLY',
    'REPLY_REPLY',
    'THREAD_LIKED',
    'FOLLOW_UPDATE',
    'REQUEST_APPROVED',
    'REQUEST_REJECTED',
    'RELATION_APPROVED',
    'RELATION_REJECTED',
    'WARNING'
  )),
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  source_id   UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_id_idx ON notifications (user_id, is_read, created_at DESC);

-- ============================================================
-- 19. warning_logs (경고 이력)
-- ============================================================

CREATE TABLE warning_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id    UUID REFERENCES auth.users(id),
  reason      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX warning_logs_user_id_idx ON warning_logs (user_id, created_at DESC);

-- ============================================================
-- 20. articles (운영진 아티클/공지)
-- ============================================================

CREATE TABLE articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  summary      TEXT,
  thumbnail    TEXT,
  tag          TEXT NOT NULL CHECK (tag IN ('기획', '특집', '인물탐구', '현대', '공지', '안내')),
  is_notice    BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  is_deleted   BOOLEAN DEFAULT FALSE,
  author_id    UUID REFERENCES auth.users(id),
  view_count   INTEGER DEFAULT 0,
  like_count   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX articles_published_idx ON articles (is_published, created_at DESC);
CREATE INDEX articles_notice_idx    ON articles (is_notice, created_at DESC) WHERE is_published = TRUE;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 21. person_of_day_votes (오늘의 인물 투표)
-- ============================================================

CREATE TABLE person_of_day_votes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  vote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, vote_date)
);

CREATE INDEX person_of_day_votes_date_idx ON person_of_day_votes (vote_date, person_id);

-- ============================================================
-- 22. person_translations (인물 번역)
-- ============================================================

CREATE TABLE person_translations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id        UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  locale           TEXT NOT NULL CHECK (locale IN ('en', 'ja')),
  summary          TEXT,
  birth_place      TEXT,
  is_ai_translated BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (person_id, locale)
);

CREATE INDEX person_translations_idx ON person_translations (person_id, locale);

CREATE TRIGGER person_translations_updated_at
  BEFORE UPDATE ON person_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 23. node_translations (노드 번역)
-- ============================================================

CREATE TABLE node_translations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id          UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  locale           TEXT NOT NULL CHECK (locale IN ('en', 'ja')),
  title            TEXT,
  description      TEXT,
  is_ai_translated BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (node_id, locale)
);

CREATE TRIGGER node_translations_updated_at
  BEFORE UPDATE ON node_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 24. person_timeline_translations (타임라인 번역)
-- ============================================================

CREATE TABLE person_timeline_translations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id      UUID NOT NULL REFERENCES person_timeline(id) ON DELETE CASCADE,
  locale           TEXT NOT NULL CHECK (locale IN ('en', 'ja')),
  title            TEXT,
  description      TEXT,
  is_ai_translated BOOLEAN DEFAULT TRUE,
  UNIQUE (timeline_id, locale)
);

-- ============================================================
-- 25. likes (좋아요 통합)
-- ============================================================

CREATE TABLE likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'reply', 'node_comment', 'article')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX likes_target_idx ON likes (target_type, target_id);
CREATE INDEX likes_user_idx   ON likes (user_id, created_at DESC);

-- ============================================================
-- 26. follows (팔로우: 인물/노드 대상만)
-- ============================================================

CREATE TABLE follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('person', 'node')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX follows_user_idx   ON follows (user_id, created_at DESC);
CREATE INDEX follows_target_idx ON follows (target_type, target_id);

-- ============================================================
-- 27. subscriptions (Sillok Plus 구독)
-- ============================================================

CREATE TABLE subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                     TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status                   TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
  current_period_start     TIMESTAMPTZ NOT NULL,
  current_period_end       TIMESTAMPTZ NOT NULL,
  payment_provider         TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'toss')),
  provider_subscription_id TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX subscriptions_status_idx ON subscriptions (status, current_period_end);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 28. awards (어워드)
-- ============================================================

CREATE TABLE awards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'comment')),
  target_id   UUID NOT NULL,
  award_type  TEXT NOT NULL CHECK (award_type IN ('certification', 'prose', 'wow', 'debate', 'sillok')),
  amount_krw  INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX awards_receiver_idx ON awards (receiver_id, created_at DESC);
CREATE INDEX awards_target_idx   ON awards (target_type, target_id);

-- ============================================================
-- 29. curator_roles (자원봉사 큐레이터)
-- ============================================================

CREATE TABLE curator_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type   TEXT NOT NULL CHECK (role_type IN ('era', 'field', 'global')),
  role_value  TEXT NOT NULL,
  granted_by  UUID REFERENCES auth.users(id),
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, role_type, role_value)
);

-- ============================================================
-- 트리거: 댓글 depth 자동 계산
-- ============================================================

CREATE OR REPLACE FUNCTION calc_reply_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.depth = 0;
  ELSE
    SELECT depth + 1 INTO NEW.depth
    FROM thread_replies WHERE id = NEW.parent_id;
    IF NEW.depth IS NULL THEN
      NEW.depth = 0;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER thread_replies_calc_depth
  BEFORE INSERT ON thread_replies
  FOR EACH ROW EXECUTE FUNCTION calc_reply_depth();

-- ============================================================
-- 트리거: threads.reply_count 동기화
-- ============================================================

CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = FALSE THEN
    UPDATE threads SET reply_count = reply_count + 1 WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
    UPDATE threads SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
    UPDATE threads SET reply_count = reply_count + 1 WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER thread_replies_count_sync
  AFTER INSERT OR UPDATE OF is_deleted ON thread_replies
  FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- ============================================================
-- 트리거: like_count 동기화 (threads / thread_replies / node_comments)
-- ============================================================

CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'thread' THEN
      UPDATE threads SET like_count = like_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'reply' THEN
      UPDATE thread_replies SET like_count = like_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'node_comment' THEN
      UPDATE node_comments SET like_count = like_count + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'thread' THEN
      UPDATE threads SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'reply' THEN
      UPDATE thread_replies SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'node_comment' THEN
      UPDATE node_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER likes_count_sync
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- ============================================================
-- 트리거: follow_count 동기화 (persons / nodes)
-- ============================================================

CREATE OR REPLACE FUNCTION update_follow_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'person' THEN
      UPDATE persons SET follow_count = follow_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'node' THEN
      UPDATE nodes SET follow_count = follow_count + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'person' THEN
      UPDATE persons SET follow_count = GREATEST(follow_count - 1, 0) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'node' THEN
      UPDATE nodes SET follow_count = GREATEST(follow_count - 1, 0) WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follows_count_sync
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_count();

-- ============================================================
-- 트리거: collections.item_count 동기화
-- ============================================================

CREATE OR REPLACE FUNCTION update_collection_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections SET item_count = item_count + 1 WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections SET item_count = GREATEST(item_count - 1, 0) WHERE id = OLD.collection_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER collection_items_count_sync
  AFTER INSERT OR DELETE ON collection_items
  FOR EACH ROW EXECUTE FUNCTION update_collection_item_count();

-- ============================================================
-- 트리거: profiles 자동 생성 (auth.users 가입 시)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _nickname TEXT;
BEGIN
  _nickname := NEW.raw_user_meta_data ->> 'nickname';

  -- nickname이 없거나 빈 문자열이면 fallback 생성
  IF _nickname IS NULL OR _nickname = '' THEN
    _nickname := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;

  -- 중복 시 suffix 추가
  IF EXISTS (SELECT 1 FROM profiles WHERE nickname = _nickname) THEN
    _nickname := _nickname || '_' || substr(NEW.id::text, 1, 4);
  END IF;

  INSERT INTO profiles (id, nickname)
  VALUES (NEW.id, _nickname);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- pg_cron 작업 (Supabase Dashboard에서 설정)
-- ============================================================

-- 1. 정지 해제 자동화 (매 시간)
-- SELECT cron.schedule('unban-users', '0 * * * *',
--   $$UPDATE profiles SET is_banned = FALSE WHERE ban_until < NOW() AND is_banned = TRUE$$
-- );

-- 2. view_count 배치 집계 (5분마다)
-- SELECT cron.schedule('aggregate-views', '*/5 * * * *',
--   $$
--   UPDATE persons p SET view_count = sub.cnt
--   FROM (
--     SELECT target_id, COUNT(DISTINCT viewer_ip) as cnt
--     FROM view_logs
--     WHERE target_type = 'PERSON' AND viewed_at > NOW() - INTERVAL '24 hours'
--     GROUP BY target_id
--   ) sub
--   WHERE p.id = sub.target_id;
--
--   UPDATE nodes n SET view_count = sub.cnt
--   FROM (
--     SELECT target_id, COUNT(DISTINCT viewer_ip) as cnt
--     FROM view_logs
--     WHERE target_type = 'NODE' AND viewed_at > NOW() - INTERVAL '24 hours'
--     GROUP BY target_id
--   ) sub
--   WHERE n.id = sub.target_id;
--
--   UPDATE threads t SET view_count = sub.cnt
--   FROM (
--     SELECT target_id, COUNT(DISTINCT viewer_ip) as cnt
--     FROM view_logs
--     WHERE target_type = 'THREAD' AND viewed_at > NOW() - INTERVAL '24 hours'
--     GROUP BY target_id
--   ) sub
--   WHERE t.id = sub.target_id;
--   $$
-- );

-- 3. 오래된 view_logs 정리 (매일 자정)
-- SELECT cron.schedule('cleanup-view-logs', '0 0 * * *',
--   $$DELETE FROM view_logs WHERE viewed_at < NOW() - INTERVAL '7 days'$$
-- );

-- ============================================================
-- 기본 태그 데이터 (시드)
-- ============================================================

INSERT INTO tags (name, type) VALUES
  -- ERA (시대)
  ('고대', 'ERA'),
  ('삼국', 'ERA'),
  ('고려', 'ERA'),
  ('조선', 'ERA'),
  ('근현대', 'ERA'),
  -- FIELD (분야)
  ('왕', 'FIELD'),
  ('장군', 'FIELD'),
  ('예술가', 'FIELD'),
  ('독립운동가', 'FIELD'),
  ('학자', 'FIELD'),
  ('정치인', 'FIELD'),
  ('스포츠', 'FIELD'),
  ('문화/예능', 'FIELD'),
  ('기업인', 'FIELD'),
  ('종교인', 'FIELD');
