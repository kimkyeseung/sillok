/**
 * 남은 K-pop 아이돌 20명 프로필 이미지 일괄 업로드
 * 실행: npx tsx scripts/upload-kpop-final.ts
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

const imageMap: Record<string, string> = {
  'j-hope-jung-ho-seok': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/j-hope/profile.jpg?v=1774194121350',
  'rm-kim-nam-jun': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/RM/profile.png?v=1774194173747',
  'v-kim-tae-hyung': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/V/profile.jpg?v=1774194269707',
  'jimin-park-ji-min': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Jimin2/profile.jpg?v=1774194243686',
  'jisoo-kim-ji-soo': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Jisoo2/profile.webp',
  'nayeon-im-na-yeon': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Nayeon/profile.webp',
  'jennie-kim': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Jennie/profile.jpg',
  'lisa-lalisa-manoban': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Lisa/profile.jpg',
  'bang-chan': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Bang-Chan/profile.webp',
  'sakura-miyawaki': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Sakura/profile.jpg?v=1777669160722',
  'karina-yu-ji-min': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Karina/profile.webp',
  'kim-chae-won': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Kim-Chaewon/profile.webp',
  'winter-kim-min-jeong': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/winter/profile.webp',
  'ryujin-shin-ryu-jin': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Ryujin/profile.jpg?v=1777389670630',
  'hanni-pham': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Hanni/profile.webp',
  'minji-kim-min-ji': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Minji/profile.webp',
  'sullyoon-seol-yun': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Sullyoon/profile.jpg?v=1776966731840',
  'danielle-mo': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Danielle/profile.webp',
  'haerin-kang-hae-rin': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Haerin/profile.webp',
  'hyein-lee-hye-in': 'https://pub-dc9a9c6ac2a64ba48bce426ced0ac56a.r2.dev/idols/Hyein/profile.webp',
};

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
  const slugs = Object.keys(imageMap);

  const { data: persons } = await sb
    .from('persons')
    .select('id, slug, name_en, name_ko, thumbnail')
    .in('slug', slugs);

  if (!persons) { console.error('No persons found'); return; }

  const needThumb = persons.filter((p) => !p.thumbnail);
  console.log(`\n📸 Uploading thumbnails for ${needThumb.length} K-pop idols...\n`);

  let success = 0;
  let failed = 0;

  for (const person of needThumb) {
    const imageUrl = imageMap[person.slug];
    if (!imageUrl) { failed++; continue; }

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
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n── Results ──`);
  console.log(`✅ Uploaded: ${success}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`Total:     ${needThumb.length}\n`);
}

main().catch(console.error);
