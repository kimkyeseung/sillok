# Sillok (실록) — CLAUDE.md

> 한국 인물 아카이브 + 커뮤니티 플랫폼. 1인 개발. Next.js 14 + Supabase + Vercel.

---

## Commands

```bash
npm run dev          # Next.js dev (port 3000)
npm run build        # 프로덕션 빌드
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run db:migrate   # 로컬 DB 전용 — 원격은 db/migrations/*.sql을 Supabase SQL Editor에서 직접 실행
npm run db:generate  # 타입 자동 생성
```

---

## Architecture

```
app/
├── (public)/        페이지 (대부분 SSR force-dynamic)
│   ├── page.tsx         홈 = Reddit식 커뮤니티 피드
│   ├── b/[board]/       시대별 게시판 (ancient, three-kingdoms, unified-silla, goryeo, joseon, modern)
│   ├── t/[topic]/       토픽 = 스레드 category (discussion, trivia, qna, sources, film-tv)
│   ├── persons/[slug]/  인물 상세 — 탭별 URL (timeline, relations, legacy, related, gallery, threads, sources, stats)
│   └── threads/[id]/    스레드 상세 + 대댓글 트리
├── (auth)/          로그인/회원가입
├── admin/           어드민 (로그인 필수)
└── api/             API Routes (feed, persons, threads, replies, nodes, person-item-comments 등)
components/
├── feed/            홈 피드 (Feed, FeedCard, FeedShell, SortTabs, 중간 삽입 모듈)
├── age-flow/        시대 흐름 시각화 (12 컴포넌트 + useAgeFlow·useGridCap·usePersonDetail 훅)
├── common/          Header, Modal, Toast, PersonAvatar
├── person/ thread/ collection/ ranking/ search/ admin/
lib/
├── supabase-admin.ts   서버 전용 (SERVICE_ROLE_KEY)
├── supabase-server.ts  SSR 서버 컴포넌트 전용
├── auth.ts             requireUser / requireActiveUser(정지 유저 차단) / requireAdmin
├── api-helpers.ts      apiError / apiSuccess
├── feed.ts             피드 순수 로직 (정렬, 커서, 게시판·토픽, 댓글 트리) — 테스트 대상
├── feed-data.ts        피드·홈 모듈 로더 (서버)
├── age-flow.ts         age-flow 순수 로직 (변환, 범위 필터, ?year= 파싱) — 테스트 대상
├── age-flow-data.ts    age-flow 데이터 로더 (서버, unstable_cache 5분) — page SSR·API 공유
├── person-page.ts      인물 페이지 로더 (React cache로 layout/page/metadata 공유)
├── jsonld.ts           구조화 데이터 (Person, DiscussionForumPosting, Breadcrumb 등)
├── types.ts            NodeType, RelationType 등
db/schema.sql           전체 DB 스키마 (40 테이블)
db/migrations/          날짜별 마이그레이션 (schema.sql과 항상 동기화)
```

**Supabase 클라이언트 사용 규칙:**
- SSG/Server Component → `supabaseAdmin` 또는 `supabaseServer`
- API Route (인증/쓰기) → `supabaseAdmin`
- Client Component → `fetch('/api/...')` + SWR (직접 Supabase 접근 금지)

---

## Critical Rules

### 반드시 지킬 것

- API Route: `requireUser()` / `requireActiveUser()`(작성·댓글) / `requireAdmin()`으로 인증
- 입력값: `zod` 스키마 검증
- 응답: `apiError()` / `apiSuccess()` 헬퍼 사용
- 목록 API: Cursor 기반 페이지네이션 (`limit+1` → `has_next`)
- 읽기 쿼리: `WHERE is_deleted = FALSE`
- slug: 항상 영문 소문자+하이픈 (`sejong-daewang`)
- **UI 텍스트는 전부 영어** — 한글 UI 금지
- 소셜 로그인: Google, Discord만 (Supabase Auth)

### 절대 금지

- `SUPABASE_SERVICE_ROLE_KEY` 클라이언트 노출 / `NEXT_PUBLIC_` prefix
- `supabaseAdmin`을 클라이언트 컴포넌트에서 import
- raw SQL 직접 구성 — Supabase query builder 사용
- 댓글 이미지 첨부, 유저 간 팔로우, 싫어요/다운보트, 영상 직접 업로드

---

## DB 핵심 규칙

- 전체 스키마: `db/schema.sql` (40 테이블)
- soft delete: `is_deleted = TRUE` (hard delete는 어드민만)
- 카운터: 트리거 동기화 (`like_count`, `reply_count` 등)
- `view_count`: 직접 UPDATE 금지 → `view_logs` + 배치 집계
- 관계: FAMILY·ALLY·RIVAL은 단방향 저장 후 OR 쿼리
- 파일 업로드: Supabase Storage presigned URL 방식 (image/jpeg, png, webp, 5MB)
- `threads.hot_score`: 트리거(좋아요·댓글 변경) + pg_cron 15분 갱신. 소수점 12자리 반올림 필수 (PostgREST가 float를 15자리로 잘라 커서가 어긋남)
- `threads.updated_at`: 내용 컬럼 수정 시에만 갱신 (점수·카운터 변경은 제외 → sitemap lastmod 보호)
- 새 테이블: RLS 켜고 정책 없음 (service role로만 접근)

---

## Key Decisions (임의 변경 금지)

| 결정 | 이유 |
|------|------|
| 싫어요 없음 | 역사 토론 감정적 투표 방지 |
| 유저 간 팔로우 없음 | 인물/노드 팔로우만. SNS화 방지 |
| 영상 직접 업로드 없음 | 스토리지 비용. YouTube/Vimeo 임베드만 |
| Cursor 페이지네이션 | offset 데이터 중복/누락 방지 |
| view_count 배치 집계 | race condition 방지 |
| 관계 양방향 1건 저장 | OR 쿼리로 양방향 조회 |
| age-flow 카드 뷰포트 캡 | sticky 뷰포트라 넘치는 행은 도달 불가 → 중요도(포커스·왕·전쟁·조회수) 순 정렬 후 화면에 맞는 만큼만, 나머지는 "+N more" 목록 |
| age-flow 전체 메모리 로드 | ~1,000명 OK. 2,000명 이상 시 구간 로드 전환 (SCALABILITY NOTE 참조) |
| PersonAvatar 태그별 스타일 | FIELD 태그별 배경색·아이콘 분기 (`components/common/PersonAvatar.tsx`) |
| 홈 기본 정렬 자동 전환 | 최근 7일 새 스레드 5개 미만이면 Top(전체), 이상이면 Hot. 조용할 때 오래된 글 목록처럼 보이지 않게 |
| 피드 사이 편집 모듈 | 오늘의 역사·투표·트리비아·최근 활동을 게시물 사이에 삽입 (커뮤니티 활동 부족 보완) |
| 대댓글 최대 4단계 | 초과 시 부모의 부모에 붙임. 부모 댓글은 같은 스레드·미삭제인지 서버 검증 |
| 인물 페이지 탭별 URL | 탭마다 색인 가능한 페이지. 항목 수가 `TAB_MIN_ITEMS` 미만인 탭은 숨기고 404 |
| AI 초안 즉시 공개 + 라벨 | `is_ai_generated` 표시로 투명성 확보, 어드민이 사후 검수 |
| 빈 게시판·토픽 noindex | 글 0개면 noindex + sitemap 제외 (thin content 방지) |

---

## Skill 자동 매핑

| 키워드 | 스킬 |
|--------|------|
| 스레드 작성, 스레드 써줘, write thread | `/write-thread` 스킬 사용 |
| 아티클 작성, 아티클 써줘, write article | `/write-article` 스킬 사용 |
