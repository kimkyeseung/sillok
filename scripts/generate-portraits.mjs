/**
 * 인물 AI 초상화 생성 스크립트
 * - OpenAI 이미지 모델로 사실적 초상화 생성 → 로컬 저장 (검토용)
 * - --upload 시 Supabase Storage 업로드 + persons.thumbnail 업데이트
 *
 * Usage:
 *   node scripts/generate-portraits.mjs --dry-run                  # 프롬프트만 출력
 *   node scripts/generate-portraits.mjs --slugs a,b                # 생성 → scripts/output/portraits/
 *   node scripts/generate-portraits.mjs --slugs a,b --upload       # 로컬 이미지 업로드 + DB 반영
 *   (--slugs 생략 시 thumbnail 없는 인물 전체)
 *
 * Env (.env.local): OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *                   OPENAI_IMAGE_MODEL (optional, default gpt-image-1)
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, 'output/portraits');

// ─── CLI ───
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const DRY_RUN = flag('dry-run');
const UPLOAD = flag('upload');
const SLUGS = option('slugs')?.split(',').map((s) => s.trim()).filter(Boolean);

// ─── .env.local ───
const env = {};
readFileSync(resolve(__dirname, '../.env.local'), 'utf-8')
  .split('\n')
  .forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    let val = trimmed.substring(eqIdx + 1).trim();
    if (/^(["']).*\1$/.test(val)) val = val.slice(1, -1);
    const commentIdx = val.search(/\s+#/);
    if (commentIdx > 0) val = val.substring(0, commentIdx).trim();
    env[trimmed.substring(0, eqIdx).trim()] = val;
  });

const OPENAI_API_KEY = env.OPENAI_API_KEY;
const IMAGE_MODEL = env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ─── Prompt ───

// 인물별 묘사 (나이 · 신분에 맞는 복식). 없으면 시대 기본값 사용
const PERSON_OVERRIDES = {
  'crown-prince-uigyeong': {
    age: 'about 18 years old',
    attire: 'early Joseon crown prince attire: a deep navy-blue gonryongpo (袞龍袍) robe with a round embroidered dragon badge on the chest, and a black ikseongwan (翼善冠) winged cap',
    mood: 'gentle, scholarly, slightly frail young man',
  },
  'deokheung-daewongun': {
    age: 'in his late 20s',
    attire: 'mid Joseon royal prince attire: a dark crimson dallyeong (團領) official robe with an embroidered rank badge, a black samo (紗帽) hat with side wings, and a gakdae belt',
    mood: 'calm, modest noble',
  },
  'prince-jeongwon': {
    age: 'in his late 30s',
    attire: 'mid Joseon royal prince attire: a dark crimson dallyeong (團領) official robe with an embroidered rank badge, a black samo (紗帽) hat with side wings, and a gakdae belt',
    mood: 'dignified but weary noble',
  },
  'prince-euneon': {
    age: 'in his mid 40s',
    attire: 'late Joseon exiled royal: a plain light-grey dopo (道袍) scholar robe and a black horsehair gat (갓) hat, no insignia',
    mood: 'quiet, somber, resilient; living in exile on Ganghwa Island',
    setting: 'a humble thatched-roof house courtyard on Ganghwa Island',
  },
  'jeongye-daewongun': {
    age: 'in his mid 50s',
    attire: 'late Joseon commoner-scholar clothing: a worn off-white hanbok with a simple dopo robe and a black gat (갓) hat, no insignia',
    mood: 'weathered, humble, kind',
    setting: 'a modest rural house on Ganghwa Island',
  },
  'crown-prince-hyomyeong': {
    age: 'about 20 years old',
    attire: 'late Joseon crown prince attire: a deep navy-blue gonryongpo (袞龍袍) robe with a round embroidered dragon badge on the chest, and a black ikseongwan (翼善冠) winged cap',
    mood: 'bright, refined, confident young regent who loved court music and dance',
  },
};

function getEraAttire(birthYear) {
  if (birthYear <= 1500) return 'early Joseon royal hanbok with an ikseongwan (翼善冠) cap and gonryongpo (袞龍袍) dragon robe';
  if (birthYear <= 1650) return 'mid Joseon royal hanbok with traditional Korean court attire';
  if (birthYear <= 1800) return 'late Joseon royal or noble hanbok with traditional headwear';
  if (birthYear <= 1900) return 'late Joseon to Korean Empire era formal attire';
  return 'modern Korean formal suit, 20th century attire';
}

function buildPrompt(person) {
  const o = PERSON_OVERRIDES[person.slug] ?? {};
  const lifespan = person.death_year - person.birth_year;
  const age = o.age ?? `in his ${Math.min(Math.max(Math.floor(lifespan * 0.6), 30), 60)}s`;

  return `A photorealistic cinematic portrait of ${person.name_en}, a Korean historical figure of the Joseon dynasty (${person.birth_year}–${person.death_year}).

Subject: a Korean man ${age}, wearing ${o.attire ?? getEraAttire(person.birth_year)}.
Expression: ${o.mood ?? 'dignified and composed'}.
Setting: ${o.setting ?? 'a traditional Joseon palace hall or courtyard, softly blurred in the background'}.

Style: historically accurate costume, like a still from a high-quality Korean historical drama. Waist-up composition, subject centered, natural warm lighting, realistic skin texture, shallow depth of field.

Do NOT include any text, letters, watermarks, or labels in the image.`;
}

// ─── OpenAI ───

async function generateImage(prompt) {
  const body = { model: IMAGE_MODEL, prompt, n: 1, size: '1024x1024' };
  if (IMAGE_MODEL === 'dall-e-3') Object.assign(body, { quality: 'standard', response_format: 'b64_json' });
  else body.quality = 'medium';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);

  const data = await res.json();
  return Buffer.from(data.data[0].b64_json, 'base64');
}

// 512px WebP (thumbnails are shown at ≤ 96px, OG at larger sizes)
const toWebp = (buffer) => sharp(buffer).resize(512, 512, { fit: 'cover' }).webp({ quality: 85 }).toBuffer();

// ─── Supabase ───

async function uploadPortrait(person, webp) {
  const fileName = `${person.id}/portrait.webp`;
  const { error } = await supabase.storage
    .from('persons')
    .upload(fileName, webp, { contentType: 'image/webp', upsert: true });
  if (error) throw new Error(`Storage upload error: ${error.message}`);

  // Cache-busting query so CDN/browser pick up a replaced image
  const { data } = supabase.storage.from('persons').getPublicUrl(fileName);
  const url = `${data.publicUrl}?v=${Date.now()}`;

  const { error: dbError } = await supabase.from('persons').update({ thumbnail: url }).eq('id', person.id);
  if (dbError) throw new Error(`DB update error: ${dbError.message}`);
  return url;
}

// ─── Main ───

async function main() {
  let query = supabase
    .from('persons')
    .select('id, name_ko, name_en, slug, birth_year, death_year, thumbnail')
    .eq('is_deleted', false)
    .order('birth_year');
  query = SLUGS ? query.in('slug', SLUGS) : query.is('thumbnail', null);

  const { data: persons, error } = await query;
  if (error) throw new Error(`DB query error: ${error.message}`);
  if (SLUGS) {
    const missing = SLUGS.filter((s) => !persons.some((p) => p.slug === s));
    if (missing.length) console.warn(`⚠️  Not found: ${missing.join(', ')}`);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const mode = DRY_RUN ? 'dry-run' : UPLOAD ? 'upload' : `generate (${IMAGE_MODEL})`;
  console.log(`\n🎨 ${persons.length} persons — ${mode}\n`);

  if (!DRY_RUN && !UPLOAD && !OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing in .env.local');
  }

  let success = 0;
  for (const [i, person] of persons.entries()) {
    const tag = `[${i + 1}/${persons.length}] ${person.name_ko} (${person.slug})`;
    const localPath = resolve(OUTPUT_DIR, `${person.slug}.webp`);
    try {
      if (DRY_RUN) {
        console.log(`${tag}\n${buildPrompt(person)}\n`);
        continue;
      }
      if (UPLOAD) {
        if (!existsSync(localPath)) throw new Error(`No local image — generate first (${localPath})`);
        const url = await uploadPortrait(person, readFileSync(localPath));
        console.log(`${tag} ✓ uploaded → ${url}`);
      } else {
        const webp = await toWebp(await generateImage(buildPrompt(person)));
        writeFileSync(localPath, webp);
        console.log(`${tag} ✓ saved ${localPath} (${(webp.length / 1024).toFixed(0)}KB)`);
        if (i < persons.length - 1) await new Promise((r) => setTimeout(r, 3000));
      }
      success++;
    } catch (err) {
      console.error(`${tag} ✗ ${err.message}`);
    }
  }

  if (!DRY_RUN) console.log(`\n✅ ${success}/${persons.length} succeeded\n`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
