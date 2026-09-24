-- ============================================================
-- Seed: Joseon royal lineage for the family tree
-- - 6 figures that connect kings who succeeded through collateral lines
-- - 18 missing parent → child relations between Joseon kings
-- Run AFTER 20260924_add_family_role.sql. Safe to re-run (idempotent).
-- ============================================================

-- 1. Connecting figures
INSERT INTO persons (slug, name_ko, name_hanja, name_en, birth_year, death_year, summary, is_published)
VALUES
  ('crown-prince-uigyeong', '의경세자', '懿敬世子', 'Crown Prince Uigyeong (Deokjong)', 1438, 1457,
   'Eldest son of King Sejo who died at 19 before taking the throne. His son King Seongjong posthumously honored him as King Deokjong.', TRUE),
  ('deokheung-daewongun', '덕흥대원군', '德興大院君', 'Grand Internal Prince Deokheung', 1530, 1559,
   'Son of King Jungjong by Royal Consort Changbin of the Ahn clan. His son became King Seonjo, the first Joseon king who was not born to a queen''s line.', TRUE),
  ('prince-jeongwon', '정원군', '定遠君', 'Prince Jeongwon (Wonjong)', 1580, 1619,
   'Son of King Seonjo. After the Injo Coup of 1623 his son became King Injo, who posthumously elevated him to King Wonjong.', TRUE),
  ('prince-euneon', '은언군', '恩彦君', 'Prince Euneon', 1754, 1801,
   'Son of Crown Prince Sado and half-brother of King Jeongjo. Exiled to Ganghwa Island and executed in 1801; grandfather of King Cheoljong.', TRUE),
  ('jeongye-daewongun', '전계대원군', '全溪大院君', 'Grand Internal Prince Jeongye', 1785, 1841,
   'Son of Prince Euneon who lived in exile on Ganghwa Island. His son was unexpectedly chosen to become King Cheoljong in 1849.', TRUE),
  ('crown-prince-hyomyeong', '효명세자', '孝明世子', 'Crown Prince Hyomyeong', 1809, 1830,
   'Son of King Sunjo who governed as regent from 1827 and revived court culture before dying at 21. Father of King Heonjong; posthumously honored as King Ikjong (later Emperor Munjo).', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 2. Tag them as Joseon era
INSERT INTO person_tags (person_id, tag_id)
SELECT p.id, t.id
FROM persons p
CROSS JOIN tags t
WHERE t.name_en = 'joseon' AND t.type = 'ERA'
  AND p.slug IN ('crown-prince-uigyeong', 'deokheung-daewongun', 'prince-jeongwon',
                 'prince-euneon', 'jeongye-daewongun', 'crown-prince-hyomyeong')
ON CONFLICT DO NOTHING;

-- 3. Parent → child relations
INSERT INTO person_relations (from_person_id, to_person_id, relation_type, family_role, description, is_approved)
SELECT f.id, t.id, 'FAMILY', 'PARENT', v.description, TRUE
FROM (VALUES
  ('sejong-daewang', 'sejo-yi-yu', 'Father and son; Sejo was Sejong''s second son, Grand Prince Suyang'),
  ('sejo-yi-yu', 'crown-prince-uigyeong', 'Father and son; Uigyeong was Sejo''s eldest son and crown prince'),
  ('crown-prince-uigyeong', 'seongjong-yi-hyeol', 'Father and son; Seongjong succeeded his uncle Yejong'),
  ('seongjong-yi-hyeol', 'jungjong-yi-yeok', 'Father and son; Jungjong was enthroned after Yeonsangun was deposed'),
  ('jungjong-yi-yeok', 'injong-yi-ho', 'Father and son; Injong reigned for less than a year'),
  ('jungjong-yi-yeok', 'myeongjong-yi-hwan', 'Father and son; Myeongjong succeeded his half-brother Injong'),
  ('jungjong-yi-yeok', 'deokheung-daewongun', 'Father and son'),
  ('deokheung-daewongun', 'seonjo-yi-yeon', 'Father and son; Seonjo was adopted as heir by Myeongjong'),
  ('seonjo-yi-yeon', 'prince-jeongwon', 'Father and son'),
  ('prince-jeongwon', 'injo-yi-jong', 'Father and son; Injo took the throne in the 1623 coup'),
  ('hyeonjong-yi-yeon', 'sukjong-yi-sun', 'Father and son'),
  ('sukjong-yi-sun', 'yeongjo-yi-geum', 'Father and son; Yeongjo succeeded his half-brother Gyeongjong'),
  ('crown-prince-sado', 'prince-euneon', 'Father and son'),
  ('prince-euneon', 'jeongye-daewongun', 'Father and son'),
  ('jeongye-daewongun', 'cheoljong-yi-byeon', 'Father and son; Cheoljong was brought from Ganghwa Island to take the throne'),
  ('jeongjo-yi-san', 'sunjo-yi-gong', 'Father and son; Sunjo took the throne at 10'),
  ('sunjo-yi-gong', 'crown-prince-hyomyeong', 'Father and son'),
  ('crown-prince-hyomyeong', 'heonjong-yi-hwan', 'Father and son; Heonjong succeeded his grandfather Sunjo at 7')
) AS v(from_slug, to_slug, description)
JOIN persons f ON f.slug = v.from_slug
JOIN persons t ON t.slug = v.to_slug
ON CONFLICT (from_person_id, to_person_id, relation_type) DO NOTHING;
