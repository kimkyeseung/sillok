// Seed coronation events for all Joseon kings (except Taejo)
// Usage: node scripts/seed-coronations.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envText = readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envText.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const idx = l.indexOf('=');
    return [l.slice(0, idx), l.slice(idx + 1)];
  })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// All Joseon kings except Taejo (already covered by joseon-founding event)
const kings = [
  { slug: 'jeongjong-yi-bang-gwa',  year: 1399, title: 'Accession of Jeongjong',    title_ko: '정종 즉위',   personSlug: 'jeongjong-yi-bang-gwa' },
  { slug: 'taejong-yi-bang-won',    year: 1400, title: 'Accession of Taejong',      title_ko: '태종 즉위',   personSlug: 'taejong-yi-bang-won' },
  { slug: 'sejong-daewang',         year: 1418, title: 'Accession of Sejong',       title_ko: '세종 즉위',   personSlug: 'sejong-daewang' },
  { slug: 'munjong-yi-hyang',       year: 1450, title: 'Accession of Munjong',      title_ko: '문종 즉위',   personSlug: 'munjong-yi-hyang' },
  { slug: 'danjong-yi-hong-wi',     year: 1452, title: 'Accession of Danjong',      title_ko: '단종 즉위',   personSlug: 'danjong-yi-hong-wi' },
  // Sejo already has sejo-usurpation event
  { slug: 'yejong-yi-hwang',        year: 1468, title: 'Accession of Yejong',       title_ko: '예종 즉위',   personSlug: 'yejong-yi-hwang' },
  { slug: 'seongjong-yi-hyeol',     year: 1469, title: 'Accession of Seongjong',    title_ko: '성종 즉위',   personSlug: 'seongjong-yi-hyeol' },
  { slug: 'yeonsangun-yi-yung',     year: 1494, title: 'Accession of Yeonsangun',   title_ko: '연산군 즉위', personSlug: 'yeonsangun-yi-yung' },
  { slug: 'jungjong-yi-yeok',       year: 1506, title: 'Accession of Jungjong',     title_ko: '중종 즉위',   personSlug: 'jungjong-yi-yeok' },
  { slug: 'injong-yi-ho',           year: 1544, title: 'Accession of Injong',       title_ko: '인종 즉위',   personSlug: 'injong-yi-ho' },
  { slug: 'myeongjong-yi-hwan',     year: 1545, title: 'Accession of Myeongjong',   title_ko: '명종 즉위',   personSlug: 'myeongjong-yi-hwan' },
  { slug: 'seonjo-yi-yeon',         year: 1567, title: 'Accession of Seonjo',       title_ko: '선조 즉위',   personSlug: 'seonjo-yi-yeon' },
  { slug: 'gwanghaegun-yi-hon',     year: 1608, title: 'Accession of Gwanghaegun',  title_ko: '광해군 즉위', personSlug: 'gwanghaegun-yi-hon' },
  // Injo already has injo-coup event
  { slug: 'hyojong-yi-ho',          year: 1649, title: 'Accession of Hyojong',      title_ko: '효종 즉위',   personSlug: 'hyojong-yi-ho' },
  { slug: 'hyeonjong-yi-yeon',      year: 1659, title: 'Accession of Hyeonjong',    title_ko: '현종 즉위',   personSlug: 'hyeonjong-yi-yeon' },
  { slug: 'sukjong-yi-sun',         year: 1674, title: 'Accession of Sukjong',      title_ko: '숙종 즉위',   personSlug: 'sukjong-yi-sun' },
  { slug: 'gyeongjong-yi-yun',      year: 1720, title: 'Accession of Gyeongjong',   title_ko: '경종 즉위',   personSlug: 'gyeongjong-yi-yun' },
  { slug: 'yeongjo-yi-geum',        year: 1724, title: 'Accession of Yeongjo',      title_ko: '영조 즉위',   personSlug: 'yeongjo-yi-geum' },
  { slug: 'jeongjo-yi-san',         year: 1776, title: 'Accession of Jeongjo',      title_ko: '정조 즉위',   personSlug: 'jeongjo-yi-san' },
  { slug: 'sunjo-yi-gong',          year: 1800, title: 'Accession of Sunjo',        title_ko: '순조 즉위',   personSlug: 'sunjo-yi-gong' },
  { slug: 'heonjong-yi-hwan',       year: 1834, title: 'Accession of Heonjong',     title_ko: '헌종 즉위',   personSlug: 'heonjong-yi-hwan' },
  { slug: 'cheoljong-yi-byeon',     year: 1849, title: 'Accession of Cheoljong',    title_ko: '철종 즉위',   personSlug: 'cheoljong-yi-byeon' },
  { slug: 'gojong-yi-myeong-bok',   year: 1863, title: 'Accession of Gojong',      title_ko: '고종 즉위',   personSlug: 'gojong-yi-myeong-bok' },
  { slug: 'sunjong-yi-cheok',       year: 1907, title: 'Accession of Sunjong',      title_ko: '순종 즉위',   personSlug: 'sunjong-yi-cheok' },
];

async function seed() {
  // Get person IDs by slug
  const personSlugs = kings.map((k) => k.personSlug);
  const { data: persons } = await supabase
    .from('persons')
    .select('id, slug')
    .in('slug', personSlugs);

  const personMap = new Map((persons ?? []).map((p) => [p.slug, p.id]));

  let created = 0;
  let skipped = 0;

  for (const king of kings) {
    const eventSlug = `accession-${king.slug}`;

    // Check if already exists
    const { data: existing } = await supabase
      .from('nodes')
      .select('id')
      .eq('slug', eventSlug)
      .maybeSingle();

    if (existing) {
      console.log(`  skip: ${eventSlug} (already exists)`);
      skipped++;
      continue;
    }

    // Insert event node
    const { data: node, error } = await supabase
      .from('nodes')
      .insert({
        slug: eventSlug,
        node_type: 'EVENT',
        title: king.title,
        description: `${king.title_ko} (${king.year})`,
        metadata: { start_year: king.year, event_type: 'dynasty', title_ko: king.title_ko },
        is_published: true,
        is_deleted: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  ERROR: ${eventSlug}`, error.message);
      continue;
    }

    // Link person if found
    const personId = personMap.get(king.personSlug);
    if (personId && node) {
      await supabase.from('person_node_links').insert({
        person_id: personId,
        node_id: node.id,
      });
    }

    console.log(`  + ${eventSlug} (${king.year})${personId ? ' [linked]' : ' [no person]'}`);
    created++;
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
}

seed();
