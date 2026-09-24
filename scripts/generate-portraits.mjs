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

// ─── Period attire (historically grounded descriptions) ───
const ATTIRE = {
  goguryeoKing:
    'Goguryeo royal attire as depicted in Goguryeo tomb murals: a long robe belted at the waist with patterned borders, wide trousers, and a tall black silk crown (baengnagwan) — no Chinese imperial dragon robes',
  goguryeoOfficial:
    'Goguryeo official attire from tomb murals: a long belted jacket with patterned trim, wide trousers, and a cap decorated with two upright bird feathers (jougwan)',
  baekjeKing:
    'Baekje royal attire: a dark silk robe and a black silk cap adorned with gold flame-shaped ornaments like those excavated from King Muryeong\'s tomb',
  sillaKing:
    'Silla royal attire: a gold crown with tree- and antler-shaped uprights and dangling jade ornaments (like the Geumgwanchong crown), a long silk robe and an openwork gold belt',
  sillaTangCourt:
    'Unified Silla court attire adopted from Tang China: a round-collared official robe belted at the waist and a black bokdu (futou) cap',
  monk:
    'the robes of a Korean Buddhist monk: a grey robe with a brown kasaya draped over one shoulder, shaved head, holding prayer beads',
  threeKingdomsArmor: 'Three Kingdoms period iron lamellar armor and a riveted iron helmet',
  goryeoOfficial:
    'Goryeo civil official attire: a purple round-collared court robe and a black bokdu hat with long horizontal wings',
  crownPrince:
    'Joseon crown prince attire: a deep navy-blue gonryongpo robe with round FOUR-clawed dragon badges on the chest and shoulders, a jade belt, and an ikseongwan — a black silk cap whose two small rounded wings stand UPRIGHT at the back of the cap (not horizontal side wings like an official\'s samo)',
  royalPrince:
    'Joseon royal prince (gun) court attire: a deep crimson dallyeong robe with a square embroidered badge showing a white mythical beast (baektaek) — NOT a crane — a black samo hat with side wings, and a seodae belt',
};

// 인물별 묘사 (시대 · 나이 · 신분 · 성별). 없으면 조선 시대 기본값 사용
const PERSON_OVERRIDES = {
  // ── Joseon royals ──
  'crown-prince-uigyeong': { age: 'about 18 years old', attire: ATTIRE.crownPrince, mood: 'gentle, scholarly, slightly frail young man' },
  'crown-prince-hyomyeong': { age: 'about 20 years old', attire: ATTIRE.crownPrince, mood: 'bright, refined, confident young regent who loved court music and dance' },
  'deokheung-daewongun': { age: 'in his late 20s', attire: ATTIRE.royalPrince, mood: 'calm, modest young noble with a thin mustache and no beard' },
  'prince-jeongwon': { age: 'in his late 30s', attire: ATTIRE.royalPrince, mood: 'dignified but weary man with a short full beard' },
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
  // ── Late Joseon ──
  'father-zhou-wenmo': {
    subject: 'a Chinese man in his 40s',
    era: 'the late Joseon dynasty (a Chinese Catholic priest who secretly entered Korea in 1794)',
    attire: 'a simple dark scholar\'s robe of the Qing era, holding a small wooden cross',
    mood: 'calm, devout, quietly courageous',
    setting: 'a secret candle-lit room in a traditional Korean house',
  },
  'hong-gyeong-nae': {
    age: 'in his early 30s',
    attire: 'late Joseon rebel commander: a dark blue dopo robe tied with a military sash, a black gat, a sword at his side',
    mood: 'determined, charismatic',
    setting: 'the wall of Jeongju fortress at dusk',
  },
  // ── Ancient / Three Kingdoms ──
  'bak-hyeokgeose': { era: 'Saro, the early Silla kingdom (1st century BC)', age: 'in his 50s', attire: ATTIRE.sillaKing, mood: 'serene, dignified founder of legend' },
  jumong: {
    era: 'the ancient kingdom of Goguryeo (1st century BC)',
    age: 'in his 30s',
    attire: `${ATTIRE.goguryeoOfficial}, with a composite bow over his shoulder (he was famed as a master archer)`,
    mood: 'heroic, keen-eyed founder of legend',
    setting: 'a misty northern mountain fortress',
  },
  'onjo-of-baekje': { era: 'the founding of Baekje (1st century BC)', age: 'in his 40s', attire: 'early Baekje founder\'s attire: a long belted robe and a simple gold circlet', mood: 'resolute founder of legend', setting: 'the banks of the Han River' },
  'daemusin-of-goguryeo': { era: 'the Goguryeo kingdom (1st century)', age: 'in his 30s', attire: ATTIRE.goguryeoKing, mood: 'martial, commanding' },
  'kim-suro-of-gaya': { era: 'Geumgwan Gaya (1st–2nd century)', age: 'in his 50s', attire: 'Gaya royal attire: a gilt-bronze crown and a long robe with iron ornaments', mood: 'wise founder of legend', setting: 'a coastal kingdom near the Nakdong River' },
  'gogukcheon-of-goguryeo': { era: 'the Goguryeo kingdom (2nd century)', age: 'in his 40s', attire: ATTIRE.goguryeoKing, mood: 'thoughtful reformer' },
  eulpaso: { era: 'the Goguryeo kingdom (2nd–3rd century)', age: 'in his 50s', attire: ATTIRE.goguryeoOfficial, mood: 'humble, principled statesman of common birth' },
  'geunchogo-of-baekje': { era: 'the Baekje kingdom (4th century)', age: 'in his 50s', attire: ATTIRE.baekjeKing, mood: 'powerful, confident conqueror' },
  'jangsu-of-goguryeo': { era: 'the Goguryeo kingdom (5th century)', age: 'in his 60s', attire: ATTIRE.goguryeoKing, mood: 'long-reigning, commanding ruler' },
  'jinheung-of-silla': { era: 'the Silla kingdom (6th century)', age: 'in his 30s', attire: ATTIRE.sillaKing, mood: 'ambitious, energetic conqueror' },
  isabu: { era: 'the Silla kingdom (6th century)', age: 'in his 40s', attire: ATTIRE.threeKingdomsArmor, mood: 'clever, bold general', setting: 'the deck of a wooden warship carrying carved wooden lion figures' },
  'seong-of-baekje': { era: 'the Baekje kingdom (6th century)', age: 'in his 50s', attire: ATTIRE.baekjeKing, mood: 'devout, cultured ruler who spread Buddhism to Japan' },
  'jinpyeong-of-silla': { era: 'the Silla kingdom (6th–7th century)', age: 'in his 50s', attire: ATTIRE.sillaKing, mood: 'steady, authoritative ruler' },
  'mu-of-baekje': { era: 'the Baekje kingdom (7th century)', age: 'in his 50s', attire: ATTIRE.baekjeKing, mood: 'confident builder king', setting: 'the construction site of the great Mireuksa temple pagoda' },
  'uija-of-baekje': { era: 'the Baekje kingdom (7th century)', age: 'in his 60s', attire: ATTIRE.baekjeKing, mood: 'somber last king of Baekje' },
  gyebaek: { era: 'the Baekje kingdom (7th century)', age: 'in his 40s', attire: ATTIRE.threeKingdomsArmor, mood: 'grim, resolute general before his last stand', setting: 'the battlefield of Hwangsanbeol' },
  // Kept calm and age-neutral: a teenage figure on a battlefield trips image moderation
  gwanchang: { age: 'in his late teens', era: 'the Silla kingdom (7th century)', attire: 'the attire of a Silla hwarang: a belted silk robe, a sword at his side and a flower tucked in his hair', mood: 'earnest, resolute young hwarang', setting: 'a quiet mountain training ground at dawn' },
  'kim-chunchu': { era: 'Silla on the eve of unification (7th century)', age: 'in his 50s', attire: ATTIRE.sillaTangCourt, mood: 'shrewd, diplomatic statesman-king' },
  'yeon-gaesomun': { era: 'the Goguryeo kingdom (7th century)', age: 'in his 50s', attire: 'Goguryeo generalissimo in iron lamellar armor with a feathered helmet, carrying several swords as records describe', mood: 'fierce, imposing military dictator' },
  // ── Unified Silla / Balhae / Later Three Kingdoms ──
  wonhyo: { era: 'Silla and Unified Silla (7th century)', age: 'in his 50s', attire: ATTIRE.monk, mood: 'free-spirited, warm, smiling monk', setting: 'a mountain path' },
  uisang: { era: 'Unified Silla (7th century)', age: 'in his 50s', attire: ATTIRE.monk, mood: 'stern, scholarly monk', setting: 'Buseoksa temple in the mountains' },
  'seol-chong': { era: 'Unified Silla (7th–8th century)', age: 'in his 40s', attire: ATTIRE.sillaTangCourt, mood: 'scholarly, holding a brush and a scroll' },
  'dae-joyeong': { era: 'the founding of Balhae (late 7th century)', age: 'in his 50s', attire: 'Balhae royal attire influenced by Goguryeo: a fur-trimmed belted robe and a black silk crown', mood: 'resolute founder', setting: 'a mountain fortress in Manchuria' },
  'kim-daeseong': { era: 'Unified Silla (8th century)', age: 'in his 50s', attire: ATTIRE.sillaTangCourt, mood: 'devout chief minister', setting: 'the courtyard of Bulguksa temple' },
  hyecho: { era: 'Unified Silla (8th century)', age: 'in his 20s', attire: `${ATTIRE.monk}, with a traveler's backpack and a walking staff`, mood: 'curious, determined pilgrim', setting: 'a desert road in Central Asia' },
  'kim-heonchang': { era: 'Unified Silla (9th century)', age: 'in his 40s', attire: `${ATTIRE.sillaTangCourt}, with a sword at his side`, mood: 'defiant aristocrat' },
  'jang-bogo': { era: 'Unified Silla (9th century)', age: 'in his 40s', attire: 'a Unified Silla maritime commander in light lamellar armor with a sea-travel cloak', mood: 'bold, commanding', setting: 'Cheonghaejin harbor with wooden trading ships' },
  'choe-chiwon': { era: 'late Unified Silla (9th century)', age: 'in his 40s', attire: ATTIRE.sillaTangCourt, mood: 'brilliant, melancholy scholar-poet', setting: 'a mountain pavilion at Gayasan' },
  'queen-jinseong': { subject: 'a Korean woman', era: 'late Unified Silla (9th century)', age: 'in her late 20s', attire: 'Unified Silla queen\'s attire: layered silk robes with a long skirt and a gold crown with jade ornaments', mood: 'regal but troubled queen' },
  'gyeon-hwon': { era: 'the Later Three Kingdoms (c. 900)', age: 'in his 50s', attire: `${ATTIRE.threeKingdomsArmor} with a crimson cloak`, mood: 'ambitious warlord-king' },
  gungye: { era: 'the Later Three Kingdoms (c. 901)', age: 'in his 40s', attire: 'a golden Buddhist crown and monk-like robes (he proclaimed himself the Maitreya Buddha), with a black patch over one eye', mood: 'intense, imperious' },
  // ── Goryeo ──
  'kim-busik': { era: 'the Goryeo dynasty (12th century)', age: 'in his 60s', attire: ATTIRE.goryeoOfficial, mood: 'dignified scholar-historian holding a bound book' },
  iryeon: { era: 'the Goryeo dynasty (13th century)', age: 'in his 70s', attire: ATTIRE.monk, mood: 'wise, gentle elder monk', setting: 'a quiet mountain temple' },
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
  const lifespan =
    person.birth_year != null && person.death_year != null ? person.death_year - person.birth_year : 60;
  const age = o.age ?? `in his ${Math.min(Math.max(Math.floor(lifespan * 0.6), 30), 60)}s`;

  const years =
    person.birth_year != null || person.death_year != null
      ? ` (${person.birth_year ?? '?'}–${person.death_year ?? '?'})`
      : '';
  return `A photorealistic cinematic portrait of ${person.name_en}, a Korean historical figure of ${o.era ?? 'the Joseon dynasty'}${years}.

Subject: ${o.subject ?? 'a Korean man'} ${age}, wearing ${o.attire ?? getEraAttire(person.birth_year)}.
Expression: ${o.mood ?? 'dignified and composed'}.
Setting: ${o.setting ?? `a palace hall or courtyard of that period, softly blurred in the background`}.

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
