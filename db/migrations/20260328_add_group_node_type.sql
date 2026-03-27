-- ============================================================
-- GROUP 노드 타입 추가 + 새 관계 타입 (MEMBER_OF, FOUNDED, AFFILIATED)
-- 2026-03-28
-- ============================================================

-- ▶ STEP 1: 먼저 실행
-- 1. nodes.node_type CHECK 제약 변경: GROUP 추가
ALTER TABLE nodes DROP CONSTRAINT IF EXISTS nodes_node_type_check;
ALTER TABLE nodes ADD CONSTRAINT nodes_node_type_check
  CHECK (node_type IN ('ARTIFACT', 'MEDIA', 'EVENT', 'GROUP'));

-- 2. relation_type ENUM에 새 값 추가
ALTER TYPE relation_type ADD VALUE IF NOT EXISTS 'MEMBER_OF';
ALTER TYPE relation_type ADD VALUE IF NOT EXISTS 'FOUNDED';
ALTER TYPE relation_type ADD VALUE IF NOT EXISTS 'AFFILIATED';

-- ▶ STEP 2: STEP 1 커밋 후 별도 실행 (새 ENUM 값은 커밋 후 사용 가능)
-- 3. get_person_relations 함수 업데이트 (새 양방향: AFFILIATED)
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
    CASE WHEN relation_type IN ('FAMILY','ALLY','RIVAL','AFFILIATED') THEN 'both' ELSE 'outgoing' END,
    description
  FROM person_relations
  WHERE from_person_id = p_id AND is_approved = TRUE
  UNION ALL
  SELECT
    id, from_person_id, relation_type,
    CASE WHEN relation_type IN ('FAMILY','ALLY','RIVAL','AFFILIATED') THEN 'both' ELSE 'incoming' END,
    description
  FROM person_relations
  WHERE to_person_id = p_id AND is_approved = TRUE
    AND relation_type NOT IN ('FAMILY','ALLY','RIVAL','AFFILIATED')
$$ LANGUAGE sql;
