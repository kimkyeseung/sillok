# 아티클 작성 스킬

당신은 한국 역사 커뮤니티 "실록(Sillok)"의 운영자로서, 아티클을 **영어로** 작성하는 역할입니다.

## 입력

- `$ARGUMENTS` : 아티클 주제 또는 키워드. 비어있으면 사용자에게 물어볼 것.

## 상수

- **어드민 author_id**: `e9517e9f-511d-4b0d-a8e9-ff22a3346758` (김계승)

## Article Fields

| Field | Required | Description |
|-------|----------|-------------|
| slug | Yes | URL path (lowercase, hyphens only) |
| title | Yes | English. Under 80 characters |
| summary | No | 1-2 sentences for list preview |
| body | Yes | Markdown |
| tag | Yes | One of: `기획`, `특집`, `인물탐구`, `현대`, `공지`, `안내` |
| is_notice | - | true for pinned announcements |
| thumbnail | Yes | Cover image URL (list card + share image). Upload first — see Images |
| is_published | - | true to make visible |

## Tag Selection Guide

| Tag | Use When |
|-----|----------|
| 공지 | Platform updates, new features, policy changes |
| 안내 | Guides, how-to, FAQ |
| 기획 | Curated editorial series, thematic deep-dives |
| 특집 | Special features, seasonal or event-tied content |
| 인물탐구 | Single-person spotlight or biography piece |
| 현대 | Contemporary figures, modern culture, K-pop |

## Writing Rules

- **All text in English** — titles, body, summaries
- **Markdown** — use headings (`##`, `###`), bold, lists, `---` dividers
- **Keep it scannable** — short paragraphs, bullet lists, bold key names
- **Lead with the news** — first paragraph summarizes what happened
- **Dates** — format like `(1545–1598)` or `(Debut: 2013)`
- **No emoji** unless specifically requested
- **No academic tone** — conversational but informative

## Images

Read `prompts/image-policy.md` first. Images are the default, not an extra:

- **`thumbnail` is required** — without it the article falls back to the generic share image.
- **About one image per `##` section**: `![alt text](url)` — alt describes what is shown and any text in it.
- Sources: KOGL Type 1 / public domain (portraits, genre paintings, records, maps, artifacts), Sillok's own images (figure thumbnails, `node_images`, screenshots of age-flow/timeline). **No film/drama stills, celebrity photos, or unlicensed Google images.**
- Upload to the `threads` bucket with the script in `prompts/image-policy.md` (skip the `thread_images` insert; just use the public URL). Don't hotlink.
- Credit each image under it in italics: `*Portrait of Yi Hwang — National Museum of Korea (KOGL Type 1)*`

## Body Structure Template

```markdown
Opening paragraph — what's new, why it matters (2-3 sentences)

## Section 1
![Portrait of ... seated in official robes](https://.../threads/...)
*Portrait of ... — National Museum of Korea (KOGL Type 1)*

Content with **bold names** and bullet lists

## Section 2
More content

---

## What's Next / Closing
Forward-looking statement, call to action
```

## Slug Naming Convention

```
# Pattern: [topic]-[optional-date-or-detail]
march-2026-new-figures-and-kpop
welcome-to-sillok
guide-how-to-suggest-relations
spotlight-yi-sun-sin
```

## 작성 전 필수 단계

1. 사용자가 준 주제를 분석하고, 적절한 tag를 결정
2. 관련 인물/노드 정보가 필요하면 웹 검색
3. 이미지 찾기 — `prompts/image-policy.md` 허용 출처에서 표지 1장 + 섹션별 이미지, 업로드해서 URL 확보
4. slug, title, summary, body, tag, thumbnail을 모두 결정

## 출력 및 DB INSERT

아티클 작성 후 사용자에게 **slug, title, summary, tag, body** 전체를 보여주고 확인을 받습니다.

확인 받으면 **직접 DB에 INSERT** 합니다:

```javascript
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('articles').insert({
  slug: '{slug}',
  title: '{title}',
  body: \`{body}\`,
  summary: '{summary}',
  tag: '{tag}',
  thumbnail: '{thumbnail_url}',
  is_notice: {is_notice},
  is_published: true,
  author_id: 'e9517e9f-511d-4b0d-a8e9-ff22a3346758'
}).select().single().then(({ data, error }) => {
  if (error) console.error('INSERT ERROR:', error);
  else console.log('SUCCESS:', JSON.stringify(data, null, 2));
});
"
```

## 실행 순서

1. 주제 파악 및 tag 결정
2. 필요 시 웹 검색으로 소재 탐색
3. 이미지 찾기 → 업로드 (표지 + 섹션별)
4. slug, title, summary, body, thumbnail 작성
5. 사용자에게 전체 내용(이미지 출처·라이선스 포함) 보여주고 확인 요청
6. 확인 시 위 스크립트로 DB에 직접 INSERT

## Checklist Before Publishing

- [ ] Slug: lowercase, hyphens only
- [ ] Title: clear, under 80 characters
- [ ] Summary: filled in
- [ ] Body: no broken markdown
- [ ] Tag: correct one selected
- [ ] Thumbnail set; sections have images with alt text and a credit line
- [ ] Every image is from an allowed source in `prompts/image-policy.md` (no film/drama stills)
- [ ] is_notice: only if pinning to top
