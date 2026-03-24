/**
 * 인물 AI 초상화 생성 스크립트
 * - DALL-E 3로 사실적 초상화 생성
 * - Supabase Storage에 업로드
 * - persons.thumbnail 컬럼 업데이트
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 파싱
const envPath = resolve(__dirname, '../apps/web/.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
const NEEDED_KEYS = ['OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  const key = trimmed.substring(0, eqIdx).trim();
  if (!NEEDED_KEYS.includes(key)) return;
  let val = trimmed.substring(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  // 인라인 주석 제거 (공백+# 패턴)
  const commentIdx = val.search(/\s+#/);
  if (commentIdx > 0) {
    val = val.substring(0, commentIdx).trim();
  }
  env[key] = val;
});

const OPENAI_API_KEY = env.OPENAI_API_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 시대별 복장/스타일 결정
function getEraStyle(birthYear, name_ko) {
  if (birthYear <= 943) return { era: '고려 초기', costume: 'early Goryeo dynasty official robes and gwanmo (冠帽) hat' };
  if (birthYear <= 1100) return { era: '고려 중기', costume: 'mid Goryeo dynasty royal or noble attire with traditional headwear' };
  if (birthYear <= 1394) return { era: '고려 후기', costume: 'late Goryeo dynasty clothing influenced by Yuan dynasty, with traditional Korean elements' };
  if (birthYear <= 1500) return { era: '조선 초기', costume: 'early Joseon dynasty royal hanbok with ikseongwan (翼善冠) crown and gonryongpo (袞龍袍) dragon robe' };
  if (birthYear <= 1650) return { era: '조선 중기', costume: 'mid Joseon dynasty royal hanbok with traditional Korean king attire' };
  if (birthYear <= 1800) return { era: '조선 후기', costume: 'late Joseon dynasty royal or noble hanbok with traditional headwear' };
  if (birthYear <= 1900) return { era: '구한말', costume: 'late Joseon to Korean Empire era formal attire, transitional period clothing' };
  return { era: '근현대', costume: 'modern Korean formal suit and tie, 20th century political leader attire' };
}

function buildPrompt(person) {
  const { era, costume } = getEraStyle(person.birth_year, person.name_ko);

  const ageAtDeath = person.death_year - person.birth_year;
  const depictAge = Math.min(Math.max(Math.floor(ageAtDeath * 0.6), 30), 60);

  return `A photorealistic portrait painting of ${person.name_en}, a Korean historical figure from the ${era} era (${person.birth_year}-${person.death_year}).

The subject is a Korean man in his ${depictAge}s, wearing ${costume}.

Style: Classical Korean royal portrait (초상화) style with a plain dark background. Dignified, solemn expression facing slightly to the left. Warm lighting from the front-left. Highly detailed face with realistic skin texture. The painting should look like an authentic traditional Korean royal portrait but with photorealistic quality.

Do NOT include any text, watermarks, or labels in the image.`;
}

async function generateImage(prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DALL-E API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return Buffer.from(data.data[0].b64_json, 'base64');
}

async function uploadToSupabase(personId, imageBuffer) {
  const fileName = `${personId}/portrait.webp`;

  const { error } = await supabase.storage
    .from('persons')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) throw new Error(`Storage upload error: ${error.message}`);

  const { data } = supabase.storage.from('persons').getPublicUrl(fileName);
  return data.publicUrl;
}

async function updatePersonThumbnail(personId, thumbnailUrl) {
  const { error } = await supabase
    .from('persons')
    .update({ thumbnail: thumbnailUrl })
    .eq('id', personId);

  if (error) throw new Error(`DB update error: ${error.message}`);
}

async function main() {
  // thumbnail이 없는 인물만 조회
  const { data: persons, error } = await supabase
    .from('persons')
    .select('id, name_ko, name_en, slug, birth_year, death_year, thumbnail')
    .eq('is_deleted', false)
    .is('thumbnail', null)
    .order('birth_year');

  if (error) {
    console.error('DB query error:', error);
    process.exit(1);
  }

  console.log(`\n🎨 ${persons.length}명의 인물 초상화를 생성합니다.\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < persons.length; i++) {
    const person = persons[i];
    const progress = `[${i + 1}/${persons.length}]`;

    try {
      console.log(`${progress} ${person.name_ko} (${person.name_en}) 생성 중...`);

      // 1. 프롬프트 생성
      const prompt = buildPrompt(person);

      // 2. DALL-E 3 이미지 생성
      const imageBuffer = await generateImage(prompt);
      console.log(`  ✓ 이미지 생성 완료 (${(imageBuffer.length / 1024).toFixed(0)}KB)`);

      // 3. Supabase Storage 업로드
      const thumbnailUrl = await uploadToSupabase(person.id, imageBuffer);
      console.log(`  ✓ 업로드 완료`);

      // 4. DB 업데이트
      await updatePersonThumbnail(person.id, thumbnailUrl);
      console.log(`  ✓ DB 업데이트 완료: ${thumbnailUrl}\n`);

      success++;

      // Rate limit 방지 (DALL-E 3: 5 req/min for tier 1)
      if (i < persons.length - 1) {
        console.log(`  ⏳ 15초 대기 (rate limit)...\n`);
        await new Promise(r => setTimeout(r, 15000));
      }
    } catch (err) {
      console.error(`  ✗ ${person.name_ko} 실패: ${err.message}\n`);
      failed++;
      // 에러 시에도 대기 후 계속
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ 완료: ${success}명 성공, ${failed}명 실패`);
  console.log(`========================================\n`);
}

main();
