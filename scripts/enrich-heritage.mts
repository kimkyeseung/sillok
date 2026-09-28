// 국보·보물 노드 보강 — fetch-heritage(-images).mjs · translate-heritage.mjs 결과를 이미 등록된 노드에 반영
//
// metadata: year_start/year_end/year_precision (시대 문자열 규칙 파싱), designation_group(+_size),
//           region_key, collection(영문, collection-aliases.json 으로 정리), thumbnail_license
//           (designation_group_size·group_primary·featured_rank 는 heritage-ranks.mts 담당)
// thumbnail: 상업적 이용 가능한 공공누리 1유형 이미지만 (없으면 비움). 큐레이션 노드(source 없음)는 기존 썸네일 유지
// node_images: 1유형 + 3유형(변경금지, 크롭 없이 표시) — 노드별로 지우고 다시 넣어 재실행 안전
//
// 사용: npx tsx --env-file=.env.local scripts/enrich-heritage.mts [--dry-run] [--skip-images]
//   --skip-images: metadata·썸네일만 갱신 (node_images 재작성 생략 — 소장처 이름 정리 등에 사용)

import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { parseEraYears } from '../lib/heritage-era';

const DRY = process.argv.includes('--dry-run');
const SKIP_IMAGES = process.argv.includes('--skip-images');
const DIR = new URL('../data/heritage/', import.meta.url);
const MODEL = 'gpt-5.4-mini';
const TRANSLATE_CONCURRENCY = 4;

type License = 'kogl-0' | 'kogl-1' | 'kogl-2' | 'kogl-3' | 'kogl-4' | null;
interface SourceItem {
  id: string;
  kind: '국보' | '보물';
  designation_no: string;
  name: string;
  region: string | null;
  admin: string | null;
  era: string | null;
  image_url: string | null;
}
interface ApiImage {
  url: string;
  caption_ko: string | null;
  license: License;
}

const readJson = async <T,>(f: string): Promise<T> =>
  JSON.parse(await readFile(new URL(f, DIR), 'utf8'));
const readJsonOr = async <T,>(f: string, fallback: T): Promise<T> => {
  try {
    return await readJson<T>(f);
  } catch {
    return fallback;
  }
};

const REGION_KEYS: Array<[RegExp, string]> = [
  [/^서울/, 'seoul'],
  [/^부산/, 'busan'],
  [/^대구/, 'daegu'],
  [/^인천/, 'incheon'],
  [/^광주/, 'gwangju'],
  [/^대전/, 'daejeon'],
  [/^울산/, 'ulsan'],
  [/^세종/, 'sejong'],
  [/^경기/, 'gyeonggi'],
  [/^강원/, 'gangwon'],
  [/^충(청)?북/, 'chungbuk'],
  [/^충(청)?남/, 'chungnam'],
  [/^전(라)?북/, 'jeonbuk'],
  [/^전(라)?남/, 'jeonnam'],
  [/^경(상)?북/, 'gyeongbuk'],
  [/^경(상)?남/, 'gyeongnam'],
  [/^제주/, 'jeju'],
];
const regionKey = (region: string | null) =>
  REGION_KEYS.find(([re]) => re.test(region ?? ''))?.[1] ?? null;

/** Commercially usable KOGL types: 1 (free) and 3 (no derivatives — shown uncropped) */
const GALLERY_LICENSES = new Set<License>(['kogl-1', 'kogl-3']);

/* ── AI translation helpers (cached in data/heritage/*.json) ── */

async function translateStrings(
  file: string,
  strings: string[],
  instructions: string,
  batchSize: number
): Promise<Record<string, string>> {
  const cache = await readJsonOr<Record<string, string>>(file, {});
  const todo = [...new Set(strings)].filter((s) => !(s in cache));
  const batches: string[][] = [];
  for (let i = 0; i < todo.length; i += batchSize)
    batches.push(todo.slice(i, i + batchSize));
  let next = 0;
  let done = 0;
  let saving = Promise.resolve();

  async function run(batch: string[]) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        reasoning_effort: 'low',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'translations',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['items'],
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['ko', 'en'],
                    properties: {
                      ko: { type: 'string' },
                      en: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        messages: [
          {
            role: 'system',
            content: `${instructions} Return every input exactly once, with "ko" copied verbatim.`,
          },
          { role: 'user', content: JSON.stringify(batch) },
        ],
      }),
    });
    if (!res.ok)
      throw new Error(
        `${file} translate HTTP ${res.status}: ${await res.text()}`
      );
    const json = await res.json();
    for (const { ko, en } of JSON.parse(json.choices[0].message.content)
      .items as { ko: string; en: string }[]) {
      if (batch.includes(ko)) cache[ko] = en;
    }
    // Writes are chained so parallel batches never interleave on the cache file
    saving = saving.then(() =>
      writeFile(new URL(file, DIR), JSON.stringify(cache, null, 2) + '\n')
    );
    await saving;
    process.stdout.write(`\r  ${file}: ${++done}/${batches.length} batches`);
  }

  await Promise.all(
    Array.from({ length: TRANSLATE_CONCURRENCY }, async () => {
      while (next < batches.length) await run(batches[next++]);
    })
  );
  if (todo.length) process.stdout.write('\n');
  return cache;
}

/* ── Main ── */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const source = [
  ...(await readJson<{ items: SourceItem[] }>('national-treasures.json')).items,
  ...(await readJson<{ items: SourceItem[] }>('treasures.json')).items,
];
const byId = new Map(source.map((x) => [x.id, x]));
const images = await readJson<Record<string, ApiImage[]>>('images.json');
const translations =
  await readJson<Record<string, { created_year: number | null }>>(
    'translations.json'
  );

const missingImages = source.filter((x) => !(x.id in images)).length;
if (missingImages)
  throw new Error(
    `${missingImages} items have no image list yet — run fetch-heritage-images.mjs first`
  );

// 지정번호가 같은 항목 묶음 (조선왕조실록 판본들 등) — 크기·대표는 heritage-ranks.mts 가 노드 기준으로 계산
const groupKey = (x: SourceItem) =>
  `${x.kind === '국보' ? 'national_treasure' : 'treasure'}-${x.designation_no.split('-')[0]}`;

const collections = await translateStrings(
  'collections.json',
  source.map((x) => x.admin).filter((a): a is string => !!a),
  'Translate each Korean heritage custodian/collection name into its official English name (e.g. 국립중앙박물관 → National Museum of Korea, 경주시 → Gyeongju City, 송광사 → Songgwangsa Temple, 삼성문화재단 → Samsung Foundation of Culture). If the value is a private individual\'s name or a family/clan (문중), return "Private collection".',
  150
);

// 소장처 영문명 정리 — 종단명·직함 접미어 제거, 같은 기관 이름 통일, 오역 수정
const collectionRules = await readJson<{
  stripSuffixes: string[];
  aliases: Record<string, string>;
  koreanFixes: Record<string, string>;
}>('collection-aliases.json');
const suffixes = collectionRules.stripSuffixes.map((re) => new RegExp(re));
function collectionName(admin: string | null): string | null {
  if (!admin) return null;
  let name = collectionRules.koreanFixes[admin] ?? collections[admin];
  if (!name) return null;
  for (const re of suffixes) name = name.replace(re, '');
  return collectionRules.aliases[name] ?? name;
}

// 같은 URL이 두 번 나오기도 함 → (node_id, url) UNIQUE 위반 방지
const galleryOf = (id: string) =>
  (images[id] ?? [])
    .filter((i) => GALLERY_LICENSES.has(i.license))
    .filter((i, idx, arr) => arr.findIndex((j) => j.url === i.url) === idx);
// Captions only matter when node_images is rewritten
const captions = SKIP_IMAGES
  ? {}
  : await translateStrings(
      'image-captions.json',
      source
        .flatMap((x) => galleryOf(x.id).map((i) => i.caption_ko))
        .filter((c): c is string => !!c),
      'Translate each short Korean photo caption of a Korean cultural heritage item into concise English (Revised Romanization for proper nouns, e.g. "석굴암석굴 감실보살상" → "Bodhisattva in a niche, Seokguram Grotto").',
      150
    );

// 등록된 노드 (heritage_id 기준)
const nodes: {
  id: string;
  slug: string;
  thumbnail: string | null;
  metadata: Record<string, unknown>;
}[] = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from('nodes')
    .select('id, slug, thumbnail, metadata')
    .eq('node_type', 'ARTIFACT')
    .not('metadata->>heritage_id', 'is', null)
    .range(from, from + 999);
  if (error) throw error;
  nodes.push(...data);
  if (data.length < 1000) break;
}

const stats = { nodes: 0, thumbnails: 0, cleared: 0, images: 0 };
for (const node of nodes) {
  const x = byId.get(node.metadata.heritage_id as string);
  if (!x) continue;
  const isImported = node.metadata.source === 'khs';

  const era = parseEraYears(x.era);
  const aiYear = translations[x.id]?.created_year ?? null;
  // 명시 연도가 있으면 그 연도, 범위만 있으면 AI 추정이 범위 안일 때만 유지
  let createdYear =
    (node.metadata.created_year as number | undefined) ?? aiYear;
  if (isImported && era) {
    if (era.year_precision === 'exact' || era.year_precision === 'approximate')
      createdYear = era.year_start;
    else if (
      createdYear == null ||
      createdYear < era.year_start ||
      createdYear > era.year_end
    )
      createdYear = Math.round((era.year_start + era.year_end) / 2);
  }

  const gallery = galleryOf(x.id);
  const free = gallery.filter((i) => i.license === 'kogl-1');
  const mainUrl = x.image_url?.replace(/^http:\/\//, 'https://');
  const thumb = free.find((i) => i.url === mainUrl) ?? free[0] ?? null;

  const metadata: Record<string, unknown> = {
    ...node.metadata,
    ...(era ?? {}),
    ...(createdYear != null && { created_year: createdYear }),
    designation_group: groupKey(x),
    region_key: regionKey(x.region),
    collection: collectionName(x.admin),
  };
  const update: Record<string, unknown> = { metadata };
  if (isImported) {
    update.thumbnail = thumb?.url ?? null;
    if (thumb) metadata.thumbnail_license = 'kogl-1';
    else delete metadata.thumbnail_license;
    if (thumb) stats.thumbnails++;
    else stats.cleared++;
  }
  for (const k of Object.keys(metadata))
    if (metadata[k] == null) delete metadata[k];

  const rows = gallery.map((img, i) => ({
    node_id: node.id,
    url: img.url,
    caption_ko: img.caption_ko,
    caption_en: img.caption_ko ? (captions[img.caption_ko] ?? null) : null,
    license: img.license as 'kogl-1' | 'kogl-3',
    source: 'khs',
    sort_order: i,
  }));

  if (!DRY) {
    const { error } = await supabase
      .from('nodes')
      .update(update)
      .eq('id', node.id);
    if (error) throw error;
  }
  if (!DRY && !SKIP_IMAGES) {
    const del = await supabase
      .from('node_images')
      .delete()
      .eq('node_id', node.id)
      .eq('source', 'khs');
    if (del.error) throw del.error;
    if (rows.length) {
      const ins = await supabase.from('node_images').insert(rows);
      if (ins.error) throw ins.error;
    }
  }
  stats.nodes++;
  stats.images += rows.length;
  if (stats.nodes % 100 === 0)
    process.stdout.write(`\r  nodes ${stats.nodes}/${nodes.length}`);
}
process.stdout.write('\n');
console.log(DRY ? '[dry-run]' : '', stats);
