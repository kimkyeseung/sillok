# Sillok (실록) — CLAUDE.md

> 한국 인물 아카이브 + 커뮤니티 플랫폼. 1인 개발.
> 전체 기획 문서: `docs/SPEC.md` 참조.

---

## Commands

```bash
# 개발 서버
npm run dev          # Next.js dev (port 3000)
npm run build        # 프로덕션 빌드
npm run type-check   # tsc --noEmit
npm run lint         # ESLint

# DB 마이그레이션
npm run db:migrate   # Supabase migration 적용
npm run db:generate  # 타입 자동 생성 (supabase gen types)

# 배치 서버 (OCI — 로컬 테스트용)
cd batch && npx ts-node bulk-upload.ts
```

---

## Architecture

```
apps/web/
├── app/
│   ├── (public)/           정적 SSG + ISR 페이지 (인물, 노드, 메인)
│   ├── (auth)/             로그인/회원가입 페이지
│   ├── admin/              어드민 SSR 페이지 (로그인 필수)
│   └── api/                API Routes — 인증/쓰기 전용
│       ├── persons/
│       ├── threads/
│       ├── replies/
│       ├── nodes/
│       ├── relations/
│       ├── search/
│       ├── follows/
│       ├── notifications/
│       ├── upload/
│       └── admin/
├── components/
│   ├── person/
│   ├── thread/
│   ├── relation-graph/
│   ├── search/
│   └── admin/
└── lib/
    ├── supabase-admin.ts   서버 전용 (SUPABASE_SERVICE_ROLE_KEY)
    ├── supabase-server.ts  SSR 서버 컴포넌트 전용
    ├── auth.ts             requireUser / requireAdmin 헬퍼
    ├── api-helpers.ts      apiError / apiSuccess 헬퍼
    └── rate-limit.ts       Rate limit 헬퍼

batch/                      OCI 배치 서버 (무거운 작업 전용)
├── bulk-upload.ts
└── translation-pipeline.ts

packages/types/             공유 타입
db/
└── schema.sql              전체 DB 스키마
```

### 레이어별 역할

| 레이어 | 역할 | Supabase 클라이언트 |
|--------|------|---------------------|
| SSG (generateStaticParams) | 빌드 타임 정적 페이지 생성 | `supabaseAdmin` |
| Server Component | SSR 읽기 요청 | `supabaseServer` |
| API Route (`route.ts`) | 인증/쓰기 요청 처리 | `supabaseAdmin` |
| Client Component | CSR — fetch('/api/...') + SWR | — |

---

## Critical Rules

### 절대 해야 하는 것

- **모든 API Route**는 `requireUser()` 또는 `requireAdmin()`으로 인증 후 처리할 것
- **모든 입력값**은 `zod` 스키마로 검증 후 처리할 것
- **모든 에러 응답**은 `apiError(code, message, status)` 헬퍼를 사용할 것
- **모든 성공 응답**은 `apiSuccess(data)` 헬퍼를 사용할 것
- **모든 목록 API**는 Cursor 기반 페이지네이션 사용 (`limit+1` 조회 → `has_next` 판단)
- **모든 읽기 쿼리**는 `WHERE is_deleted = FALSE` 포함할 것
- **slug**는 항상 영문 (`sejong-daewang` 방식)
- **소셜 로그인**: 카카오, 구글만. 직접 구현 금지 — Supabase Auth 사용

### 절대 하면 안 되는 것

- `SUPABASE_SERVICE_ROLE_KEY`를 클라이언트 컴포넌트에서 접근하거나 `NEXT_PUBLIC_` prefix 붙이는 것 **금지**
- `supabaseAdmin`을 클라이언트 컴포넌트에서 import하는 것 **금지**
- raw SQL 문자열 직접 구성 **금지** — Supabase query builder 또는 parameterized query 사용
- 댓글(replies)에 이미지 첨부 기능 추가 **금지** — 의도적 미포함
- 유저 간 팔로우 기능 추가 **금지** — 인물/노드 팔로우만 허용
- 싫어요/다운보트 기능 추가 **금지** — 역사 토론 감정적 투표 방지
- 영상 직접 업로드 기능 추가 **금지** — YouTube/네이버TV URL 임베드만 허용

---

## API Route 패턴

모든 `app/api/**/route.ts`는 아래 패턴을 따른다.

```typescript
// app/api/threads/route.ts 예시
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const CreateThreadSchema = z.object({
  person_id:  z.string().uuid(),
  title:      z.string().min(1).max(200),
  content:    z.string().min(1).max(10000),
  video_url:  z.string().url().optional(),   // YouTube/네이버TV URL
  image_ids:  z.array(z.string().uuid()).max(3).optional(),
});

export async function POST(request: Request) {
  // 1. 인증
  const user = await requireUser(request);
  if (!user) return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  // 2. 입력 검증
  const body = await request.json();
  const result = CreateThreadSchema.safeParse(body);
  if (!result.success) return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  // 3. 비즈니스 로직 + DB 처리
  const { data, error } = await supabaseAdmin
    .from('threads')
    .insert({ ...result.data, author_id: user.id })
    .select()
    .single();

  if (error) return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  // 4. 성공 응답
  return apiSuccess(data);
}
```

### 어드민 전용 API

```typescript
const admin = await requireAdmin(request);
if (!admin) return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);
```

---

## Database

전체 SQL: `db/schema.sql`

### 테이블 목록 (27개)

| # | 테이블 | 설명 |
|---|--------|------|
| 1 | `persons` | 인물 (핵심) |
| 2 | `tags` | 시대/분야 태그 |
| 3 | `person_tags` | 인물-태그 연결 |
| 4 | `nodes` | 유물/미디어/사건 (ARTIFACT·MEDIA·EVENT) |
| 5 | `person_node_links` | 인물-노드 연결 |
| 6 | `person_relations` | 인물 간 관계 (FAMILY·TEACHER·ALLY·RIVAL·LORD_VASSAL·INFLUENCE) |
| 7 | `threads` | 스레드 (video_url, like_count 포함) |
| 8 | `thread_replies` | 댓글 (depth 자동 계산, 0-based) |
| 9 | `thread_images` | 스레드 이미지 첨부 (스레드당 최대 3장) |
| 10 | `node_comments` | 노드 댓글 |
| 11 | `view_logs` | 조회 로그 (race condition 방지용) |
| 12 | `person_timeline` | 인물 생애 타임라인 |
| 13 | `person_requests` | 인물 추가 요청 |
| 14 | `reports` | 신고 |
| 15 | `collections` | 유저 컬렉션 |
| 16 | `collection_items` | 컬렉션 아이템 |
| 17 | `notifications` | 알림 |
| 18 | `profiles` | 유저 프로필 (role: USER·ADMIN) |
| 19 | `warning_logs` | 경고 이력 |
| 20 | `articles` | 운영진 아티클/공지 |
| 21 | `person_of_day_votes` | 오늘의 인물 투표 |
| 22 | `person_translations` | 인물 번역 (en·ja) |
| 23 | `node_translations` | 노드 번역 |
| 24 | `person_timeline_translations` | 타임라인 번역 |
| 25 | `subscriptions` | Sillok Plus 구독 |
| 26 | `awards` | 어워드 (좋아요 배지 결제) |
| 27 | `likes` | 좋아요 통합 (thread·reply·node_comment) |
| 28 | `follows` | 팔로우 (person·node 대상만) |
| 29 | `curator_roles` | 자원봉사 큐레이터 |

### 주요 관계

```
persons ──< person_tags >── tags
persons ──< person_node_links >── nodes
persons ──< person_relations >── persons   (양방향: FAMILY·ALLY·RIVAL / 단방향: 나머지)
persons ──< threads ──< thread_replies
                   └──< thread_images     (최대 3장)
nodes   ──< node_comments
auth.users ──── profiles
           ──< likes    (target_type: thread·reply·node_comment)
           ──< follows  (target_type: person·node)
```

### 공통 컬럼 규칙

- 모든 테이블: `created_at`, `updated_at` (TIMESTAMPTZ)
- 콘텐츠 삭제: `is_deleted = TRUE` (soft delete) — hard delete는 어드민만
- 좋아요/팔로우/댓글 수: 트리거로 카운터 컬럼(`like_count`, `reply_count` 등) 동기화
- `view_count`: 직접 UPDATE 금지 — `view_logs` 삽입 후 pg_cron 배치 집계

---

## 공통 응답 포맷

```typescript
// 성공
{ success: true, data: T }

// 에러
{ success: false, error: { code: string, message: string, details?: unknown } }

// 에러 코드 목록
// PERSON_NOT_FOUND, NODE_NOT_FOUND, THREAD_NOT_FOUND
// UNAUTHORIZED, FORBIDDEN, ADMIN_REQUIRED
// RATE_LIMIT_EXCEEDED, VALIDATION_ERROR
// DUPLICATE_RELATION, ALREADY_REPORTED
// FILE_TOO_LARGE, UNSUPPORTED_FILE_TYPE
// BULK_UPLOAD_FAILED
```

---

## Rate Limits

```
기본 (전체):     100 req / 1분 / IP
검색:            30 req / 1분 / IP
스레드 작성:     10 req / 1시간 / USER
댓글 작성:       30 req / 1시간 / USER
인물 추가 요청:  5 req / 1시간 / USER
관계 제안:       10 req / 1시간 / USER
신고:            10 req / 1시간 / USER
번역 API:        10 req / 1분 / USER
어드민 API:      제한 없음
```

MVP는 in-memory Map 기반, Milestone 2에서 Upstash Redis로 전환.

---

## 파일 업로드

```
허용 타입:        image/jpeg, image/png, image/webp
최대 크기:        5MB
Storage 경로:
  avatars/  → avatars/{user_id}/{uuid}.webp
  threads/  → threads/{user_id}/{thread_id}/{uuid}.webp  (스레드당 최대 3장)
  persons/  → persons/{person_id}/{uuid}.webp            (어드민만)
플로우:
  1. POST /api/upload/presigned-url → Supabase presigned URL 발급
  2. 클라이언트 → Supabase Storage PUT (서버 미경유)
  3. 완료 후 image_id를 스레드 작성 body에 포함
```

---

## 영상 임베드 규칙

```typescript
// threads.video_url — 허용 도메인만 저장
const ALLOWED_VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'tv.naver.com'];

// 직접 업로드 절대 금지
// YouTube 썸네일: https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg
// Milestone 2에서 인라인 iframe 플레이어 추가 예정 (MVP는 링크 프리뷰만)
```

---

## 인증 / 권한

```typescript
// lib/auth.ts
requireUser(request)   // JWT 검증 → user 반환, 실패 시 null
requireAdmin(request)  // JWT + profiles.role === 'ADMIN' 검증

// middleware.ts
// /admin/* → Supabase SSR 세션 확인 → 비어드민이면 /login redirect
// API Routes → 각 route.ts에서 requireUser/requireAdmin으로 처리

// 권한 레벨
// 비회원: 읽기만
// USER:   읽기 + 스레드/댓글/좋아요/팔로우/신고/컬렉션
// ADMIN:  전체 (인물 CRUD, 어드민 패널, hard delete 등)
```

---

## Slug 규칙

```typescript
// 항상 영문 slug 사용 (한글 URL 금지)
// 형식: 이름 → 국립국어원 로마자 표기 → 소문자 + 하이픈
// 동명이인: kim-cheol-su-1945 (생년 suffix)
// DB UNIQUE 제약으로 중복 방지

// ✅ /인물/sejong-daewang
// ✅ /유물/hunminjeongeum
// ❌ /인물/세종대왕
```

---

## Key Decisions (의도적 결정 — 임의 변경 금지)

| 결정 | 이유 |
|------|------|
| 싫어요/다운보트 없음 | 역사 토론에서 감정적 투표 방지 |
| 유저 간 팔로우 없음 | 인물/노드 팔로우만. SNS화 방지 |
| 댓글 이미지 첨부 없음 | 복잡도 대비 효용 낮음 |
| 영상 직접 업로드 없음 | 스토리지 비용 급증 위험 |
| NestJS 없음 | 1인 개발 생산성 + Vercel 단일 배포 |
| Cursor 페이지네이션 통일 | offset 방식의 데이터 중복/누락 문제 방지 |
| view_count 직접 UPDATE 없음 | race condition 방지 → view_logs + 배치 집계 |
| 댓글 depth DB 저장 | 렌더링 시 재계산 불필요, MIN(depth,3) UI 처리 |
| 관계 양방향 1건 저장 | FAMILY·ALLY·RIVAL은 단방향 저장 후 OR 조건 쿼리 |
| 번역 저장 안 함 (커뮤니티) | 스레드/댓글은 DB 저장 없이 클라이언트 실시간 번역만 |

---

## 환경변수 (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=           # 서버 전용 — 절대 클라이언트 노출 금지

# 소셜 로그인
KAKAO_CLIENT_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# 번역 API (Milestone 2)
OPENAI_API_KEY=                      # GPT-4o mini 커뮤니티 번역

# Rate Limit (Milestone 2)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# OCI 배치 서버
OCI_BATCH_SERVER_URL=                # http://{OCI_IP}:3100
OCI_BATCH_SECRET=

# 결제 (Milestone 1)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TOSS_SECRET_KEY=

# 앱
NEXT_PUBLIC_APP_URL=https://sillok.net
```
