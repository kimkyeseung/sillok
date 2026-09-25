-- ============================================================
-- Age-flow: move hardcoded kings/wars into the DB
--
-- 1. reigns — reign periods (was JOSEON_KINGS in useAgeFlow.ts).
--    One row per reign; a king who returned to the throne has two rows.
--    RLS on, no policies → service role only.
-- 2. Wars = EVENT nodes with metadata.end_year (was WARS in useAgeFlow.ts).
--    Age-flow shows EVENT nodes of type war/revolt that have an end_year as
--    "At War"; participants are person_node_links (link_type PARTICIPANT).
--    Existing nodes keep their title/description — only end_year is merged.
--
-- Idempotent. Rows for persons that don't exist are skipped (join).
-- Run BEFORE deploying the matching code (age-flow reads reigns).
-- ============================================================

-- ── 1. reigns ──

CREATE TABLE IF NOT EXISTS reigns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id    UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  reign_start  INTEGER NOT NULL,
  reign_end    INTEGER NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CHECK (reign_end >= reign_start),
  UNIQUE (person_id, reign_start)
);
CREATE INDEX IF NOT EXISTS reigns_start_idx ON reigns (reign_start);
ALTER TABLE reigns ENABLE ROW LEVEL SECURITY;

INSERT INTO reigns (person_id, reign_start, reign_end)
SELECT p.id, v.reign_start, v.reign_end
FROM (VALUES
  -- Late Goryeo
  ('chungsuk-wang-wang-man',    1313, 1330),
  ('chung-hye-wang-wang-jeong', 1330, 1332),
  ('chungsuk-wang-wang-man',    1332, 1339),
  ('chung-hye-wang-wang-jeong', 1339, 1344),
  ('chungmok-wang-wang-heun',   1344, 1348),
  ('chungjeong-wang-wang-jeo',  1349, 1351),
  ('gongmin-wang-wang-jeon',    1351, 1374),
  ('u-wang-wang-u',             1374, 1388),
  ('chang-wang-wang-chang',     1388, 1389),
  ('gongyang-wang-wang-yo',     1389, 1392),
  -- Joseon
  ('taejo-yi-seong-gye',    1392, 1398),
  ('jeongjong-yi-bang-gwa', 1399, 1400),
  ('taejong-yi-bang-won',   1400, 1418),
  ('sejong-daewang',        1418, 1450),
  ('munjong-yi-hyang',      1450, 1452),
  ('danjong-yi-hong-wi',    1452, 1455),
  ('sejo-yi-yu',            1455, 1468),
  ('yejong-yi-hwang',       1468, 1469),
  ('seongjong-yi-hyeol',    1469, 1494),
  ('yeonsangun-yi-yung',    1494, 1506),
  ('jungjong-yi-yeok',      1506, 1544),
  ('injong-yi-ho',          1544, 1545),
  ('myeongjong-yi-hwan',    1545, 1567),
  ('seonjo-yi-yeon',        1567, 1608),
  ('gwanghaegun-yi-hon',    1608, 1623),
  ('injo-yi-jong',          1623, 1649),
  ('hyojong-yi-ho',         1649, 1659),
  ('hyeonjong-yi-yeon',     1659, 1674),
  ('sukjong-yi-sun',        1674, 1720),
  ('gyeongjong-yi-yun',     1720, 1724),
  ('yeongjo-yi-geum',       1724, 1776),
  ('jeongjo-yi-san',        1776, 1800),
  ('sunjo-yi-gong',         1800, 1834),
  ('heonjong-yi-hwan',      1834, 1849),
  ('cheoljong-yi-byeon',    1849, 1863),
  ('gojong-yi-myeong-bok',  1863, 1907),
  ('sunjong-yi-cheok',      1907, 1910)
) AS v(slug, reign_start, reign_end)
JOIN persons p ON p.slug = v.slug
ON CONFLICT (person_id, reign_start) DO NOTHING;

-- ── 2. War periods on EVENT nodes ──

INSERT INTO nodes (slug, node_type, title, description, metadata, is_published)
VALUES
  ('red-turban-invasions', 'EVENT', 'Red Turban Invasions',
   'Red Turban rebels from Yuan China invade Goryeo twice, briefly taking Kaesong before being driven out.',
   '{"start_year": 1359, "end_year": 1362, "event_type": "war", "title_ko": "홍건적의 침입"}', TRUE),
  ('imjin-war', 'EVENT', 'Imjin War',
   'Japan under Toyotomi Hideyoshi invades Korea. Admiral Yi Sun-sin leads naval defense.',
   '{"start_year": 1592, "end_year": 1598, "event_type": "war", "title_ko": "임진왜란"}', TRUE),
  ('jeongmyo-horan', 'EVENT', 'First Manchu Invasion',
   'Later Jin (Manchu) invades Joseon, forcing a brotherly alliance.',
   '{"start_year": 1627, "end_year": 1627, "event_type": "war", "title_ko": "정묘호란"}', TRUE),
  ('byeongja-horan', 'EVENT', 'Second Manchu Invasion',
   'Qing dynasty invades Joseon. King Injo surrenders at Namhansanseong.',
   '{"start_year": 1636, "end_year": 1637, "event_type": "war", "title_ko": "병자호란"}', TRUE),
  ('shinmiyangyo', 'EVENT', 'Shinmiyangyo',
   'A United States expedition attacks Ganghwa Island; Joseon forces resist and the fleet withdraws.',
   '{"start_year": 1871, "end_year": 1871, "event_type": "war", "title_ko": "신미양요"}', TRUE),
  ('donghak-revolution', 'EVENT', 'Donghak Peasant Revolution',
   'Massive peasant uprising demanding social reform, leading to foreign intervention.',
   '{"start_year": 1894, "end_year": 1895, "event_type": "revolt", "title_ko": "동학 농민 운동"}', TRUE),
  ('russo-japanese-war', 'EVENT', 'Russo-Japanese War',
   'Japan and Russia fight over Korea and Manchuria; Japan''s victory paves the way for the Eulsa Treaty.',
   '{"start_year": 1904, "end_year": 1905, "event_type": "war", "title_ko": "러일전쟁"}', TRUE)
ON CONFLICT (slug) DO UPDATE
  SET metadata = COALESCE(nodes.metadata, '{}'::jsonb)
    || jsonb_build_object('end_year', EXCLUDED.metadata->'end_year');

INSERT INTO person_node_links (person_id, node_id, link_type)
SELECT p.id, n.id, 'PARTICIPANT'
FROM (VALUES
  ('red-turban-invasions', 'gongmin-wang-wang-jeon'),
  ('red-turban-invasions', 'choe-yeong'),
  ('red-turban-invasions', 'taejo-yi-seong-gye'),
  ('red-turban-invasions', 'jeong-se-un'),
  ('red-turban-invasions', 'an-u'),
  ('red-turban-invasions', 'yi-bang-sil'),
  ('imjin-war', 'seonjo-yi-yeon'),
  ('imjin-war', 'yi-sun-sin'),
  ('imjin-war', 'gwon-yul'),
  ('imjin-war', 'ryu-seong-ryong'),
  ('imjin-war', 'gwak-jae-u'),
  ('imjin-war', 'yi-eok-gi'),
  ('imjin-war', 'won-gyun'),
  ('imjin-war', 'shin-rip'),
  ('imjin-war', 'kim-si-min'),
  ('imjin-war', 'go-gyeong-myeong'),
  ('imjin-war', 'jeong-gi-ryong'),
  ('imjin-war', 'jo-heon'),
  ('imjin-war', 'yeong-gyu'),
  ('imjin-war', 'kim-cheon-il'),
  ('imjin-war', 'gwak-jun'),
  ('imjin-war', 'jeong-in-hong'),
  ('jeongmyo-horan', 'injo-yi-jong'),
  ('jeongmyo-horan', 'jeong-bong-su'),
  ('jeongmyo-horan', 'yi-gwi'),
  ('jeongmyo-horan', 'jang-man'),
  ('byeongja-horan', 'injo-yi-jong'),
  ('byeongja-horan', 'choe-myeong-gil'),
  ('byeongja-horan', 'kim-sang-heon'),
  ('byeongja-horan', 'yun-jip'),
  ('byeongja-horan', 'oh-dal-je'),
  ('byeongja-horan', 'im-gyeong-eop'),
  ('shinmiyangyo', 'gojong-yi-myeong-bok'),
  ('shinmiyangyo', 'heungseon-daewongun'),
  ('shinmiyangyo', 'eo-jae-yeon'),
  ('donghak-revolution', 'gojong-yi-myeong-bok'),
  ('donghak-revolution', 'jeon-bong-jun'),
  ('donghak-revolution', 'kim-gae-nam'),
  ('donghak-revolution', 'son-hwa-jung'),
  ('russo-japanese-war', 'gojong-yi-myeong-bok')
) AS v(node_slug, person_slug)
JOIN nodes n ON n.slug = v.node_slug
JOIN persons p ON p.slug = v.person_slug
ON CONFLICT (person_id, node_id) DO NOTHING;
