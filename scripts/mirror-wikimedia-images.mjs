/**
 * Wikimedia 이미지 미러링 스크립트
 *
 * 모든 ARTIFACT 노드에서 wikimedia thumbnail을 다운로드하여
 * Supabase Storage('nodes' 버킷)에 업로드 후 nodes.thumbnail URL을 갱신.
 *
 * 사용법:
 *   node scripts/mirror-wikimedia-images.mjs
 *
 * 사전 준비:
 *   - Supabase Studio에서 'nodes' Storage 버킷 생성 (public)
 *   - .env.local에 SUPABASE_SERVICE_ROLE_KEY 필요
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 파싱
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  const key = trimmed.substring(0, eqIdx).trim();
  let val = trimmed.substring(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  const commentIdx = val.search(/\s+#/);
  if (commentIdx > 0) val = val.substring(0, commentIdx).trim();
  env[key] = val;
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET = 'nodes';
const USER_AGENT = 'SillokBot/1.0 (https://sillok.kr; contact@sillok.kr) Educational';

/**
 * Convert wikimedia original URL → CDN-cached thumb URL (avoids rate limiting).
 */
function wikimediaThumb(url, width = 800) {
  if (!url || !url.includes('upload.wikimedia.org/wikipedia/commons/')) return url;
  if (url.includes('/wikipedia/commons/thumb/')) return url;

  const match = url.match(/\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/i);
  if (!match) return url;

  const [, h1, h2, filename] = match;
  const thumbName = filename.toLowerCase().endsWith('.svg')
    ? `${width}px-${filename}.png`
    : `${width}px-${filename}`;
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${h1}/${h2}/${filename}/${thumbName}`;
}

function getExtension(url) {
  const m = url.match(/\.([a-zA-Z0-9]{3,4})(?:[?#]|$)/);
  if (!m) return 'jpg';
  const ext = m[1].toLowerCase();
  // SVG가 thumb일 땐 png로 렌더되므로 png 처리
  if (ext === 'svg') return 'png';
  return ext;
}

function getContentType(ext) {
  return (
    {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    }[ext] || 'image/jpeg'
  );
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

async function uploadImage(slug, ext, buffer) {
  const fileName = `artifacts/${slug}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: getContentType(ext),
      upsert: true,
    });
  if (error) throw new Error(`Upload error: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

async function updateNodeThumbnail(nodeId, newUrl) {
  const { error } = await supabase
    .from('nodes')
    .update({ thumbnail: newUrl })
    .eq('id', nodeId);
  if (error) throw new Error(`DB update error: ${error.message}`);
}

async function main() {
  console.log('\n📦 Wikimedia 이미지 미러링 시작\n');

  const { data: nodes, error } = await supabase
    .from('nodes')
    .select('id, slug, title, thumbnail')
    .eq('node_type', 'ARTIFACT')
    .eq('is_deleted', false)
    .like('thumbnail', '%upload.wikimedia.org%');

  if (error) {
    console.error('❌ DB query error:', error);
    process.exit(1);
  }

  console.log(`총 ${nodes.length}개 노드 발견\n`);

  let success = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const progress = `[${i + 1}/${nodes.length}]`;

    try {
      console.log(`${progress} ${node.slug} — ${node.title}`);

      // wikimedia thumb URL로 변환 (원본보다 캐싱 잘 됨)
      const thumbUrl = wikimediaThumb(node.thumbnail, 800);
      console.log(`  ↓ ${thumbUrl.substring(0, 100)}${thumbUrl.length > 100 ? '...' : ''}`);

      const ext = getExtension(thumbUrl);
      const buffer = await downloadImage(thumbUrl);
      console.log(`  ✓ 다운로드 완료 (${(buffer.length / 1024).toFixed(0)}KB)`);

      const newUrl = await uploadImage(node.slug, ext, buffer);
      console.log(`  ✓ 업로드 완료`);

      await updateNodeThumbnail(node.id, newUrl);
      console.log(`  ✓ DB 업데이트 → ${newUrl}\n`);

      success++;

      // wikimedia rate limit 회피 (1초 간격)
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ✗ 실패: ${err.message}\n`);
      failed++;
      failures.push({ slug: node.slug, error: err.message });
      // 에러 시 대기
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ 완료: ${success}개 성공, ${failed}개 실패`);
  if (failures.length > 0) {
    console.log(`\n실패 목록:`);
    failures.forEach((f) => console.log(`  - ${f.slug}: ${f.error}`));
  }
  console.log(`========================================\n`);
}

main();
