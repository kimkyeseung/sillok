// 국가유산청 오픈 API로 국보·보물 목록 + 상세를 받아 data/heritage/*.json 으로 저장
// 사용: node scripts/fetch-heritage.mjs [11|12 ...]   (기본: 11 국보, 12 보물)
// API 안내: https://www.khs.go.kr/html/HtmlPage.do?pg=/publicinfo/pbinfo3_0202.jsp&mn=NS_04_04_03

import { mkdir, writeFile } from 'node:fs/promises'

const BASE = 'https://www.khs.go.kr/cha'
const KINDS = {
  11: { name: '국보', file: 'national-treasures.json' },
  12: { name: '보물', file: 'treasures.json' },
}
const PAGE_UNIT = 100
const CONCURRENCY = 4
const OUT_DIR = new URL('../data/heritage/', import.meta.url)

async function fetchXml(url, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (e) {
      if (i >= tries) throw new Error(`${url}: ${e.message}`)
      await new Promise((r) => setTimeout(r, 1000 * i))
    }
  }
}

// 응답 XML이 단순해서 태그 단위 정규식 파싱으로 충분
function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))
  if (!m) return null
  const v = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
  return v === '' ? null : v
}
const items = (xml) => [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1])
const num = (v) => (v == null || v === '' || Number(v) === 0 ? null : Number(v))

// ccbaAsno "0000030000000" → 지정번호 3 (앞 6자리), 뒤 자리는 부번호
function designationNo(asno) {
  const main = parseInt(asno.slice(0, 6), 10)
  const sub = parseInt(asno.slice(6, 8), 10)
  return sub ? `${main}-${sub}` : String(main)
}

async function fetchList(kdcd) {
  const all = []
  for (let page = 1; ; page++) {
    const xml = await fetchXml(
      `${BASE}/SearchKindOpenapiList.do?pageUnit=${PAGE_UNIT}&pageIndex=${page}&ccbaCncl=N&ccbaKdcd=${kdcd}`,
    )
    const total = Number(tag(xml, 'totalCnt'))
    const rows = items(xml)
    all.push(...rows)
    process.stdout.write(`\r  list ${all.length}/${total}`)
    if (rows.length === 0 || all.length >= total) break
  }
  process.stdout.write('\n')
  return all.map((x) => ({
    kdcd: tag(x, 'ccbaKdcd'),
    asno: tag(x, 'ccbaAsno'),
    ctcd: tag(x, 'ccbaCtcd'),
    cpno: tag(x, 'ccbaCpno'),
    name: tag(x, 'ccbaMnm1'),
    name_hanja: tag(x, 'ccbaMnm2'),
    admin: tag(x, 'ccbaAdmin'),
    longitude: num(tag(x, 'longitude')),
    latitude: num(tag(x, 'latitude')),
  }))
}

async function fetchDetail(row) {
  const xml = await fetchXml(
    `${BASE}/SearchKindOpenapiDt.do?ccbaKdcd=${row.kdcd}&ccbaAsno=${row.asno}&ccbaCtcd=${row.ctcd}`,
  )
  const it = items(xml)[0] ?? ''
  const asdt = tag(it, 'ccbaAsdt')
  return {
    id: row.cpno,
    kind: tag(it, 'ccmaName'),
    designation_no: designationNo(row.asno),
    name: row.name,
    name_hanja: row.name_hanja,
    category: [tag(it, 'gcodeName'), tag(it, 'bcodeName'), tag(it, 'mcodeName'), tag(it, 'scodeName')].filter(Boolean),
    quantity: tag(it, 'ccbaQuan'),
    designated_date: asdt && /^\d{8}$/.test(asdt) ? `${asdt.slice(0, 4)}-${asdt.slice(4, 6)}-${asdt.slice(6)}` : asdt,
    era: tag(it, 'ccceName'),
    region: tag(it, 'ccbaCtcdNm'),
    district: tag(it, 'ccsiName'),
    address: tag(it, 'ccbaLcad'),
    owner: tag(it, 'ccbaPoss'),
    admin: tag(it, 'ccbaAdmin') ?? row.admin,
    latitude: row.latitude,
    longitude: row.longitude,
    image_url: tag(it, 'imageUrl'),
    content: tag(it, 'content'),
    api: { ccbaKdcd: row.kdcd, ccbaAsno: row.asno, ccbaCtcd: row.ctcd },
  }
}

async function mapPool(list, n, fn) {
  const out = new Array(list.length)
  let next = 0
  let done = 0
  const failed = []
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < list.length) {
        const i = next++
        try {
          out[i] = await fn(list[i])
        } catch (e) {
          failed.push(e.message)
        }
        process.stdout.write(`\r  detail ${++done}/${list.length}`)
      }
    }),
  )
  process.stdout.write('\n')
  return { out: out.filter(Boolean), failed }
}

const kinds = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(KINDS)
await mkdir(OUT_DIR, { recursive: true })

for (const kdcd of kinds) {
  const kind = KINDS[kdcd]
  if (!kind) throw new Error(`unknown ccbaKdcd: ${kdcd}`)
  console.log(`${kind.name} (${kdcd})`)
  const list = await fetchList(kdcd)
  const { out, failed } = await mapPool(list, CONCURRENCY, fetchDetail)
  const data = {
    source: 'https://www.khs.go.kr (국가유산청 국가유산 공공데이터 오픈 API)',
    fetched_at: new Date().toISOString(),
    kind: kind.name,
    count: out.length,
    items: out,
  }
  await writeFile(new URL(kind.file, OUT_DIR), JSON.stringify(data, null, 2) + '\n')
  console.log(`  saved ${out.length} → data/heritage/${kind.file}`)
  if (failed.length) console.warn(`  ${failed.length} failed:\n   ${failed.join('\n   ')}`)
}
