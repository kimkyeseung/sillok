-- ============================================================
-- FAMILY relation roles + bidirectional relation lookup fix
-- ============================================================

-- 1. family_role: structure for FAMILY relations (used by the family tree)
--    PARENT  : from_person_id is the parent of to_person_id
--    SPOUSE  : from_person_id and to_person_id are spouses
--    SIBLING : from_person_id and to_person_id are siblings
--    NULL    : other family ties (e.g. uncle/nephew) — not drawn in the tree
ALTER TABLE person_relations
  ADD COLUMN IF NOT EXISTS family_role TEXT
    CHECK (family_role IN ('PARENT', 'SPOUSE', 'SIBLING'));

ALTER TABLE person_relations
  DROP CONSTRAINT IF EXISTS person_relations_family_role_type_check;
ALTER TABLE person_relations
  ADD CONSTRAINT person_relations_family_role_type_check
    CHECK (family_role IS NULL OR relation_type = 'FAMILY');

-- 2. Backfill existing FAMILY relations from their descriptions
UPDATE person_relations SET family_role = 'PARENT'
WHERE relation_type = 'FAMILY' AND family_role IS NULL
  AND (description ILIKE 'Father and %' OR description ILIKE 'Mother and %');

UPDATE person_relations SET family_role = 'SPOUSE'
WHERE relation_type = 'FAMILY' AND family_role IS NULL
  AND (description ILIKE 'King and %' OR description ILIKE 'Husband and wife%');

UPDATE person_relations SET family_role = 'SIBLING'
WHERE relation_type = 'FAMILY' AND family_role IS NULL
  AND (description ILIKE 'Sister and %' OR description ILIKE 'Brother and %');

-- 3. Fix get_person_relations: bidirectional relations (FAMILY/ALLY/RIVAL/AFFILIATED)
--    were only returned for the from_person side. Return them for both sides,
--    skipping the incoming row when the reverse row of the same type also exists.
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
    r.id, r.from_person_id, r.relation_type,
    CASE WHEN r.relation_type IN ('FAMILY','ALLY','RIVAL','AFFILIATED') THEN 'both' ELSE 'incoming' END,
    r.description
  FROM person_relations r
  WHERE r.to_person_id = p_id AND r.is_approved = TRUE
    AND (
      r.relation_type NOT IN ('FAMILY','ALLY','RIVAL','AFFILIATED')
      OR NOT EXISTS (
        SELECT 1 FROM person_relations rev
        WHERE rev.from_person_id = p_id
          AND rev.to_person_id = r.from_person_id
          AND rev.relation_type = r.relation_type
          AND rev.is_approved = TRUE
      )
    )
$$ LANGUAGE sql;
