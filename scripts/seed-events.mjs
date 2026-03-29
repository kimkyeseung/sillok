// One-time seed script for Joseon-era historical events
// Usage: node scripts/seed-events.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Parse .env.local manually (no dotenv dependency)
const envText = readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envText.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const idx = l.indexOf('=');
    return [l.slice(0, idx), l.slice(idx + 1)];
  })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const events = [
  // ── 건국 / 왕위 교체 ──
  { slug: 'joseon-founding', title: 'Founding of Joseon (조선 건국)', year: 1392, type: 'dynasty', desc: 'Yi Seong-gye overthrows Goryeo and establishes the Joseon dynasty.' },
  { slug: 'capital-move-hanyang', title: 'Capital moved to Hanyang (한양 천도)', year: 1394, type: 'politics', desc: 'The capital is relocated from Kaesong to Hanyang (modern Seoul).' },
  { slug: 'strife-of-princes-1', title: 'First Strife of Princes (제1차 왕자의 난)', year: 1398, type: 'revolt', desc: 'Yi Bang-won eliminates political rivals including Jeong Do-jeon.' },
  { slug: 'strife-of-princes-2', title: 'Second Strife of Princes (제2차 왕자의 난)', year: 1400, type: 'revolt', desc: 'Yi Bang-won defeats his brother Yi Bang-gan to secure power.' },

  // ── 세종 시대 ──
  { slug: 'hangul-creation', title: 'Creation of Hangul (훈민정음 반포)', year: 1446, type: 'culture', desc: 'King Sejong promulgates the Korean alphabet Hunminjeongeum.' },
  { slug: 'jangयeong-silok', title: 'Jagyeongnu (자격루 제작)', year: 1434, type: 'culture', desc: 'Jang Yeong-sil creates the self-striking water clock Jagyeongnu.' },

  // ── 세조 찬탈 ──
  { slug: 'sejo-usurpation', title: 'Sejo\'s Usurpation (세조 즉위)', year: 1455, type: 'politics', desc: 'Grand Prince Suyang seizes the throne from his nephew Danjong.' },
  { slug: 'sayuksin-execution', title: 'Death of the Six Martyred Ministers (사육신 사건)', year: 1456, type: 'politics', desc: 'Six officials are executed for plotting to restore King Danjong.' },

  // ── 사화 (Literati Purges) ──
  { slug: 'muo-sahwa', title: 'First Literati Purge (무오사화)', year: 1498, type: 'purge', desc: 'Yeonsangun purges Sarim scholars over the Joseon Wangjo Sillok historiography dispute.' },
  { slug: 'gapja-sahwa', title: 'Second Literati Purge (갑자사화)', year: 1504, type: 'purge', desc: 'Yeonsangun conducts a massive purge after discovering the truth about his mother\'s death.' },
  { slug: 'gimyo-sahwa', title: 'Third Literati Purge (기묘사화)', year: 1519, type: 'purge', desc: 'Jungjong purges Jo Gwang-jo and the reformist Sarim faction.' },
  { slug: 'eulsa-sahwa', title: 'Fourth Literati Purge (을사사화)', year: 1545, type: 'purge', desc: 'Queen Munjeong\'s faction purges the Greater Yun faction after Injong\'s death.' },

  // ── 임진왜란 / 전쟁 ──
  { slug: 'imjin-war', title: 'Imjin War (임진왜란)', year: 1592, type: 'war', desc: 'Japan under Toyotomi Hideyoshi invades Korea. Admiral Yi Sun-sin leads naval defense.' },
  { slug: 'battle-of-hansan', title: 'Battle of Hansando (한산도 대첩)', year: 1592, type: 'war', desc: 'Yi Sun-sin achieves a decisive naval victory using the crane-wing formation.' },
  { slug: 'jeongyu-war', title: 'Second Japanese Invasion (정유재란)', year: 1597, type: 'war', desc: 'Japan launches a second invasion of Korea.' },
  { slug: 'battle-of-noryang', title: 'Battle of Noryang (노량해전)', year: 1598, type: 'war', desc: 'Final naval battle of the war. Admiral Yi Sun-sin is killed in action.' },

  // ── 광해군 / 인조 ──
  { slug: 'injo-coup', title: 'Injo Restoration (인조반정)', year: 1623, type: 'revolt', desc: 'Gwanghaegun is deposed and Prince Neungyang becomes King Injo.' },
  { slug: 'yi-gwal-rebellion', title: 'Yi Gwal\'s Rebellion (이괄의 난)', year: 1624, type: 'revolt', desc: 'General Yi Gwal rebels against King Injo.' },

  // ── 호란 (Manchu Invasions) ──
  { slug: 'jeongmyo-horan', title: 'First Manchu Invasion (정묘호란)', year: 1627, type: 'war', desc: 'Later Jin (Manchu) invades Joseon, forcing a brotherly alliance.' },
  { slug: 'byeongja-horan', title: 'Second Manchu Invasion (병자호란)', year: 1636, type: 'war', desc: 'Qing dynasty invades Joseon. King Injo surrenders at Namhansanseong.' },

  // ── 영조 / 정조 시대 ──
  { slug: 'tangpyeong-policy', title: 'Tangpyeong Policy (탕평책)', year: 1725, type: 'politics', desc: 'King Yeongjo implements the policy of impartiality to end factional strife.' },
  { slug: 'sado-prince-death', title: 'Death of Crown Prince Sado (임오화변)', year: 1762, type: 'politics', desc: 'King Yeongjo orders Crown Prince Sado to be sealed in a rice chest.' },
  { slug: 'hwaseong-construction', title: 'Construction of Hwaseong Fortress (화성 축조)', year: 1794, type: 'culture', desc: 'King Jeongjo builds Hwaseong Fortress in Suwon using advanced engineering.' },
  { slug: 'sinhaetonggoong', title: 'Sinhaetong Conspiracy (신해통공)', year: 1791, type: 'politics', desc: 'King Jeongjo abolishes the monopoly of licensed merchants, opening free commerce.' },

  // ── 세도정치 / 민란 ──
  { slug: 'catholic-persecution-sinyu', title: 'Sinyu Persecution (신유박해)', year: 1801, type: 'purge', desc: 'First major persecution of Catholics in Joseon. Jeong Yak-jong and others executed.' },
  { slug: 'hong-gyeongnae-rebellion', title: 'Hong Gyeong-nae Rebellion (홍경래의 난)', year: 1811, type: 'revolt', desc: 'Hong Gyeong-nae leads a revolt in the northwestern provinces against discrimination.' },
  { slug: 'imsul-peasant-revolt', title: 'Imsul Peasant Revolt (임술 농민 봉기)', year: 1862, type: 'revolt', desc: 'Peasant uprisings erupt across the country against corrupt local officials.' },

  // ── 개항기 ──
  { slug: 'ganghwa-treaty', title: 'Treaty of Ganghwa (강화도 조약)', year: 1876, type: 'diplomacy', desc: 'Japan forces Korea to sign its first modern unequal treaty, opening ports.' },
  { slug: 'imo-incident', title: 'Imo Incident (임오군란)', year: 1882, type: 'revolt', desc: 'Korean soldiers revolt against the Meiji-style military reforms and Japanese influence.' },
  { slug: 'gapsin-coup', title: 'Gapsin Coup (갑신정변)', year: 1884, type: 'revolt', desc: 'Progressive reformers attempt a coup but are suppressed within three days.' },
  { slug: 'donghak-revolution', title: 'Donghak Peasant Revolution (동학 농민 운동)', year: 1894, type: 'revolt', desc: 'Massive peasant uprising demanding social reform, leading to foreign intervention.' },
  { slug: 'gabo-reform', title: 'Gabo Reform (갑오개혁)', year: 1894, type: 'politics', desc: 'Sweeping modernization reforms abolish the class system and reorganize government.' },
  { slug: 'eulmi-incident', title: 'Assassination of Queen Min (을미사변)', year: 1895, type: 'politics', desc: 'Japanese agents assassinate Empress Myeongseong (Queen Min) at Gyeongbokgung Palace.' },

  // ── 대한제국 / 국권 상실 ──
  { slug: 'korean-empire', title: 'Proclamation of the Korean Empire (대한제국 선포)', year: 1897, type: 'dynasty', desc: 'King Gojong declares the Korean Empire, asserting sovereignty.' },
  { slug: 'eulsa-treaty', title: 'Eulsa Treaty (을사조약)', year: 1905, type: 'diplomacy', desc: 'Japan forces Korea to become a protectorate, stripping diplomatic sovereignty.' },
  { slug: 'japan-annexation', title: 'Japan-Korea Annexation (경술국치)', year: 1910, type: 'diplomacy', desc: 'Japan formally annexes Korea, ending the Joseon dynasty after 518 years.' },
];

async function seed() {
  console.log(`Seeding ${events.length} events...`);

  const rows = events.map((e) => ({
    slug: e.slug,
    node_type: 'EVENT',
    title: e.title,
    description: e.desc,
    metadata: { start_year: e.year, event_type: e.type },
    is_published: true,
    is_deleted: false,
  }));

  const { data, error } = await supabase
    .from('nodes')
    .upsert(rows, { onConflict: 'slug' })
    .select('id, slug, title');

  if (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }

  console.log(`Done! ${data.length} events upserted.`);
  data.forEach((e) => console.log(`  - ${e.title}`));
}

seed();
