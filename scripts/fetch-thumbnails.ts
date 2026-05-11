/**
 * 인물 프로필 이미지 자동 수집 + Supabase Storage 업로드
 * 위키미디어/위키백과에서 이미지 URL을 가져와 업로드
 * 실행: npx tsx scripts/fetch-thumbnails.ts
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

// Wikipedia article titles for each person (Korean or English)
const personWikiMap: Record<string, string> = {
  'kim-ki-duk': 'Kim_Ki-duk',
  'lee-chang-dong': 'Lee_Chang-dong',
  'hong-sang-soo': 'Hong_Sang-soo',
  'hwang-dong-hyuk': 'Hwang_Dong-hyuk',
  'na-hong-jin': 'Na_Hong-jin',
  'yeon-sang-ho': 'Yeon_Sang-ho',
  'choi-min-sik': 'Choi_Min-sik',
  'ha-jung-woo': 'Ha_Jung-woo',
  'hwang-jung-min': 'Hwang_Jung-min',
  'ma-dong-seok': 'Ma_Dong-seok',
  'gong-yoo': 'Gong_Yoo',
  'kang-dong-won': 'Kang_Dong-won',
  'yoo-hae-jin': 'Yoo_Hae-jin',
  'youn-yuh-jung': 'Youn_Yuh-jung',
  'jeon-do-yeon': 'Jeon_Do-yeon',
  'lee-young-ae': 'Lee_Young-ae',
  'kim-min-hee': 'Kim_Min-hee_(actress)',
  'jung-ho-yeon': 'Jung_Ho-yeon',
  'bae-doona': 'Bae_Doona',
  'song-hye-kyo': 'Song_Hye-kyo',
  'han-so-hee': 'Han_So-hee',
  'tang-wei': 'Tang_Wei',
  'kim-tae-ri': 'Kim_Tae-ri',
  'bae-suzy': 'Bae_Suzy',
  'park-seo-jun': 'Park_Seo-joon',
  'lee-min-ho': 'Lee_Min-ho_(actor)',
};

async function getWikiImageUrl(wikiTitle: string): Promise<string | null> {
  try {
    // Use Wikipedia API to get the main image (pageimages)
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // originalimage is highest quality
    return data.originalimage?.source || data.thumbnail?.source || null;
  } catch {
    return null;
  }
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch {
    return null;
  }
}

async function main() {
  const slugs = Object.keys(personWikiMap);

  // Get person IDs
  const { data: persons } = await sb
    .from('persons')
    .select('id, slug, name_en, thumbnail')
    .in('slug', slugs);

  if (!persons) {
    console.error('No persons found');
    return;
  }

  console.log(`\n📸 Fetching thumbnails for ${persons.length} persons...\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const person of persons) {
    if (person.thumbnail) {
      console.log(`⏭️  SKIP: ${person.name_en} — already has thumbnail`);
      skipped++;
      continue;
    }

    const wikiTitle = personWikiMap[person.slug];
    if (!wikiTitle) {
      console.log(`❌ FAIL: ${person.name_en} — no wiki mapping`);
      failed++;
      continue;
    }

    // 1. Get image URL from Wikipedia
    const imageUrl = await getWikiImageUrl(wikiTitle);
    if (!imageUrl) {
      console.log(`❌ FAIL: ${person.name_en} — no wiki image found`);
      failed++;
      continue;
    }

    // 2. Download image
    const image = await downloadImage(imageUrl);
    if (!image) {
      console.log(`❌ FAIL: ${person.name_en} — download failed`);
      failed++;
      continue;
    }

    // 3. Determine extension
    let ext = 'jpg';
    if (image.contentType.includes('png')) ext = 'png';
    else if (image.contentType.includes('webp')) ext = 'webp';

    // 4. Upload to Supabase Storage
    const storagePath = `${person.id}/portrait.${ext}`;
    const { error: uploadError } = await sb.storage
      .from('persons')
      .upload(storagePath, image.buffer, {
        contentType: image.contentType,
        upsert: true,
      });

    if (uploadError) {
      console.log(`❌ FAIL: ${person.name_en} — upload error: ${uploadError.message}`);
      failed++;
      continue;
    }

    // 5. Get public URL
    const { data: urlData } = sb.storage.from('persons').getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // 6. Update persons table
    const { error: updateError } = await sb
      .from('persons')
      .update({ thumbnail: publicUrl })
      .eq('id', person.id);

    if (updateError) {
      console.log(`❌ FAIL: ${person.name_en} — DB update error: ${updateError.message}`);
      failed++;
      continue;
    }

    console.log(`✅ OK: ${person.name_en}`);
    success++;

    // Small delay to be polite to Wikipedia
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n── Results ──`);
  console.log(`✅ Uploaded: ${success}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`Total:     ${persons.length}\n`);
}

main().catch(console.error);
