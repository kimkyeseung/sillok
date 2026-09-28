// 국보·보물 → nodes(ARTIFACT) 등록
// 입력: data/heritage/{national-treasures,treasures,translations}.json (fetch-heritage → translate-heritage 순서로 생성)
// - 기존 큐레이션 노드: heritage_id·좌표·올바른 지정명만 metadata에 보강 (제목·설명·썸네일 유지)
// - 새 노드: metadata.source = 'khs', 썸네일은 국가유산청 이미지 URL 그대로 사용
// heritage_id 기준으로 이미 등록된 건 건너뛰므로 재실행 안전
// 정렬 순위(featured_rank)·그룹은 이후 scripts/heritage-ranks.mts 가 계산
// 사용: node --env-file=.env.local scripts/import-heritage.mjs [--dry-run]

import { readFile, writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const DRY = process.argv.includes('--dry-run')
const DIR = new URL('../data/heritage/', import.meta.url)
const readJson = async (f) => JSON.parse(await readFile(new URL(f, DIR)))

// 기존 노드 slug → heritage id (ccbaCpno). 지정번호가 틀린 노드가 많아 이름으로 수동 매칭
// (hunminjeongeum-eonhae, jagyeongnu-original 은 대응하는 단독 지정 유산 없음)
const EXISTING = {
  'heunginjimun': '1121100010000',
  'wongaksa-ten-story-pagoda': '1111100020000',
  'bukhansan-monument-of-king-jinheung': '1111100030000',
  'godalsa-temple-site-stupa': '1113100040000',
  'beopjusa-twin-lion-stone-lantern': '1113300050000',
  'tappyeong-ri-seven-story-stone-pagoda': '1113300060000',
  'bongseon-honggyeongsa-stele': '1113400070000',
  'jeongrimsa-five-story-stone-pagoda': '1113400090000',
  'silsangsa-stupa-of-monk-sucheol': '1123500330000',
  'mireuksa-stone-pagoda': '1113500110000',
  'bunhwangsa-stone-pagoda': '1113700300000',
  'haeinsa-janggyeong-panjeon': '1113800520000',
  'changnyeong-monument-of-king-jinheung': '1113800330000',
  'buseoksa-muryangsujeon-hall': '1113700180000',
  'bulguksa-gilt-bronze-amitabha-buddha': '1113700270000',
  'bulguksa-gilt-bronze-vairocana-buddha': '1113700260000',
  'bulguksa-seokgatap-pagoda': '1113700210000',
  'bulguksa-dabotap-pagoda': '1113700200000',
  'bulguksa-yeonhwagyo-chilbogyo-bridges': '1113700220000',
  'bulguksa-cheongungyo-baegungyo-bridges': '1113700230000',
  'seokguram-grotto': '1113700240000',
  'stele-of-king-taejong-muyeol': '1113700250000',
  'divine-bell-of-king-seongdeok': '1113700290000',
  'cheomseongdae-observatory': '1113700310000',
  'tripitaka-koreana-woodblocks': '1113800320000',
  'tripitaka-koreana-total': '1113800320000',
  'hunminjeongeum-haerye': '1111100700000',
  'celadon-maebyeong-crane': '1111100680000',
  'baekje-gilt-bronze-incense-burner': '1113402870000',
  'gilt-bronze-pensive-bodhisattva': '1111100830000',
  'gold-crown-ornaments-of-king-muryeong': '1113401540000',
  'gold-crown-ornaments-of-queen-muryeong': '1113401550000',
  'joseon-wangjo-sillok-jeongjoksan': '1111101510100',
  'gyeongbokgung-geunjeongjeon': '1111102230000',
  'changdeokgung-injeongjeon': '1111102250000',
  'changgyeonggung-myeongjeongjeon': '1111102260000',
  'changgyeonggung-jagyeongnu': '1111102290000',
  'honcheon-sigye': '1111102300000',
  'donguibogam-movable-type': '1111103190100',
  'heungcheonsa-bronze-bell': '1121114600000',
  'bosingak-bronze-bell': '1121100020000',
  'shilleoksa-josadang-hall': '1123101800000',
  'changdeokgung-injeongmun': '1121108130000',
  'changdeokgung-donhwamun': '1121103830000',
  'najeon-chrysanthemum-vines-case': '1122412240004',
}

const PROVINCES = {
  서울: 'Seoul', 부산: 'Busan', 대구: 'Daegu', 인천: 'Incheon', 광주: 'Gwangju', 대전: 'Daejeon',
  울산: 'Ulsan', 세종: 'Sejong', 경기: 'Gyeonggi-do', 강원: 'Gangwon-do', 충북: 'Chungcheongbuk-do',
  충남: 'Chungcheongnam-do', 전북: 'Jeonbuk-do', 전남: 'Jeollanam-do', 경북: 'Gyeongsangbuk-do',
  경남: 'Gyeongsangnam-do', 제주: 'Jeju-do',
}
const PROVINCE_KO = [
  ['서울', '서울'], ['부산', '부산'], ['대구', '대구'], ['인천', '인천'], ['광주', '광주'], ['대전', '대전'],
  ['울산', '울산'], ['세종', '세종'], ['경기', '경기'], ['강원', '강원'], ['충청북', '충북'], ['충북', '충북'],
  ['충청남', '충남'], ['충남', '충남'], ['전북', '전북'], ['전라북', '전북'], ['전라남', '전남'], ['전남', '전남'],
  ['경상북', '경북'], ['경북', '경북'], ['경상남', '경남'], ['경남', '경남'], ['제주', '제주'],
]
const provinceKey = (region) => PROVINCE_KO.find(([p]) => region?.startsWith(p))?.[1] ?? null
const METRO = new Set(['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종'])

const KIND = {
  국보: { en: 'National Treasure', key: 'national_treasure' },
  보물: { en: 'Treasure', key: 'treasure' },
}

// 시군구 한글 → 영문 (고유 목록 한 번만 AI 번역, locations.json 캐시)
async function translateDistricts(names) {
  const file = new URL('locations.json', DIR)
  let cache = {}
  try {
    cache = JSON.parse(await readFile(file))
  } catch {}
  const todo = names.filter((n) => !(n in cache))
  if (todo.length) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        reasoning_effort: 'low',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'districts',
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
                    properties: { ko: { type: 'string' }, en: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
        messages: [
          {
            role: 'system',
            content:
              'Give the official English name (Revised Romanization, without the -si/-gun/-gu suffix except for "Jung-gu", "Dong-gu", "Seo-gu", "Nam-gu", "Buk-gu") for each Korean city/county/district, e.g. 여주시 → Yeoju, 보은군 → Boeun, 종로구 → Jongno, 중구 → Jung-gu. Return every input.',
          },
          { role: 'user', content: JSON.stringify(todo) },
        ],
      }),
    })
    if (!res.ok) throw new Error(`district translate HTTP ${res.status}: ${await res.text()}`)
    const json = await res.json()
    for (const { ko, en } of JSON.parse(json.choices[0].message.content).items) cache[ko] = en
    await writeFile(file, JSON.stringify(cache, null, 2) + '\n')
  }
  return cache
}

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}

// JSON null은 jsonb 정렬에서 숫자보다 앞에 오고 IS NULL에도 안 걸림 → 키 자체를 뺀다
const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null))

const https = (url) => url?.replace(/^http:\/\//, 'https://') ?? null

function heritageMeta(x, district) {
  const kind = KIND[x.kind]
  const pk = provinceKey(x.region)
  const province = pk ? PROVINCES[pk] : null
  const location = district && !METRO.has(pk) ? `${district}, ${province}` : province
  return {
    heritage_id: x.id,
    heritage_kind: kind.key,
    designation: `${kind.en} No. ${x.designation_no}`,
    designation_ko: `${x.kind} 제${x.designation_no}호`,
    title_ko: x.name,
    title_hanja: x.name_hanja,
    location,
    location_ko: [pk, x.district].filter(Boolean).join(' ') || null,
    address_ko: x.address,
    latitude: x.latitude,
    longitude: x.longitude,
    era_ko: x.era,
    category_ko: x.category,
    quantity_ko: x.quantity,
    designated_date: x.designated_date,
    owner_ko: x.owner,
    admin_ko: x.admin,
    content_ko: x.content,
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const source = [...(await readJson('national-treasures.json')).items, ...(await readJson('treasures.json')).items]
const byId = new Map(source.map((x) => [x.id, x]))
const translations = await readJson('translations.json')

// 전체 노드 slug·heritage_id (1000행 제한 때문에 페이지 단위로)
const nodes = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from('nodes').select('id, slug, node_type, metadata').range(from, from + 999)
  if (error) throw error
  nodes.push(...data)
  if (data.length < 1000) break
}
const usedSlugs = new Set(nodes.map((n) => n.slug))
const imported = new Set(nodes.map((n) => n.metadata?.heritage_id).filter(Boolean))

const pairs = [...new Set(source.map((x) => x.district).filter(Boolean))]
const districts = await translateDistricts(pairs)

// 1) 기존 노드 보강
let updated = 0
for (const [slug, hid] of Object.entries(EXISTING)) {
  const node = nodes.find((n) => n.slug === slug && n.node_type === 'ARTIFACT')
  const x = byId.get(hid)
  if (!node || !x) {
    console.warn(`skip existing ${slug}: ${node ? 'heritage not found' : 'node not found'}`)
    continue
  }
  if (node.metadata?.heritage_id === hid) continue
  const h = heritageMeta(x, districts[x.district])
  // 큐레이션한 영문 location/카테고리 등은 유지, 좌표·지정명·원문만 보강
  const metadata = compact({ ...node.metadata, ...h, location: node.metadata?.location ?? h.location })
  if (!DRY) {
    const { error } = await supabase.from('nodes').update({ metadata }).eq('id', node.id)
    if (error) throw error
  }
  imported.add(hid)
  updated++
}
console.log(`existing updated: ${updated}`)

// 2) 새 노드
const rows = []
const missing = []
for (const x of source) {
  if (imported.has(x.id)) continue
  const t = translations[x.id]
  if (!t) {
    missing.push(x.id)
    continue
  }
  let slug = slugify(t.title_en) || `heritage-${x.id}`
  if (usedSlugs.has(slug)) slug = `${slug}-${x.designation_no}`.replace(/[^a-z0-9-]/g, '-')
  for (let i = 2; usedSlugs.has(slug); i++) slug = `${slug.replace(/-\d+$/, '')}-${i}`
  usedSlugs.add(slug)
  imported.add(x.id)

  rows.push({
    slug,
    node_type: 'ARTIFACT',
    title: t.title_en,
    description: t.description,
    thumbnail: https(x.image_url),
    is_published: true,
    metadata: compact({
      source: 'khs',
      ai_translated: true,
      category: t.category,
      material: t.material,
      created_year: t.created_year,
      created_period: t.created_period,
      ...heritageMeta(x, districts[x.district]),
    }),
  })
}
console.log(`new rows: ${rows.length}, untranslated (skipped): ${missing.length}`)
if (DRY) {
  console.log(JSON.stringify(rows.slice(0, 2), null, 2))
  process.exit(0)
}

for (let i = 0; i < rows.length; i += 200) {
  const { error } = await supabase.from('nodes').insert(rows.slice(i, i + 200))
  if (error) throw error
  process.stdout.write(`\r  inserted ${Math.min(i + 200, rows.length)}/${rows.length}`)
}
process.stdout.write('\n')
