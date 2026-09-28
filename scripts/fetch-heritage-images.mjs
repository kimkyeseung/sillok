// 국가유산청 이미지 API → data/heritage/images.json  ({ [ccbaCpno]: [{ url, caption_ko, license }] })
// license: 공공누리 유형 — kogl-1(A) kogl-2(B) kogl-3(C) kogl-4(D) kogl-0(E). 'A/F'처럼 AI 유형이 붙으면 앞 글자 기준
// 중단 후 재실행하면 이어서 진행. 사용: node scripts/fetch-heritage-images.mjs

import { readFile, writeFile } from 'node:fs/promises'

const BASE = 'https://www.khs.go.kr/cha'
const CONCURRENCY = 4
const DIR = new URL('../data/heritage/', import.meta.url)
const OUT = new URL('images.json', DIR)
const LICENSE = { A: 'kogl-1', B: 'kogl-2', C: 'kogl-3', D: 'kogl-4', E: 'kogl-0' }

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

const text = (v) => v?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || null

// 항목마다 <item> 하나에 sn/imageNuri/imageUrl/ccimDesc 가 반복되는 구조
function parseImages(xml) {
  const out = []
  const re = /<imageNuri>([\s\S]*?)<\/imageNuri>\s*<imageUrl>([\s\S]*?)<\/imageUrl>\s*<ccimDesc>([\s\S]*?)<\/ccimDesc>/g
  for (const m of xml.matchAll(re)) {
    const url = text(m[2])
    if (!url) continue
    out.push({
      url: url.replace(/^http:\/\//, 'https://'),
      caption_ko: text(m[3]),
      license: LICENSE[text(m[1])?.charAt(0)] ?? null,
    })
  }
  return out
}

const source = [
  ...JSON.parse(await readFile(new URL('national-treasures.json', DIR))).items,
  ...JSON.parse(await readFile(new URL('treasures.json', DIR))).items,
]
let done = {}
try {
  done = JSON.parse(await readFile(OUT))
} catch {}

const todo = source.filter((x) => !(x.id in done))
console.log(`${Object.keys(done).length} cached, ${todo.length} to fetch`)

let next = 0
let finished = 0
const failed = []
let saving = Promise.resolve()
const save = () => (saving = saving.then(() => writeFile(OUT, JSON.stringify(done) + '\n')))

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < todo.length) {
      const x = todo[next++]
      const { ccbaKdcd, ccbaAsno, ccbaCtcd } = x.api
      try {
        const xml = await fetchXml(
          `${BASE}/SearchImageOpenapi.do?ccbaKdcd=${ccbaKdcd}&ccbaAsno=${ccbaAsno}&ccbaCtcd=${ccbaCtcd}`,
        )
        done[x.id] = parseImages(xml)
      } catch (e) {
        failed.push(e.message)
      }
      if (++finished % 100 === 0) await save()
      process.stdout.write(`\r  ${finished}/${todo.length} (failed ${failed.length})`)
    }
  }),
)
await save()
process.stdout.write('\n')
const counts = Object.values(done).flat().reduce((c, i) => ((c[i.license] = (c[i.license] ?? 0) + 1), c), {})
console.log(`saved images for ${Object.keys(done).length} items`, counts)
if (failed.length) console.warn(failed.join('\n'))
