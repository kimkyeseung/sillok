/**
 * 남은 인물 프로필 이미지 수집 (한국어 위키 + Wikimedia Commons)
 * 실행: npx tsx scripts/fetch-thumbnails-v2.ts
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

// Korean wikipedia titles for remaining persons
const personKoWikiMap: Record<string, { ko?: string; en?: string; commons?: string }> = {
  'hong-sang-soo': { ko: '홍상수', en: 'Hong_Sang-soo' },
  'hwang-dong-hyuk': { ko: '황동혁', en: 'Hwang_Dong-hyuk' },
  'na-hong-jin': { ko: '나홍진', en: 'Na_Hong-jin' },
  'yeon-sang-ho': { ko: '연상호', en: 'Yeon_Sang-ho' },
  'choi-min-sik': { ko: '최민식', en: 'Choi_Min-sik' },
  'gong-yoo': { ko: '공유_(배우)', en: 'Gong_Yoo' },
  'kang-dong-won': { ko: '강동원', en: 'Kang_Dong-won' },
  'yoo-hae-jin': { ko: '유해진', en: 'Yoo_Hae-jin' },
  'youn-yuh-jung': { ko: '윤여정', en: 'Youn_Yuh-jung' },
  'jeon-do-yeon': { ko: '전도연', en: 'Jeon_Do-yeon' },
  'lee-young-ae': { ko: '이영애', en: 'Lee_Young-ae' },
  'kim-min-hee': { ko: '김민희_(배우)', en: 'Kim_Min-hee_(actress)' },
  'jung-ho-yeon': { ko: '정호연', en: 'Jung_Ho-yeon' },
  'bae-doona': { ko: '배두나', en: 'Bae_Doona' },
  'song-hye-kyo': { ko: '송혜교', en: 'Song_Hye-kyo' },
  'han-so-hee': { ko: '한소희_(배우)', en: 'Han_So-hee' },
  'kim-tae-ri': { ko: '김태리', en: 'Kim_Tae-ri' },
  'bae-suzy': { ko: '수지_(1994년)', en: 'Bae_Suzy' },
  'park-seo-jun': { ko: '박서준', en: 'Park_Seo-joon' },
  'lee-min-ho': { ko: '이민호_(1987년)', en: 'Lee_Min-ho_(actor)' },
};

async function getImageFromKoWiki(title: string): Promise<string | null> {
  try {
    const url = `https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.originalimage?.source || data.thumbnail?.source || null;
  } catch {
    return null;
  }
}

async function getImageFromEnWiki(title: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.originalimage?.source || data.thumbnail?.source || null;
  } catch {
    return null;
  }
}

async function getImageFromWikiMediaQuery(title: string, lang: string = 'en'): Promise<string | null> {
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
      headers: {
        'User-Agent': 'SillokBot/1.0 (https://sillok.kr; contact@sillok.kr)',
      },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength < 1000) return null; // too small, probably error
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch {
    return null;
  }
}

async function main() {
  const slugs = Object.keys(personKoWikiMap);

  const { data: persons } = await sb
    .from('persons')
    .select('id, slug, name_en, thumbnail')
    .in('slug', slugs);

  if (!persons) return;

  // Filter to only those without thumbnail
  const needThumb = persons.filter((p) => !p.thumbnail);
  console.log(`\n📸 Fetching thumbnails for ${needThumb.length} remaining persons...\n`);

  let success = 0;
  let failed = 0;

  for (const person of needThumb) {
    const wiki = personKoWikiMap[person.slug];
    if (!wiki) { failed++; continue; }

    // Try multiple sources
    let imageUrl: string | null = null;

    // 1. Korean Wiki REST API
    if (wiki.ko) {
      imageUrl = await getImageFromKoWiki(wiki.ko);
    }

    // 2. English Wiki REST API
    if (!imageUrl && wiki.en) {
      imageUrl = await getImageFromEnWiki(wiki.en);
    }

    // 3. Korean Wiki MediaQuery API (sometimes has images REST doesn't)
    if (!imageUrl && wiki.ko) {
      imageUrl = await getImageFromWikiMediaQuery(wiki.ko, 'ko');
    }

    // 4. English Wiki MediaQuery API
    if (!imageUrl && wiki.en) {
      imageUrl = await getImageFromWikiMediaQuery(wiki.en, 'en');
    }

    if (!imageUrl) {
      console.log(`❌ FAIL: ${person.name_en} — no image found anywhere`);
      failed++;
      continue;
    }

    // Download
    const image = await downloadImage(imageUrl);
    if (!image) {
      console.log(`❌ FAIL: ${person.name_en} — download failed (${imageUrl.substring(0, 60)}...)`);
      failed++;
      continue;
    }

    // Upload
    let ext = 'jpg';
    if (image.contentType.includes('png')) ext = 'png';
    else if (image.contentType.includes('webp')) ext = 'webp';

    const storagePath = `${person.id}/portrait.${ext}`;
    const { error: uploadError } = await sb.storage.from('persons').upload(storagePath, image.buffer, {
      contentType: image.contentType,
      upsert: true,
    });

    if (uploadError) {
      console.log(`❌ FAIL: ${person.name_en} — upload: ${uploadError.message}`);
      failed++;
      continue;
    }

    const { data: urlData } = sb.storage.from('persons').getPublicUrl(storagePath);

    const { error: updateError } = await sb
      .from('persons')
      .update({ thumbnail: urlData.publicUrl })
      .eq('id', person.id);

    if (updateError) {
      console.log(`❌ FAIL: ${person.name_en} — DB update: ${updateError.message}`);
      failed++;
      continue;
    }

    console.log(`✅ OK: ${person.name_en}`);
    success++;
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n── Results ──`);
  console.log(`✅ Uploaded: ${success}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`Total:     ${needThumb.length}\n`);
}

main().catch(console.error);
