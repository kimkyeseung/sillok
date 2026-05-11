import { readFileSync } from 'fs';
import { resolve } from 'path';
const envPath = resolve(process.cwd(), '.env.local');
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > -1 && !process.env[t.slice(0, i).trim()])
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const slugs = [
  'kim-ki-duk','lee-chang-dong','hong-sang-soo','hwang-dong-hyuk','na-hong-jin','yeon-sang-ho',
  'choi-min-sik','ha-jung-woo','hwang-jung-min','ma-dong-seok','gong-yoo','kang-dong-won','yoo-hae-jin',
  'youn-yuh-jung','jeon-do-yeon','lee-young-ae','kim-min-hee','jung-ho-yeon','bae-doona',
  'song-hye-kyo','han-so-hee','tang-wei','kim-tae-ri','bae-suzy','park-seo-jun','lee-min-ho',
];

async function main() {
  const { data } = await sb.from('persons').select('slug, name_en, thumbnail').in('slug', slugs);
  const noThumb = data!.filter((p) => !p.thumbnail);
  const hasThumb = data!.filter((p) => p.thumbnail);
  console.log(`No thumbnail: ${noThumb.length}`);
  noThumb.forEach((p) => console.log(`  - ${p.slug} (${p.name_en})`));
  console.log(`Has thumbnail: ${hasThumb.length}`);
}

main().catch(console.error);
