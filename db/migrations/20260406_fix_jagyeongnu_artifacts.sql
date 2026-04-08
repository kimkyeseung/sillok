-- ============================================================
-- 자격루 데이터 수정
-- 1) 1434 원작 자격루 (장영실 제작) ARTIFACT 신규 추가
-- 2) 기존 1536 창경궁 자격루: 세종 → 중종 연결 변경
-- 3) 양쪽 metadata에 related_slug 상호 참조
-- ============================================================

BEGIN;

-- 1. 원작 자격루 (1434) 추가
INSERT INTO nodes (slug, node_type, title, description, thumbnail, metadata, is_published)
VALUES (
  'jagyeongnu-original',
  'ARTIFACT',
  'Jagyeongnu (Original Water Clock by Jang Yeong-sil)',
  'The original self-striking water clock invented by Jang Yeong-sil in 1434 under the patronage of King Sejong. It automatically marked the hours by striking bells and drums using a system of bronze balls triggered by water flow — a remarkable feat of 15th-century mechanical engineering.',
  'https://upload.wikimedia.org/wikipedia/commons/6/67/BoRuGak_Jagyeongnu.JPG',
  '{
    "category": "craft",
    "material": "Bronze, Wood",
    "designation": "Historical Record",
    "designation_ko": "자격루 (원작)",
    "created_year": 1434,
    "created_period": "Joseon Dynasty (1434)",
    "location": "Gyeongbokgung Palace (original, lost)",
    "location_ko": "경복궁 (원본 소실)",
    "related_slug": "changgyeonggung-jagyeongnu"
  }'::jsonb,
  true
);

-- 2. 원작 자격루에 장영실 + 세종 연결
INSERT INTO person_node_links (person_id, node_id)
SELECT 'c7998fb6-75fb-40be-9701-5f6208ba13a8'::uuid, id
FROM nodes WHERE slug = 'jagyeongnu-original';

INSERT INTO person_node_links (person_id, node_id)
SELECT '84246e6d-9917-4f83-83a4-56f4bf3918fc'::uuid, id
FROM nodes WHERE slug = 'jagyeongnu-original';

-- 3. 기존 창경궁 자격루: 세종 연결 제거, 중종 연결 추가
DELETE FROM person_node_links
WHERE person_id = '84246e6d-9917-4f83-83a4-56f4bf3918fc'
  AND node_id = (SELECT id FROM nodes WHERE slug = 'changgyeonggung-jagyeongnu');

INSERT INTO person_node_links (person_id, node_id)
SELECT '1d33830e-76a9-4257-8183-4486e2a2c01f'::uuid, id
FROM nodes WHERE slug = 'changgyeonggung-jagyeongnu'
ON CONFLICT (person_id, node_id) DO NOTHING;

-- 4. 창경궁 자격루 metadata에 related_slug 추가
UPDATE nodes
SET metadata = metadata || '{"related_slug": "jagyeongnu-original"}'::jsonb
WHERE slug = 'changgyeonggung-jagyeongnu';

COMMIT;
