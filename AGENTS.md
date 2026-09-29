# Sillok (실록) — AGENTS.md

> 한국 인물 아카이브 + Reddit식 커뮤니티. 1인 개발. Next.js 14 + Supabase + Vercel.
> 이 파일이 에이전트 공용 원본이다 (CLAUDE.md는 이 파일을 import). 상세 명세는 `Sillok_SPEC.md`.

---

## Commands

```bash
npm run dev          # Next.js dev (port 3000)
npm run build        # 프로덕션 빌드
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm test             # vitest (__tests__/)
npm run db:generate  # 타입 자동 생성
```

**로컬 개발 주의**
- dev 서버는 사용자가 3000번에 항상 띄워 둔다 — 에이전트가 따로 실행하지 않는다.
- 로컬도 **운영 Supabase**를 쓴다. 마이그레이션은 `db/migrations/*.sql`을 사용자가 Supabase SQL Editor에서 실행 → 그 뒤에 의존 코드를 배포/실행. 새 컬럼을 읽는 코드는 마이그레이션 전후 모두 깨지지 않게 (`select('*')` 등).
- DB 조회·일회성 데이터 작업은 `.env.local`의 service role 키로 node/tsx 스크립트 (Supabase MCP는 이 프로젝트에 접근 불가). 일회성 스크립트는 커밋하지 않는다.

**환경 변수** (`.env.local`, Vercel): `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `NEXT_PUBLIC_APP_URL` · `ANTHROPIC_API_KEY`(AI 초안) · `NEXT_PUBLIC_MAPTILER_KEY`(유물 지도, MapTiler에서 origin 제한) · `AI_API_SECRET_KEY`(외부 AI 인물 등록 API) · `OPENAI_API_KEY`(초상화 생성 스크립트)

---

## Architecture

```
app/
├── (public)/            페이지 (대부분 SSR force-dynamic)
│   ├── page.tsx             홈 = Reddit식 피드 (Hot/New/Top + 편집 모듈)
│   ├── b/[board]/           시대별 게시판 (ancient, three-kingdoms, unified-silla, goryeo, joseon, modern)
│   ├── t/[topic]/           토픽 = 스레드 category (discussion, trivia, qna, sources, film-tv)
│   ├── threads/[id]/        스레드 상세 + 대댓글 트리
│   ├── persons/[slug]/      인물 상세 — 탭별 URL (timeline, relations, legacy, related, gallery, threads, sources, stats)
│   ├── age-flow/[year]/     연도 페이지 ("Korea in 1592") — 공유 카드 /api/og/age-flow/[year]
│   └── nodes/               노드 탐색 · 유물 탭 (목록/지도, 필터, 컬렉션) · /nodes/[slug] 상세
├── (auth)/              로그인/회원가입
├── admin/               어드민 (로그인 필수) — memes/ = "AI Drafts"
└── api/                 API Routes (feed, persons, threads, replies, nodes, artifacts, admin/*, og/*)
components/
├── feed/  age-flow/  nodes/(유물 브라우저·지도·갤러리)  meme/(워작 SVG·밈 레이아웃)
├── common/              Header, Modal, Toast, PersonAvatar, ImageLightbox
└── person/ thread/ collection/ ranking/ search/ admin/
lib/                     순수 로직(테스트 대상)과 서버 로더를 파일로 분리
├── supabase-admin.ts    서버 전용 (SERVICE_ROLE_KEY) · supabase-server.ts SSR 전용
├── auth.ts              requireUser / requireActiveUser(정지 유저 차단) / requireAdmin
├── api-helpers.ts       apiError / apiSuccess
├── feed.ts · feed-data.ts            피드 로직 / 로더
├── age-flow.ts · age-flow-data.ts    age-flow 로직 / 로더(unstable_cache 5분, 쓰기 API는 revalidateAgeFlow())
├── artifacts.ts · artifacts-query.ts · heritage.ts · heritage-era.ts   유물 목록·필터 / 국가유산 데이터·연대 파서
├── meme.ts              AI 초안 로직(포맷·스키마·텍스트) — meme-ai(Claude) · meme-data · meme-render · meme-publish(스레드 발행)
├── person-page.ts       인물 페이지 로더 (React cache로 layout/page/metadata 공유)
└── jsonld.ts · seo.ts   구조화 데이터 · 메타 유틸
db/schema.sql            전체 스키마 (43 테이블) — db/migrations/와 항상 동기화
scripts/                 데이터 적재 (heritage: fetch → translate → import → images → enrich → ranks)
```

**Supabase 클라이언트:** Server Component → `supabaseAdmin`/`supabaseServer` · API Route → `supabaseAdmin` · Client Component → `fetch('/api/...')` + SWR (직접 접근 금지)

---

## Critical Rules

**반드시**
- API Route 인증: `requireUser()` / `requireActiveUser()`(작성·댓글) / `requireAdmin()`
- 입력 `zod` 검증 · 응답 `apiError()` / `apiSuccess()` · 목록은 cursor 페이지네이션 (`limit+1` → `has_next`)
- 읽기 쿼리 `is_deleted = FALSE` · slug는 영문 소문자+하이픈 (`sejong-daewang`)
- **UI 텍스트는 전부 영어** (한글은 meta/구조화 데이터·인용 원문에만)
- 소셜 로그인: Google, Discord만

**금지**
- `SUPABASE_SERVICE_ROLE_KEY` 클라이언트 노출 / `NEXT_PUBLIC_` prefix, `supabaseAdmin`을 클라이언트에서 import
- raw SQL 직접 구성 (query builder 사용)
- 댓글 이미지 첨부, 유저 간 팔로우, 싫어요/다운보트, 영상 직접 업로드

---

## DB 규칙

- soft delete `is_deleted = TRUE` (hard delete는 어드민만) · 카운터는 트리거 동기화 (`like_count`, `reply_count`)
- `view_count` 직접 UPDATE 금지 → `view_logs` + 배치 집계
- 관계 FAMILY·ALLY·RIVAL은 단방향 1건 저장 후 OR 쿼리
- 업로드: presigned URL (jpeg/png/webp, 5MB). `memes` 버킷(번역할 원본 짤)은 jpeg/png만 — 렌더러가 webp 불가
- `threads.hot_score`: 트리거 + pg_cron 15분. 소수점 12자리 반올림 필수 (PostgREST float 15자리 → 커서 어긋남)
- `threads.updated_at`: 내용 컬럼 수정 시에만 갱신 (sitemap lastmod 보호)
- `thread_images.alt`: 이미지 설명/이미지 속 텍스트 → img alt · og:image:alt · ImageObject.caption
- 새 테이블: RLS 켜고 정책 없음 (service role 전용)

---

## Key Decisions (임의 변경 금지)

| 결정 | 이유 / 내용 |
|------|------|
| 싫어요·유저 팔로우 없음 | 감정적 투표·SNS화 방지. 팔로우는 인물/노드만 |
| 영상 직접 업로드 없음 | 스토리지 비용. YouTube/Vimeo 임베드만 |
| Cursor 페이지네이션 · view_count 배치 | offset 중복/누락 · race condition 방지 |
| 스레드 = 레딧식 단일 스트림 | 뻘글·사진·밈·장문 모두 같은 스레드. 특정 콘텐츠 유형 전용 카테고리·토픽·섹션·UI 금지 |
| 홈 기본 정렬 자동 전환 | 최근 7일 새 스레드 5개 미만 → Top(전체), 이상 → Hot |
| 피드 사이 편집 모듈 | 오늘의 역사·투표·트리비아·최근 활동 삽입 (활동 부족 보완) |
| 대댓글 최대 4단계 | 초과 시 부모의 부모에 붙임. 부모는 같은 스레드·미삭제인지 서버 검증 |
| 한 장짜리 스레드 이미지 | 원본 비율로 크게 표시, 여러 장이면 썸네일 스트립 |
| 인물 페이지 탭별 URL | 탭마다 색인. 항목 수 `TAB_MIN_ITEMS` 미만 탭은 숨김·404 |
| 인물 편집 콘텐츠 AI 초안 | 즉시 공개 + `is_ai_generated` 라벨, 어드민 사후 검수 |
| AI Drafts (`ai_drafts`) | 워작 밈·번역 짤·짧은 소설을 Claude로 초안 → 어드민 검토 후 게시하면 관리자 명의 **일반 스레드**(`thread_id`)가 됨. 사용자는 테이블을 모름. 밈 PNG는 threads 버킷, 이미지 속 텍스트는 `thread_images.alt` |
| AI Drafts 대상·원칙 | 근대 이전 인물만 (1850년 이후 출생·생존·modern 제외 — 명예훼손 방지). 사실 기반, 본문에 근거(`fact`)와 AI 표기. 번역 짤은 출처·크레딧 필수 |
| age-flow 카드 뷰포트 캡 | sticky 뷰포트 → 중요도(포커스·왕·전쟁·조회수) 순으로 화면에 맞는 만큼, 나머지 "+N more" |
| age-flow 왕·전쟁은 DB | 재위 `reigns`, 전쟁 = EVENT 노드(war/revolt) + `metadata.end_year` + 참여자 링크. 하드코딩 금지 |
| age-flow 색인·로드 | 생존 인물 5명(`YEAR_PAGE_MIN_FIGURES`) 미만 연도 noindex, sitemap은 사건·즉위 연도만. 전체 메모리 로드는 ~2,000명까지 |
| 국가유산 일괄 등록 (`metadata.source = 'khs'`) | 국보·보물 ~2,800건은 AI 번역 초안 → 검수 전까지 큐레이션 목록·age-flow·sitemap 제외 + noindex |
| 유물 이미지 미러링 안 함 | 공공누리 1유형만 썸네일, 1·3유형은 `node_images` 갤러리 (3유형은 크롭 금지) |
| PersonAvatar 태그별 스타일 | FIELD 태그별 배경·아이콘 (`components/common/PersonAvatar.tsx`) |
| 빈 게시판·토픽 noindex | 글 0개면 noindex + sitemap 제외 (thin content 방지) |
