// data/heritage/*.json (국보·보물 원문) → 영문 제목·설명·분류·연도 AI 번역
// 결과는 data/heritage/translations.json 에 id(ccbaCpno) 기준으로 누적 저장 — 중단 후 재실행하면 이어서 진행
// 사용: node --env-file=.env.local scripts/translate-heritage.mjs [--limit N]

import { readFile, writeFile } from 'node:fs/promises'

const MODEL = 'gpt-5.4-mini'
const BATCH = 8
const CONCURRENCY = 3
const DIR = new URL('../data/heritage/', import.meta.url)
const OUT = new URL('translations.json', DIR)

const CATEGORIES = ['architecture', 'sculpture', 'painting', 'craft', 'book', 'calligraphy', 'other']
const PERIODS = [
  'Prehistoric', 'Gojoseon', 'Goguryeo', 'Baekje', 'Silla', 'Gaya', 'Three Kingdoms',
  'Unified Silla', 'Balhae', 'Goryeo', 'Joseon', 'Korean Empire', 'Modern',
]

const SYSTEM = `You translate Korean state-designated heritage records (국보/보물) into English for a Korean history website.
For each item return:
- title_en: the standard English name in the style used by the Korea Heritage Service (e.g. "Sungnyemun Gate, Seoul", "Gilt-bronze Pensive Bodhisattva", "Celadon Prunus Vase with Inlaid Crane and Cloud Design"). Romanize proper nouns with Revised Romanization. Keep numbering like "(1962-1)" or volume numbers when they distinguish items.
- description: 2-3 factual English sentences summarizing the Korean description. No hype, no claims beyond the source.
- category: one of ${CATEGORIES.join(', ')} (architecture = buildings, pagodas, stupas, steles, bridges, fortresses; sculpture = Buddha statues, stone/metal figures; painting = paintings, portraits, maps; craft = ceramics, metalwork, bells, lacquer, textiles, jewelry; book = printed/handwritten books, documents, woodblocks; calligraphy = calligraphy works, rubbings).
- material: short English material, e.g. "Granite", "Gilt bronze", "Ink and color on silk", "Paper". null if unknown.
- created_year: best single-year estimate (integer, negative for BCE) based on the era text and description; mid-point of a range if only a century/reign is known; null if impossible to estimate.
- created_period: one of ${PERIODS.join(', ')}; null if unknown.
Return every input id exactly once.`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title_en', 'description', 'category', 'material', 'created_year', 'created_period'],
        properties: {
          id: { type: 'string' },
          title_en: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', enum: CATEGORIES },
          material: { type: ['string', 'null'] },
          created_year: { type: ['integer', 'null'] },
          created_period: { type: ['string', 'null'], enum: [...PERIODS, null] },
        },
      },
    },
  },
}

async function translate(batch, tries = 4) {
  const input = batch.map((x) => ({
    id: x.id,
    kind: x.kind,
    name: x.name,
    name_hanja: x.name_hanja,
    category_ko: x.category.join(' > '),
    era: x.era,
    quantity: x.quantity,
    content: (x.content ?? '').slice(0, 1500),
  }))
  for (let i = 1; ; i++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          reasoning_effort: 'low',
          response_format: { type: 'json_schema', json_schema: { name: 'heritage', strict: true, schema: SCHEMA } },
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: JSON.stringify(input) },
          ],
        }),
        signal: AbortSignal.timeout(180_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
      const json = await res.json()
      const out = JSON.parse(json.choices[0].message.content).items
      const ids = new Set(batch.map((x) => x.id))
      const valid = out.filter((o) => ids.has(o.id))
      if (valid.length !== batch.length) throw new Error(`got ${valid.length}/${batch.length} items`)
      return valid
    } catch (e) {
      if (i >= tries) throw e
      await new Promise((r) => setTimeout(r, 2000 * i))
    }
  }
}

const limitArg = process.argv.indexOf('--limit')
const limit = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity

const source = [
  ...JSON.parse(await readFile(new URL('national-treasures.json', DIR))).items,
  ...JSON.parse(await readFile(new URL('treasures.json', DIR))).items,
]
let done = {}
try {
  done = JSON.parse(await readFile(OUT))
} catch {}

const todo = source.filter((x) => !done[x.id] && x.name).slice(0, limit)
const batches = []
for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH))
console.log(`${Object.keys(done).length} cached, ${todo.length} to translate in ${batches.length} batches`)

let next = 0
let finished = 0
const failed = []
let saving = Promise.resolve()
const save = () => (saving = saving.then(() => writeFile(OUT, JSON.stringify(done, null, 2) + '\n')))

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < batches.length) {
      const batch = batches[next++]
      try {
        for (const o of await translate(batch)) {
          const { id, ...rest } = o
          done[id] = rest
        }
        if (++finished % 10 === 0) await save()
      } catch (e) {
        failed.push(`${batch[0].id}…: ${e.message}`)
      }
      process.stdout.write(`\r  batches ${finished}/${batches.length} (failed ${failed.length})`)
    }
  }),
)
await save()
process.stdout.write('\n')
console.log(`saved ${Object.keys(done).length} translations`)
if (failed.length) console.warn(failed.join('\n'))
