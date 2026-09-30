/**
 * Fetch posters for Joseon media nodes from Wikipedia (en, ko fallback) → Supabase Storage `nodes/media/<slug>.<ext>` → nodes.thumbnail
 * Usage: node scripts/fetch-joseon-media-posters.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JOSEON_MEDIA } from './data/joseon-media.mjs';

const DRY = process.argv.includes('--dry-run');
const env = {};
readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local'), 'utf-8').split('\n').forEach((l) => {
  const t = l.trim(); if (!t || t.startsWith('#') || !t.includes('=')) return;
  const i = t.indexOf('='); env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
});
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const UA = { 'User-Agent': 'SillokBot/1.0 (poster fetch; contact via site)' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; i < 6; i++) {
    await sleep(1200);
    const r = await fetch(url, { headers: UA });
    if (r.status !== 429) return r;
    await sleep(5000 * (i + 1));
  }
  throw new Error('rate limited');
}
async function search(lang, q) {
  const r = await get(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=1&format=json`);
  return (await r.json()).query?.search?.[0]?.title ?? null;
}
async function image(lang, title, strict = true) {
  const r = await get(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (!r.ok) return null;
  const d = await r.json();
  // reject person/other pages: the summary must describe a TV series or film
  if (strict && !/television|tv series|drama|film|movie|드라마|영화/i.test(`${d.description ?? ''}`)) return null;
  return d.originalimage?.source ?? d.thumbnail?.source ?? null;
}

const OVERRIDES = {
  'the-great-king-sejong': { en: [], ko: ['대왕 세종'] },
  'heo-jun-drama': { en: ['Hur Jun (TV series)'], ko: ['허준 (드라마)'] },
  'jingbirok-drama': { en: [], ko: ['징비록 (드라마)'] },
  'hwajung-drama': { en: ['Hwajung'], ko: ['화정 (드라마)'] },
  'hwang-jin-yi-2006': { en: ['Hwang Jin Yi (TV series)'], ko: ['황진이 (드라마)'] },
  'the-princess-man': { en: ["The Princess' Man"], ko: ['공주의 남자'] },
  'jackpot-2016': { en: ['The Royal Gambler'], ko: ['대박 (2016년 드라마)', '대박 (드라마)'] },
  'jang-hui-bin-2002': { en: [], ko: ['장희빈 (2002년 드라마)', '장희빈 (드라마)'] },
};
const enQuery = (m) => `${m.title.replace(/\s*\(.*\)$/, '')} ${m.media_type === 'film' ? 'film' : 'South Korean television series'} ${m.release_year}`;
let ok = 0; const miss = [];
for (const m of JOSEON_MEDIA) {
  const { data: node } = await db.from('nodes').select('id, thumbnail').eq('slug', m.slug).single();
  if (!node || node.thumbnail) continue;
  let src = null, page = null, lang = 'en';
  const ov = OVERRIDES[m.slug];
  for (const t of ov?.en ?? []) { if (!src) { page = t; src = await image('en', t, false); } }
  if (!src && !ov?.en) { page = await search('en', enQuery(m)); if (page) src = await image('en', page); }
  if (!src) for (const t of ov?.ko ?? []) { if (!src) { lang = 'ko'; page = t; src = await image('ko', t, false); } }
  if (!src && !ov) { lang = 'ko'; page = await search('ko', m.original_title_ko + (m.media_type === 'film' ? ' 영화' : ' 드라마')); if (page) src = await image('ko', page); }
  if (!src) { miss.push(m.slug); console.log(`✗ ${m.slug}`); continue; }
  console.log(`✓ ${m.slug} ← ${lang}:${page}`);
  if (DRY) continue;
  const res = await fetch(src, { headers: UA });
  const type = res.headers.get('content-type') || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const path = `media/${m.slug}.${ext}`;
  const { error } = await db.storage.from('nodes').upload(path, Buffer.from(await res.arrayBuffer()), { contentType: type, upsert: true });
  if (error) { console.log('  upload failed:', error.message); miss.push(m.slug); continue; }
  const url = db.storage.from('nodes').getPublicUrl(path).data.publicUrl;
  await db.from('nodes').update({ thumbnail: url }).eq('id', node.id);
  ok++;
}
console.log(`done: ${ok} uploaded, missing: ${miss.join(', ') || 'none'}`);
