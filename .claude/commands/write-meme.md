# 밈 작성 스킬 (/write-meme)

실록(Sillok)용 한국사 밈·짧은 소설을 **영어로** 만들어 AI Drafts로 등록한다. 게시하면 관리자 명의 **일반 스레드**가 된다 (밈 전용 카테고리·섹션 없음).
형식은 `lib/meme-formats.ts` 도감이 원본이다 — 이 파일에 형식 목록을 복사하지 말 것.

## 입력

`$ARGUMENTS` — 인물, 사건, 원하는 형식 (예: `하멜 구글 리뷰`, `선조 이순신`, `형식 추가` + 캡처 이미지). 비어 있으면 물어본다.
"형식 추가/학습"이면 아래 **형식 추가** 절차로 간다.

## 밈 만들기

1. **형식 확인**: `npx tsx scripts/meme-draft.ts formats` — 각 형식의 구조·웃음 포인트·규칙·필드 제한을 읽는다. 형식을 지정하지 않았으면 소재에 가장 맞는 것을 고른다 (반전 이야기는 `story`).
2. **인물 확인**: slug와 사실을 DB에서 확인한다 (`.env.local` service role 키로 node 조회). 근대 이전·게시된 인물만 (1850년 이후 출생·생존·modern 태그 제외 — 스크립트가 막는다). 필요하면 웹에서 사실을 검증한다.
3. **작성** (영어):
   - 잘 알려진 사실 위에 농담을 얹는다. 사건·숫자·인용을 지어내지 않는다.
   - 학살·전쟁 피해자, 민족·종교·장애, 성적인 소재, 처형된 어린이를 놀리지 않는다.
   - `title`: 자연스러운 커뮤니티 글 제목 (해시태그·이모지 없음). 원하면 "Joseon meme" 같은 말을 자연스럽게 넣어도 된다.
   - `fact`: 무엇이 사실이고 무엇이 창작인지 1~2문장 (스레드 본문이 된다).
4. **spec 작성** (scratchpad에 JSON):
   ```json
   { "kind": "template", "format": "review", "slugs": ["hendrick-hamel"],
     "title": "…", "content": { … }, "fact": "…" }
   ```
   짧은 소설은 `"kind": "story", "content": { "body": "…" }`.
5. **미리보기**: `npx tsx scripts/meme-draft.ts preview spec.json out.png` → 이미지를 Read로 직접 확인 (잘림·겹침·글자 크기). 사용자에게 제목·이미지(또는 본문)·fact를 보여주고 확인받는다.
6. **등록**:
   - 초안만: `npx tsx scripts/meme-draft.ts create spec.json` → `/admin/memes`에서 편집·게시
   - 바로 게시 (사용자가 원할 때만): `create spec.json --post [--at 2026-09-30T20:15:00+09:00]`
   - 여러 개를 올리면 `--at`으로 시간을 나눈다 (과거 시각만).

## 형식 추가 (캡처로 "학습")

사용자가 밈 캡처를 주면 **내용은 가져오지 않고 형식만** 추출한다 (원본 이미지·문구·캐릭터 재사용 금지).

1. 캡처에서 뽑을 것: 레이아웃(칸 구성), 텍스트 자리와 대략 글자 수, 웃음 원리, 지켜야 할 관습 (예: 고정 문구 "Nobody:").
2. 기존 형식으로 표현되면 새로 만들지 말고 그 형식을 쓴다.
3. 새 형식이면:
   - `lib/meme-formats.ts`에 항목 추가: `label`, `description`, `figures`, `faces`, `fields`(text/list/int/rows), `guide`(structure·humor·rules·example — 예시는 실록식으로 새로 작성), `transcript`, 필요하면 `autoFor`
   - `components/meme/MemeCanvas.tsx`의 `renderTemplateMeme`에 레이아웃 추가 (1080×1080, satori: 자식이 여럿인 div는 `display: flex`, ★ 같은 기호는 글꼴에 없으니 SVG, 얼굴은 `Face`)
   - `__tests__/lib/meme-formats.test.ts`의 `SAMPLES`에 예시 추가
   - `npm test` → preview로 렌더링 확인
4. 관리자 형식 목록·편집 폼·AI 프롬프트·이미지 alt는 도감에서 자동으로 따라온다.
