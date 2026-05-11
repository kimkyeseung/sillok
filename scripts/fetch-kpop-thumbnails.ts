/**
 * K-pop 아이돌 프로필 이미지 — 위키 검색 강화
 * 실행: npx tsx scripts/fetch-kpop-thumbnails.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > -1 && !process.env[t.slice(0, i).trim()])
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Manual wiki title mapping for K-pop idols who have pages under specific names
const wikiTitles: Record<string, { en?: string; ko?: string }> = {
  'suga-min-yoon-gi': { en: 'Suga_(rapper)', ko: '슈가_(래퍼)' },
  'j-hope-jung-ho-seok': { en: 'J-Hope', ko: '제이홉' },
  'rm-kim-nam-jun': { en: 'RM_(rapper)', ko: 'RM_(래퍼)' },
  'v-kim-tae-hyung': { en: 'V_(singer)', ko: '뷔_(가수)' },
  'jimin-park-ji-min': { en: 'Jimin', ko: '지민_(가수)' },
  'jungkook-jeon-jung-kook': { en: 'Jungkook', ko: '정국_(가수)' },
  'jisoo-kim-ji-soo': { en: 'Jisoo_(singer)', ko: '지수_(가수)' },
  'jennie-kim': { en: 'Jennie_(singer)', ko: '제니_(가수)' },
  'rose-park-chae-young': { en: 'Rosé_(singer)', ko: '로제_(가수)' },
  'lisa-lalisa-manoban': { en: 'Lisa_(rapper)', ko: '리사_(래퍼)' },
  'nayeon-im-na-yeon': { en: 'Nayeon', ko: '나연' },
  'bang-chan': { en: 'Bang_Chan', ko: '방찬' },
  'sakura-miyawaki': { en: 'Miyawaki_Sakura', ko: '미야와키_사쿠라' },
  'karina-yu-ji-min': { en: 'Karina_(singer)', ko: '카리나_(가수)' },
  'kim-chae-won': { en: 'Kim_Chae-won_(singer)', ko: '김채원_(2000년)' },
  'giselle-aeri-uchinaga': { en: 'Giselle_(singer)', ko: '지젤_(가수)' },
  'winter-kim-min-jeong': { en: 'Winter_(singer)', ko: '윈터_(가수)' },
  'ryujin-shin-ryu-jin': { en: 'Shin_Ryujin', ko: '신류진' },
  'ningning-ning-yi-zhuo': { en: 'Ningning', ko: '닝닝' },
  'hanni-pham': { en: 'Hanni_(singer)', ko: '하니_(2004년)' },
  'minji-kim-min-ji': { en: 'Minji_(singer)', ko: '민지_(2004년)' },
  'sullyoon-seol-yun': { en: 'Sullyoon', ko: '설윤' },
  'danielle-mo': { en: 'Danielle_(singer)', ko: '다니엘_(2005년)' },
  'haerin-kang-hae-rin': { en: 'Haerin', ko: '해린' },
  'hyein-lee-hye-in': { en: 'Hyein', ko: '혜인_(2008년)' },
};

async function getImage(title: string, lang: string): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.originalimage?.source || data.thumbnail?.source || null;
  } catch {
    return null;
  }
}

async function getImageQuery(title: string, lang: string): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=800`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as any;
    return page?.thumbnail?.source || null;
  } catch {
    return null;
  }
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SillokBot/1.0 (https://sillok.kr; contact@sillok.kr)' },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const ab = await res.arrayBuffer();
    if (ab.byteLength < 1000) return null;
    return { buffer: Buffer.from(ab), contentType };
  } catch {
    return null;
  }
}

async function main() {
  const slugs = Object.keys(wikiTitles);

  const { data: persons } = await sb
    .from('persons')
    .select('id, slug, name_en, name_ko, thumbnail')
    .in('slug', slugs)
    .is('thumbnail', null);

  if (!persons || persons.length === 0) {
    console.log('All K-pop idols already have thumbnails!');
    return;
  }

  console.log(`\n📸 Fetching thumbnails for ${persons.length} K-pop idols...\n`);

  let success = 0;
  let failed = 0;

  for (const person of persons) {
    const wiki = wikiTitles[person.slug];
    if (!wiki) { failed++; continue; }

    let imageUrl: string | null = null;

    // Try English REST
    if (wiki.en) imageUrl = await getImage(wiki.en, 'en');
    // Try Korean REST
    if (!imageUrl && wiki.ko) imageUrl = await getImage(wiki.ko, 'ko');
    // Try English Query API
    if (!imageUrl && wiki.en) imageUrl = await getImageQuery(wiki.en, 'en');
    // Try Korean Query API
    if (!imageUrl && wiki.ko) imageUrl = await getImageQuery(wiki.ko, 'ko');

    if (!imageUrl) {
      console.log(`❌ FAIL: ${person.name_en ?? person.name_ko} (${person.slug})`);
      failed++;
      continue;
    }

    const image = await downloadImage(imageUrl);
    if (!image) {
      console.log(`❌ FAIL: ${person.name_en ?? person.name_ko} — download failed`);
      failed++;
      continue;
    }

    let ext = 'jpg';
    if (image.contentType.includes('png')) ext = 'png';
    else if (image.contentType.includes('webp')) ext = 'webp';

    const storagePath = `${person.id}/portrait.${ext}`;
    const { error: uploadError } = await sb.storage.from('persons').upload(storagePath, image.buffer, {
      contentType: image.contentType,
      upsert: true,
    });

    if (uploadError) {
      console.log(`❌ FAIL: ${person.name_en ?? person.name_ko} — upload: ${uploadError.message}`);
      failed++;
      continue;
    }

    const { data: urlData } = sb.storage.from('persons').getPublicUrl(storagePath);
    await sb.from('persons').update({ thumbnail: urlData.publicUrl }).eq('id', person.id);

    console.log(`✅ OK: ${person.name_en ?? person.name_ko}`);
    success++;
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n── Results ──`);
  console.log(`✅ Uploaded: ${success}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`Total:     ${persons.length}\n`);
}

main().catch(console.error);
