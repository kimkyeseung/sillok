-- English aliases people search by ("King Sejong", "Yi Do").
-- Used in the overview title, "Also known as" line, JSON-LD alternateName and keywords.
ALTER TABLE persons ADD COLUMN IF NOT EXISTS aliases_en TEXT[] NOT NULL DEFAULT '{}';

-- Joseon kings (1st Taejo ~ 27th Sunjong). First alias goes into the page title.
UPDATE persons SET aliases_en = v.aliases
FROM (VALUES
  ('taejo-yi-seong-gye',   ARRAY['King Taejo', 'Yi Seong-gye', 'Yi Dan']),
  ('jeongjong-yi-bang-gwa', ARRAY['King Jeongjong', 'Yi Bang-gwa']),
  ('taejong-yi-bang-won',  ARRAY['King Taejong', 'Yi Bang-won']),
  ('sejong-daewang',       ARRAY['King Sejong', 'Sejong of Joseon', 'Yi Do', 'King Sejong the Great']),
  ('munjong-yi-hyang',     ARRAY['King Munjong', 'Yi Hyang']),
  ('danjong-yi-hong-wi',   ARRAY['King Danjong', 'Yi Hong-wi']),
  ('sejo-yi-yu',           ARRAY['King Sejo', 'Grand Prince Suyang', 'Yi Yu']),
  ('yejong-yi-hwang',      ARRAY['King Yejong', 'Yi Hwang']),
  ('seongjong-yi-hyeol',   ARRAY['King Seongjong', 'Yi Hyeol']),
  ('yeonsangun-yi-yung',   ARRAY['Prince Yeonsan', 'Yeonsan-gun', 'Yi Yung']),
  ('jungjong-yi-yeok',     ARRAY['King Jungjong', 'Yi Yeok']),
  ('injong-yi-ho',         ARRAY['King Injong', 'Yi Ho']),
  ('myeongjong-yi-hwan',   ARRAY['King Myeongjong', 'Yi Hwan']),
  ('seonjo-yi-yeon',       ARRAY['King Seonjo', 'Yi Yeon']),
  ('gwanghaegun-yi-hon',   ARRAY['Prince Gwanghae', 'Gwanghae-gun', 'Yi Hon']),
  ('injo-yi-jong',         ARRAY['King Injo', 'Yi Jong']),
  ('hyojong-yi-ho',        ARRAY['King Hyojong', 'Yi Ho']),
  ('hyeonjong-yi-yeon',    ARRAY['King Hyeonjong', 'Yi Yeon']),
  ('sukjong-yi-sun',       ARRAY['King Sukjong', 'Yi Sun']),
  ('gyeongjong-yi-yun',    ARRAY['King Gyeongjong', 'Yi Yun']),
  ('yeongjo-yi-geum',      ARRAY['King Yeongjo', 'Yi Geum']),
  ('jeongjo-yi-san',       ARRAY['King Jeongjo', 'Yi San']),
  ('sunjo-yi-gong',        ARRAY['King Sunjo', 'Yi Gong']),
  ('heonjong-yi-hwan',     ARRAY['King Heonjong', 'Yi Hwan']),
  ('cheoljong-yi-byeon',   ARRAY['King Cheoljong', 'Yi Byeon', 'Yi Won-beom']),
  ('gojong-yi-myeong-bok', ARRAY['Emperor Gojong', 'King Gojong', 'Gwangmu Emperor', 'Gojong of Joseon', 'Yi Myeong-bok']),
  ('sunjong-yi-cheok',     ARRAY['Emperor Sunjong', 'Yunghui Emperor', 'Sunjong of Joseon', 'Yi Cheok'])
) AS v(slug, aliases)
WHERE persons.slug = v.slug;
