/**
 * 프로필 이미지 없는 현대 인물 전부 위키백과에서 가져오기
 * 실행: npx tsx scripts/fetch-all-missing-thumbnails.ts
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

// ── Wikipedia search strategies ──

async function getImageFromWikiRest(title: string, lang: string): Promise<string | null> {
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

async function getImageFromWikiQuery(title: string, lang: string): Promise<string | null> {
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

async function searchWikiImage(query: string, lang: string): Promise<string | null> {
  try {
    // Search for the page first
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const title = searchData.query?.search?.[0]?.title;
    if (!title) return null;

    // Then get image from that page
    return await getImageFromWikiQuery(title, lang);
  } catch {
    return null;
  }
}

async function findImage(nameEn: string | null, nameKo: string): Promise<string | null> {
  // Strategy 1: English wiki REST with name_en
  if (nameEn) {
    const enTitle = nameEn.replace(/ /g, '_');
    let img = await getImageFromWikiRest(enTitle, 'en');
    if (img) return img;

    // Try with disambiguation
    for (const suffix of ['', '_(actor)', '_(actress)', '_(singer)', '_(director)', '_(South_Korean_singer)']) {
      img = await getImageFromWikiRest(enTitle + suffix, 'en');
      if (img) return img;
    }
  }

  // Strategy 2: Korean wiki REST with name_ko
  let img = await getImageFromWikiRest(nameKo, 'ko');
  if (img) return img;

  // Strategy 3: Korean wiki with common disambiguations
  for (const suffix of ['_(배우)', '_(가수)', '_(1994년)', '_(1987년)', '_(1988년)']) {
    img = await getImageFromWikiRest(nameKo + suffix, 'ko');
    if (img) return img;
  }

  // Strategy 4: Korean wiki query API
  img = await getImageFromWikiQuery(nameKo, 'ko');
  if (img) return img;

  // Strategy 5: Search-based fallback
  if (nameEn) {
    img = await searchWikiImage(nameEn + ' Korean actor', 'en');
    if (img) return img;
  }

  img = await searchWikiImage(nameKo + ' 배우', 'ko');
  if (img) return img;

  return null;
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SillokBot/1.0 (https://sillok.kr; contact@sillok.kr)' },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength < 1000) return null;
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch {
    return null;
  }
}

async function main() {
  // Get all published persons without thumbnail, born >= 1900 (modern)
  const { data: persons, error } = await sb
    .from('persons')
    .select('id, slug, name_en, name_ko, birth_year, thumbnail')
    .eq('is_deleted', false)
    .eq('is_published', true)
    .is('thumbnail', null)
    .gte('birth_year', 1900)
    .order('birth_year', { ascending: true });

  if (error || !persons) {
    console.error('Failed to fetch persons:', error?.message);
    return;
  }

  console.log(`\n📸 Found ${persons.length} modern persons without thumbnail\n`);

  if (persons.length === 0) {
    console.log('All modern persons already have thumbnails!');
    return;
  }

  let success = 0;
  let failed = 0;

  for (const person of persons) {
    const imageUrl = await findImage(person.name_en, person.name_ko);

    if (!imageUrl) {
      console.log(`❌ FAIL: ${person.name_en ?? person.name_ko} (${person.slug}) — no image found`);
      failed++;
      continue;
    }

    const image = await downloadImage(imageUrl);
    if (!image) {
      console.log(`❌ FAIL: ${person.name_en ?? person.name_ko} (${person.slug}) — download failed`);
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

    const { error: updateError } = await sb
      .from('persons')
      .update({ thumbnail: urlData.publicUrl })
      .eq('id', person.id);

    if (updateError) {
      console.log(`❌ FAIL: ${person.name_en ?? person.name_ko} — DB update: ${updateError.message}`);
      failed++;
      continue;
    }

    console.log(`✅ OK: ${person.name_en ?? person.name_ko} (${person.slug})`);
    success++;
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n── Results ──`);
  console.log(`✅ Uploaded: ${success}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`Total:     ${persons.length}\n`);
}

main().catch(console.error);
