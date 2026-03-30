# Sillok — 한국 인물 아카이브 플랫폼 SPEC

> **버전:** 2.1 (URL 영문화, 태그/에러메시지 영문화, 글로벌 피벗 반영, 마일스톤 재조정)
> **작성 목적:** Claude Code 기반 자동 개발을 위한 전체 명세서
> **기술 스택:** Next.js (API Routes 포함) + Supabase + OCI (배치)

### v2.0 → v2.1 변경 사항
- **URL 경로 영문화**: /인물/ → /person/, /유물/ → /artifact/, /미디어/ → /media/, /사건/ → /event/, /검색 → /search, /컬렉션 → /collection, /아티클 → /article
- **태그 값 영문화**: ERA·FIELD 태그 한국어 → 영문 slug
- **articles.tag 영문화**: 기획→editorial, 특집→special 등
- **에러 메시지 영문화**: API 응답 메시지 전체 영문 전환
- **관계도 레이블 영문화**: 가족/혈연 → Family 등
- **논란 인물 배너 영문화**
- **메인 히어로 카피 영문화**
- **person_requests에 name_en 필드 추가** (글로벌 유저 요청 대응)
- **소셜 로그인**: 카카오 제거, Google/Apple/Discord/Twitter(X) + 이메일
- **video_url 허용 도메인**: 네이버TV → Vimeo 교체
- **마일스톤 재조정**: M1 배포 완료 반영, 글로벌 피벗 기준 수익/목표 재설정

### v1.9 → v2.0 변경 사항
- **영문화 전환**
  - `person_translations`, `person_timeline_translations` 테이블 삭제
  - `persons.summary`, `persons.birth_place`, `person_timeline.title/description` 직접 영문 저장
  - Public 페이지/API에서 `name_ko` → `name_en` 표시로 전환
  - 검색은 `name_en` + `name_ko` 동시 지원
  - i18n 전략 변경: locale 라우팅 제거, 영문 단일 사이트로 운영
  - SEO 구현: robots.txt, sitemap.xml, JSON-LD, OG/Twitter 메타태그

### v1.8 → v1.9 변경 사항
- **기술 스택 전면 변경**
  - NestJS 별도 서버 제거 → Next.js App Router API Routes로 통합
  - Railway 제거 → Vercel 단일 배포 (FE + API)
  - OCI (Oracle Cloud) Always Free 인스턴스 추가 — 배치 전용 서버
  - 인프라 월 비용: ~$5 → $0
- 폴더 구조 재편: apps/api/ 제거, web/app/api/ 추가
- 3-3 에러 포맷, 3-4 API 전략, 3-5 Rate Limit 재작성
- 섹션 9 권한 체계 재작성 (NestJS Guard → Next.js middleware + Supabase RLS)
- 업로드 플로우 단순화 (NestJS 경유 제거)
- 환경변수 재정리

### v1.7 → v1.8 변경 사항
- **좋아요 시스템** (MVP) — 스레드/댓글/노드댓글 통합 likes 테이블 (4-25)
  - threads, replies, node_comments에 like_count 컬럼 추가
  - API: POST /threads/:id/like, POST /replies/:id/like, POST /comments/:id/like
  - 알림: THREAD_LIKED 타입 추가 (10개 단위 알림)
- **팔로우 시스템** (MVP) — 인물/노드 팔로우 통합 follows 테이블 (4-26)
  - persons, nodes에 follow_count 컬럼 추가
  - API: POST /follows, GET /follows/me, GET /follows/me/feed
  - 알림: FOLLOW_UPDATE 타입 추가
  - 메인 피드 탭에 [팔로우] 탭 추가 (로그인 유저 전용)
  - 유저 간 팔로우는 의도적으로 미포함

### v1.6 → v1.7 변경 사항
- **서비스명 변경**: Satgat → **Sillok** (실록)
  - 유래: 實錄 — 역사의 공식 기록, 조선왕조실록에서 착안
  - 영어권 발음: SIL-lok (직관적)
  - 도메인: sillok.net 확보 완료, sillok.kr 추가 확보 권장
  - 폴더 구조: satgat/ → sillok/
  - 어드민 이메일: admin@sillok.net 권장

### v1.5 → v1.6 변경 사항
- **섹션 15. 비즈니스 모델** 신규 추가
  - MVP 즉시 적용: Sillok Plus 구독, 어워드 시스템, 자원봉사 큐레이터 제도
  - 장기 수익원: AI 데이터 라이선싱, 공개 API, 기관 스폰서십, 교육 B2B
  - 관련 DB 테이블: `subscriptions`, `awards`, `curator_roles` 추가
  - 관련 API 엔드포인트 추가
- **섹션 13. 개발 단계** → **마일스톤 로드맵**으로 전면 재작성
  - Phase 체크리스트 → 4개 Milestone + 목표 지표 + 타임라인으로 재구성
  - 각 마일스톤에 수익 목표, KPI, 핵심 개발 항목 명시
- Phase 1 체크리스트에 MVP 비즈니스 모델 항목 추가

### v1.4 → v1.5 변경 사항
- **서비스명 변경**: K-Human → **Sillok** (실록)
  - 로마자 표기: Sillok
  - 유래: 조선 방랑 시인 김삿갓(金笠) — 전국을 떠돌며 모든 신분의 사람을 만나고 기록한 인물
  - 영어권 발음: SAT-gat (직관적)
  - 도메인: sillok.net 확보 완료, sillok.kr 추가 확보 권장
  - 유래: 實錄 — 조선왕조실록(朝鮮王朝實錄), 역사의 공식 기록
  - 영어권 발음: SIL-lok (직관적)
- 메인 페이지 레이아웃 전면 재설계 (7-7)
  - 히어로 배너 → 슬림 스트립으로 압축 (타이틀 + 통계 배지 한 줄)
  - 스레드 피드를 페이지 최상단·최대 너비로 배치 (좌측 80% 점유)
  - 오늘의 인물·핫한 인물 랭킹을 좌측 메인에서 **우측 사이드바로 이동**
  - 광고 ② 위치 변경: 랭킹 하단 → 피드 5번째 카드 인라인
  - 사이드바 위젯 순서 확정 (아래 참조)
  - 하단 통계 바 → 사이드바 하단 콤팩트 위젯으로 이동
- 광고 슬롯 표 업데이트 (7-8)

### v1.3 → v1.4 변경 사항
- i18n 전략 확정 (3-7 신규): Reddit 방식 → v2.0에서 영문 직접 저장 방식으로 변경
- `node_translations` 테이블 추가 (person_translations, person_timeline_translations는 v2.0에서 삭제)
- 커뮤니티(스레드/댓글) 번역: DB 저장 없이 클라이언트 실시간 번역 버튼만 제공
- 메인 페이지 `최근 스레드` → **전체 스레드 무한스크롤 피드**로 교체
- `/threads/feed` API 추가 (cursor 기반 무한스크롤, 언어 필터)
- 메인 페이지 레이아웃 다이어그램 업데이트 (7-7)
- Phase 2에 국제화 항목 추가
- 환경 변수에 번역 API 키 추가

### v1.2 → v1.3 변경 사항
- 메인 페이지 광고 슬롯 3곳 확정
- 인물 상세 페이지 광고 슬롯 3곳 확정
- 광고 배치 원칙 및 AdSense 통합 가이드 추가 (7-8)
- Phase 2 광고 항목 구체화

### v1.1 → v1.2 변경 사항
- 메인 페이지 레이아웃 전체 명세 추가 (7-7)
- 인물 상세 페이지 레이아웃 수정 — 스레드를 타임라인/관계도보다 위로
- 오늘의 인물 선정 방식 확정 — 생일/기일 자동 + 운영진 선정 + 유저 추천 투표 병행
- 핫한 인물 랭킹 확정 — 일간/주간/월간 탭, 스레드+댓글 수 기준
- `articles` 테이블 추가 (운영진 아티클)
- 메인 페이지 관련 API 추가 (`/home`, `/ranking`, `/articles`)
- 공개 페이지 라우트에 `/아티클/[slug]` 추가

### v1.0 → v1.1 변경 사항
- 양방향 관계 처리 규칙 확정
- `birth_date` → `birth_year` / `birth_date` 분리
- Cursor 기반 페이지네이션으로 통일
- 공통 에러 응답 포맷 정의
- Next.js → API 호출 전략 명확화
- `view_count` race condition 해결 (view_logs 테이블)
- `soft delete` 정책 통일
- FK 인덱스 명시
- `notifications` 테이블 추가
- `warning_logs` 테이블 추가
- 한글 slug 인코딩 전략 확정
- Rate limiting 규칙 추가
- 파일 업로드 제한 규칙 추가
- 이미지 업로드 Presigned URL 방식 명시
- Admin 권한 체크 레벨 명시
- CSV 벌크 업로드 실패 처리 방식 명시
- `GET /relations` 페이지네이션 추가
- 정지 해제 자동화(cron) 명시
- 공개 컬렉션 조회 API 추가

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택 및 폴더 구조](#2-기술-스택-및-폴더-구조)
3. [공통 규칙](#3-공통-규칙)
4. [데이터베이스 스키마](#4-데이터베이스-스키마)
5. [API 명세](#5-api-명세)
6. [페이지 및 라우트 구조](#6-페이지-및-라우트-구조)
7. [핵심 기능 상세 명세](#7-핵심-기능-상세-명세)
8. [어드민 페이지](#8-어드민-페이지)
9. [인증 및 권한](#9-인증-및-권한)
10. [검색 및 필터](#10-검색-및-필터)
11. [보안](#11-보안)
12. [SEO 전략](#12-seo-전략)
13. [마일스톤 로드맵](#13-마일스톤-로드맵)
14. [환경 변수](#14-환경-변수)
15. [비즈니스 모델](#15-비즈니스-모델)

---

## 1. 프로젝트 개요

### 서비스 컨셉
BoardGameGeek(BGG)의 구조를 벤치마크하여, **한국의 이름있는 인물**을 하나의 노드로 삼고 유물·K-콘텐츠·사건이 연결되는 그래프형 인물 아카이브 플랫폼.

- 단군 시대부터 현재 대한민국의 살아있는 인물까지 수록
- 논란 있는 인물(친일파, 독재자 등)도 포함하되 **기본 정보만 제공**
- 운영진이 기본 뼈대를 관리하고, 유저가 커뮤니티 콘텐츠를 쌓는 구조

### 노드 타입 (4종)

| 타입 | 설명 | 인터랙션 |
|------|------|----------|
| `PERSON` | 인물 (핵심 노드) | 스레드 (Reddit식) |
| `ARTIFACT` | 유물/문화재 | 댓글만 (독립) |
| `MEDIA` | K-영화/드라마/도서 | 댓글만 (독립) |
| `EVENT` | 역사적 사건/업적 | 댓글만 (독립) |

---

## 2. 기술 스택 및 폴더 구조

### 스택

```
Frontend   Next.js 14 (App Router) + Tailwind CSS
API        Next.js API Routes (app/api/**/route.ts)
DB         Supabase (PostgreSQL + Auth + Storage + pg_cron)
검색       PostgreSQL pg_trgm 확장
관계도     D3.js (미니) + vis-network (전체 탐색)
배포       Vercel (FE + API 통합) — $0
배치 서버  Oracle Cloud (OCI) Always Free — ARM 4 OCPU / 24GB RAM — $0
```

### 인프라 구성

```
┌──────────────────────────────────────────────────────┐
│                      Vercel                          │
│  Next.js App Router                                  │
│  ├── app/(public)/         정적 SSG + ISR 페이지      │
│  ├── app/api/**            API Routes (런타임 핸들러) │
│  └── app/admin/            어드민 SSR 페이지          │
└────────────────────────┬─────────────────────────────┘
                         │ Supabase JS SDK
┌────────────────────────▼─────────────────────────────┐
│                    Supabase                          │
│  PostgreSQL  Auth  Storage  pg_cron  Realtime        │
└──────────────────────────────────────────────────────┘
                         ▲
┌────────────────────────┴─────────────────────────────┐
│              OCI Always Free (배치 전용)              │
│  - CSV 벌크 업로드 처리 (Vercel 타임아웃 우회)          │
│  - 무거운 배치 작업 (AI 번역 파이프라인 등)             │
│  - ARM 4 OCPU / 24GB RAM / 200GB 스토리지             │
└──────────────────────────────────────────────────────┘
```

### 모노레포 폴더 구조

```
sillok/
├── apps/
│   └── web/                        # Next.js (FE + API 통합)
│       ├── app/
│       │   ├── (public)/
│       │   │   ├── page.tsx        # 메인 홈
│       │   │   ├── person/
│       │   │   │   ├── page.tsx    # person list
│       │   │   │   └── [slug]/
│       │   │   │       └── page.tsx # 인물 상세 (SSG)
│       │   │   ├── artifact/[slug]/page.tsx
│       │   │   ├── media/[slug]/page.tsx
│       │   │   ├── event/[slug]/page.tsx
│       │   │   ├── search/page.tsx
│       │   │   └── relations/page.tsx
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── signup/page.tsx
│       │   ├── admin/
│       │   │   ├── page.tsx
│       │   │   ├── persons/page.tsx
│       │   │   ├── nodes/page.tsx
│       │   │   ├── requests/page.tsx
│       │   │   ├── relations/page.tsx
│       │   │   ├── reports/page.tsx
│       │   │   ├── members/page.tsx
│       │   │   └── tags/page.tsx
│       │   └── api/                # API Routes (Next.js)
│       │       ├── persons/
│       │       │   └── route.ts
│       │       ├── persons/[slug]/
│       │       │   └── route.ts
│       │       ├── threads/
│       │       ├── replies/
│       │       ├── nodes/
│       │       ├── relations/
│       │       ├── search/
│       │       ├── follows/
│       │       ├── notifications/
│       │       ├── upload/
│       │       └── admin/
│       ├── components/
│       │   ├── person/
│       │   ├── thread/
│       │   ├── relation-graph/
│       │   ├── search/
│       │   └── admin/
│       └── lib/
│           ├── supabase-admin.ts   # 서버 전용 클라이언트
│           ├── auth.ts             # 인증 헬퍼
│           ├── middleware-utils.ts # 권한 체크 유틸
│           └── rate-limit.ts      # Rate limit 헬퍼
├── packages/
│   └── types/                      # 공유 타입
└── batch/                          # OCI 배치 서버 (Node.js 스크립트)
    ├── bulk-upload.ts              # CSV 벌크 업로드 처리
    ├── translation-pipeline.ts    # AI 번역 파이프라인
    └── scripts/                   # 기타 무거운 배치 작업
```

---

## 3. 공통 규칙

### 3-1. Slug 전략 (한글 URL 인코딩)

**확정 정책: 영문 slug 사용 (한글 URL 사용 안 함)**

```typescript
// 이유: 한글 slug는 공유 링크에서 %EC%84%B8%EC%A2%85... 로 인코딩되어 가독성 저하
// SEO는 영문 slug + 한국어 메타데이터로 충분히 커버 가능

// 예시
// ✅ /person/sejong-daewang
// ✅ /artifact/hunminjeongeum
// ✅ /media/myeongryang-2014
// ❌ /인물/세종대왕  (한글 경로 사용 금지)

// slug 생성 규칙
// 1. 이름 한글 → 로마자 변환 (romanization: 국립국어원 표준)
// 2. 소문자 + 하이픈 구분
// 3. 동명이인: 뒤에 생년 추가 (ex: kim-cheol-su-1945)
// 4. DB unique 제약으로 중복 방지

// Next.js에서 한글 경로명 유지 (라우팅 폴더명은 한글 유지)
// but slug 파라미터는 항상 영문
```

### 3-2. Cursor 기반 페이지네이션

**확정 정책: 모든 목록 API는 Cursor 방식 사용**

```typescript
// 요청
interface CursorPaginationQuery {
  limit: number;    // 기본값 20, 최대 100
  cursor?: string;  // 마지막 아이템의 created_at ISO 문자열 (없으면 첫 페이지)
  direction?: 'next' | 'prev'; // 기본 'next'
}

// 응답
interface CursorPaginationResponse<T> {
  data: T[];
  pagination: {
    next_cursor: string | null;  // null이면 마지막 페이지
    prev_cursor: string | null;
    has_next: boolean;
    has_prev: boolean;
    limit: number;
  };
}

// SQL 패턴
// WHERE created_at < :cursor ORDER BY created_at DESC LIMIT :limit + 1
// limit+1 조회 후 has_next 판단, 실제 반환은 limit개
```

### 3-3. 공통 에러 응답 포맷

```typescript
// 모든 에러 응답은 아래 형식으로 통일 (API Route 공통 헬퍼 함수로 처리)
interface ErrorResponse {
  success: false;
  error: {
    code: string;       // ex: "PERSON_NOT_FOUND", "UNAUTHORIZED", "RATE_LIMIT_EXCEEDED"
    message: string;    // Human-readable message (English)
    details?: unknown;  // 추가 정보 (validation 에러 배열 등)
  };
  timestamp: string;    // ISO 8601
  path: string;         // 요청 경로
}

// 성공 응답
interface SuccessResponse<T> {
  success: true;
  data: T;
}

// 에러 코드 목록 (일부)
// PERSON_NOT_FOUND, NODE_NOT_FOUND, THREAD_NOT_FOUND
// UNAUTHORIZED, FORBIDDEN, ADMIN_REQUIRED
// RATE_LIMIT_EXCEEDED
// VALIDATION_ERROR
// DUPLICATE_RELATION
// ALREADY_REPORTED
// FILE_TOO_LARGE, UNSUPPORTED_FILE_TYPE
// BULK_UPLOAD_FAILED
```

### 3-4. API 호출 전략

```typescript
// ── 빌드 타임 (SSG) ──────────────────────────────────────────
// Supabase Admin 클라이언트 직접 호출 (API Routes 미사용)
// generateStaticParams, generateMetadata에서 사용

// ── 서버 컴포넌트 (SSR) ──────────────────────────────────────
// App Router Server Component에서 Supabase 직접 쿼리
// → 네트워크 홉 없이 DB 직접 접근, 빠름

// ── API Routes (런타임 쓰기/인증 필요 요청) ──────────────────
// app/api/**/route.ts 에서 처리
// 스레드 작성, 댓글, 좋아요, 팔로우, 신고 등

// ── 클라이언트 컴포넌트 (CSR) ────────────────────────────────
// fetch('/api/...') + SWR / React Query

// 규칙 요약
// ┌──────────────────────────────────────────────────────────┐
// │ 빌드 타임 SSG      → supabaseAdmin 직접 쿼리              │
// │ Server Component   → supabaseServer 직접 쿼리 (SSR)       │
// │ API Route          → 인증/쓰기 요청 처리                   │
// │ Client Component   → fetch('/api/...') + SWR             │
// └──────────────────────────────────────────────────────────┘

// lib/supabase-server.ts — SSR 서버 컴포넌트 전용
import { createServerClient } from '@supabase/ssr';

// lib/supabase-admin.ts — 빌드 타임 / API Route 어드민 전용
import { createClient } from '@supabase/supabase-js';
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// lib/api-helpers.ts — API Route 공통 유틸
export function apiError(code: string, message: string, status = 400) {
  return Response.json({ success: false, error: { code, message } }, { status });
}
export function apiSuccess<T>(data: T) {
  return Response.json({ success: true, data });
}

// lib/auth.ts — API Route 인증 헬퍼
export async function requireUser(request: Request) {
  // Authorization 헤더에서 Supabase JWT 추출 + 검증
}
export async function requireAdmin(request: Request) {
  // JWT 검증 + profiles.role === 'ADMIN' 확인
}
```

### 3-5. Rate Limiting

```typescript
// lib/rate-limit.ts — Upstash Redis 또는 in-memory (MVP)
// MVP: Vercel Edge Config 또는 간단한 Map 기반 in-memory
// Milestone 2+: Upstash Redis (Vercel 통합, 무료 플랜 가능)

// API Route 핸들러에서 직접 호출
// export async function POST(request: Request) {
//   await rateLimit(request, { limit: 10, window: '1h' });
//   ...
// }

기본 (전체):         100 req / 1분 / IP
검색 API:            30 req / 1분 / IP
인물 추가 요청:      5 req / 1시간 / USER
관계 제안:           10 req / 1시간 / USER
신고:                10 req / 1시간 / USER
스레드 작성:         10 req / 1시간 / USER
댓글 작성:           30 req / 1시간 / USER
어드민 API:          rate limit 제외
```

### 3-6. Soft Delete 정책

**확정 정책: 모든 테이블에 `is_deleted` 통일**

```sql
-- persons, nodes 포함 모든 컨텐츠 테이블에 is_deleted 추가
-- 실제 DELETE는 어드민이 명시적으로 hard delete 요청할 때만 허용
-- 기본 조회 쿼리는 항상 WHERE is_deleted = FALSE 포함

-- persons
ALTER TABLE persons ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- nodes
ALTER TABLE nodes ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
```

### 3-7. 영문화 전략

#### 기본 방향 — 영문 단일 사이트
- **사이트 기본 언어**: 영어 (locale 라우팅 없음, 단일 URL 구조)
- **정적 콘텐츠(인물, 타임라인)**: `persons`, `person_timeline` 테이블에 직접 영문 저장
  - `persons.summary`, `persons.birth_place` — 영문
  - `person_timeline.title`, `person_timeline.description` — 영문
  - `persons.name_en` — Public 페이지에서 표시하는 이름
  - `persons.name_ko`, `persons.name_hanja` — DB 보존 (어드민/검색용)
- **커뮤니티(스레드/댓글)**: 다국어 혼용 허용, 별도 번역 없음
- **검색**: `name_en` + `name_ko` + `name_hanja` 동시 검색 지원

#### Public 페이지 데이터 흐름

```typescript
// Public 페이지: name_en 직접 사용 (번역 테이블 조회 없음)
const { data: person } = await supabaseAdmin
  .from('persons')
  .select('*')  // name_en, summary(영문), birth_place(영문) 포함
  .eq('slug', slug)
  .single();

// 표시: person.name_en
// 검색: name_en.ilike + name_ko.ilike 병행
```

#### 어드민 페이지
- 어드민 페이지는 `name_ko` 유지 (한국어 어드민 인터페이스)

---

## 4. 데이터베이스 스키마

> Supabase(PostgreSQL) 기준. 모든 테이블에 `created_at`, `updated_at` 포함.

### 4-1. 인물 (persons)

```sql
CREATE TABLE persons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,        -- 영문 slug (ex: sejong-daewang)
  name_ko          TEXT NOT NULL,               -- 한글 이름
  name_hanja       TEXT,                        -- 한자 이름
  name_en          TEXT,                        -- 영문 이름
  birth_year       INTEGER,                     -- 출생 연도 (정렬/비교용)
  birth_date       TEXT,                        -- 상세 생일 (MM-DD, 불명 시 NULL)
  death_year       INTEGER,                     -- 사망 연도
  death_date       TEXT,                        -- 상세 사망일 (MM-DD)
  birth_place      TEXT,
  summary          TEXT,
  thumbnail        TEXT,                        -- Supabase Storage URL
  is_controversial BOOLEAN DEFAULT FALSE,
  is_alive         BOOLEAN DEFAULT FALSE,
  is_published     BOOLEAN DEFAULT FALSE,
  is_deleted       BOOLEAN DEFAULT FALSE,       -- soft delete
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 전문 검색 인덱스
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX persons_name_ko_trgm  ON persons USING gin(name_ko gin_trgm_ops);
CREATE INDEX persons_name_hanja_trgm ON persons USING gin(name_hanja gin_trgm_ops);

-- 정렬/필터 인덱스
CREATE INDEX persons_birth_year_idx ON persons (birth_year);
CREATE INDEX persons_is_published_idx ON persons (is_published) WHERE is_deleted = FALSE;

-- 오늘의 인물용 (생일 월/일 검색)
CREATE INDEX persons_birth_date_idx ON persons (birth_date);
CREATE INDEX persons_death_date_idx ON persons (death_date);
```

### 4-2. 인물 태그 (tags / person_tags)

```sql
CREATE TABLE tags (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL,
  type  TEXT NOT NULL CHECK (type IN ('ERA', 'FIELD', 'CUSTOM'))
  -- ERA:   ancient | three-kingdoms | goryeo | joseon | modern
  -- FIELD: king | general | artist | independence-activist | scholar
  --        politician | sports | entertainer | entrepreneur | religious
);

CREATE TABLE person_tags (
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  tag_id    UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, tag_id)
);

CREATE INDEX person_tags_person_id_idx ON person_tags (person_id);
CREATE INDEX person_tags_tag_id_idx ON person_tags (tag_id);
```

### 4-3. 노드 (nodes)

```sql
CREATE TABLE nodes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,            -- 영문 slug
  node_type    TEXT NOT NULL CHECK (node_type IN ('ARTIFACT', 'MEDIA', 'EVENT')),
  title        TEXT NOT NULL,
  description  TEXT,
  thumbnail    TEXT,
  metadata     JSONB,
  -- ARTIFACT: { "designation": "국보 제70호", "location": "국립중앙박물관" }
  -- MEDIA:    { "year": 2023, "genre": "드라마", "platform": "Netflix" }
  -- EVENT:    { "start_year": 1919, "end_year": 1919, "location": "전국" }
  is_published BOOLEAN DEFAULT FALSE,
  is_deleted   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX nodes_title_trgm ON nodes USING gin(title gin_trgm_ops);
CREATE INDEX nodes_type_idx ON nodes (node_type) WHERE is_deleted = FALSE;
```

### 4-4. 인물-노드 연결 (person_node_links)

```sql
CREATE TABLE person_node_links (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  node_id   UUID REFERENCES nodes(id) ON DELETE CASCADE,
  link_type TEXT,
  UNIQUE (person_id, node_id)
);

CREATE INDEX person_node_links_person_id_idx ON person_node_links (person_id);
CREATE INDEX person_node_links_node_id_idx ON person_node_links (node_id);
```

### 4-5. 인물 간 관계 (person_relations)

```sql
CREATE TYPE relation_type AS ENUM (
  'FAMILY',       -- 가족/혈연 (양방향)
  'TEACHER',      -- 스승/제자 (단방향: from=스승, to=제자)
  'ALLY',         -- 협력자/동지 (양방향)
  'RIVAL',        -- 대립/적대 (양방향)
  'LORD_VASSAL',  -- 군신 관계 (단방향: from=왕, to=신하)
  'INFLUENCE'     -- 영향 (단방향: from=영향을 준 사람, to=받은 사람)
);

CREATE TABLE person_relations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  to_person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  relation_type  relation_type NOT NULL,
  description    TEXT,
  source_url     TEXT,            -- 근거 출처 (관계 제안 시 필수)
  is_approved    BOOLEAN DEFAULT FALSE,
  suggested_by   UUID REFERENCES auth.users(id),
  approved_by    UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (from_person_id, to_person_id, relation_type)
);

-- 양방향 관계 처리 규칙
-- FAMILY, ALLY, RIVAL: 단방향으로 1건만 저장, 쿼리 시 OR 조건 사용
--   → WHERE from_person_id = :id OR to_person_id = :id
-- TEACHER, LORD_VASSAL, INFLUENCE: 단방향 저장, from→to 방향이 의미를 가짐
--   → TEACHER: from=스승, to=제자
--   → LORD_VASSAL: from=왕(주군), to=신하
--   → INFLUENCE: from=영향을 준 인물, to=받은 인물

-- 관계도 조회 시 양방향 포함 헬퍼 함수
CREATE OR REPLACE FUNCTION get_person_relations(p_id UUID)
RETURNS TABLE (
  relation_id UUID,
  other_person_id UUID,
  relation_type relation_type,
  direction TEXT,  -- 'outgoing' | 'incoming' | 'both'
  description TEXT
) AS $$
  SELECT
    id, to_person_id, relation_type,
    CASE WHEN relation_type IN ('FAMILY','ALLY','RIVAL') THEN 'both' ELSE 'outgoing' END,
    description
  FROM person_relations
  WHERE from_person_id = p_id AND is_approved = TRUE
  UNION ALL
  SELECT
    id, from_person_id, relation_type,
    CASE WHEN relation_type IN ('FAMILY','ALLY','RIVAL') THEN 'both' ELSE 'incoming' END,
    description
  FROM person_relations
  WHERE to_person_id = p_id AND is_approved = TRUE
    AND relation_type NOT IN ('FAMILY','ALLY','RIVAL') -- 양방향은 위에서 이미 포함
$$ LANGUAGE sql;

CREATE INDEX person_relations_from_idx ON person_relations (from_person_id);
CREATE INDEX person_relations_to_idx ON person_relations (to_person_id);
```

### 4-6. 스레드 (threads)

```sql
CREATE TABLE threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES auth.users(id),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  video_url   TEXT,                    -- YouTube/Vimeo URL (선택)
  is_pinned   BOOLEAN DEFAULT FALSE,
  is_deleted  BOOLEAN DEFAULT FALSE,
  view_count  INTEGER DEFAULT 0,       -- view_logs 배치 집계로 갱신
  reply_count INTEGER DEFAULT 0,       -- 댓글 작성/삭제 시 트리거로 갱신
  like_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX threads_person_id_idx ON threads (person_id) WHERE is_deleted = FALSE;
CREATE INDEX threads_author_id_idx ON threads (author_id);
CREATE INDEX threads_created_at_idx ON threads (created_at DESC);
```

### 4-7. 스레드 댓글 (thread_replies)

```sql
CREATE TABLE thread_replies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES thread_replies(id) ON DELETE SET NULL,
  author_id  UUID REFERENCES auth.users(id),
  content    TEXT NOT NULL,
  depth      INTEGER NOT NULL DEFAULT 0,
  -- depth는 DB에 실제 값 저장 (0-based)
  -- 렌더링 레이어에서 MIN(depth, 3) 처리 + depth>3이면 @멘션 표시
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX thread_replies_thread_id_idx ON thread_replies (thread_id);
CREATE INDEX thread_replies_parent_id_idx ON thread_replies (parent_id);
```

### 4-8. 노드 댓글 (node_comments)

```sql
CREATE TABLE node_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id    UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES auth.users(id),
  content    TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX node_comments_node_id_idx ON node_comments (node_id) WHERE is_deleted = FALSE;
```

### 4-9. 조회 로그 (view_logs) — race condition 방지

```sql
-- view_count 직접 UPDATE 대신 로그 삽입 방식 사용
-- 배치 집계 (5분 간격 cron) → persons/nodes/threads의 view_count 갱신

CREATE TABLE view_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('PERSON','NODE','THREAD')),
  target_id   UUID NOT NULL,
  viewer_ip   TEXT,              -- 중복 집계 방지용 (하루 기준 dedup)
  viewed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 파티셔닝 (데이터 증가 대비, 월별)
-- viewed_at 기준 월별 파티션 권장
CREATE INDEX view_logs_target_idx ON view_logs (target_type, target_id, viewed_at);

-- 배치 집계 쿼리 (5분마다 실행)
-- UPDATE persons SET view_count = (
--   SELECT COUNT(DISTINCT viewer_ip) FROM view_logs
--   WHERE target_type = 'PERSON' AND target_id = persons.id
--   AND viewed_at > NOW() - INTERVAL '24 hours'
-- ) WHERE id IN (최근 집계 대상);
```

### 4-10. 인물 타임라인 (person_timeline)

```sql
CREATE TABLE person_timeline (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  year        INTEGER NOT NULL,
  month       INTEGER CHECK (month BETWEEN 1 AND 12),
  title       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER DEFAULT 0
);

CREATE INDEX person_timeline_person_id_idx ON person_timeline (person_id);
```

### 4-11. 인물 추가 요청 (person_requests)

```sql
CREATE TABLE person_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID REFERENCES auth.users(id),
  name_en         TEXT NOT NULL,       -- 영문 이름 (필수 — 글로벌 유저 대응)
  name_ko         TEXT,                -- 한글 이름 (선택)
  birth_year      INTEGER,
  death_year      INTEGER,
  reason          TEXT NOT NULL,       -- 등록 이유 (필수)
  source_url      TEXT NOT NULL,       -- 근거 출처 URL (필수)
  status          TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  admin_note      TEXT,
  duplicate_count INTEGER DEFAULT 1,  -- 동일 인물 중복 요청 수 (어드민 정렬용)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX person_requests_status_idx ON person_requests (status, duplicate_count DESC);
```

### 4-12. 신고 (reports)

```sql
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('THREAD','THREAD_REPLY','NODE_COMMENT')),
  target_id   UUID NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','RESOLVED','DISMISSED')),
  resolved_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (reporter_id, target_type, target_id)  -- 동일 대상 중복 신고 방지
);

CREATE INDEX reports_status_idx ON reports (status, created_at ASC);
```

### 4-13. 컬렉션 (collections / collection_items)

```sql
CREATE TABLE collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  title       TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN DEFAULT TRUE,
  item_count  INTEGER DEFAULT 0,      -- 트리거로 관리
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX collections_user_id_idx ON collections (user_id);
CREATE INDEX collections_public_idx ON collections (is_public, created_at DESC);

CREATE TABLE collection_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  person_id     UUID REFERENCES persons(id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (collection_id, person_id)
);

CREATE INDEX collection_items_collection_id_idx ON collection_items (collection_id);
```

### 4-14. 알림 (notifications)

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
    'THREAD_REPLY',         -- 내 스레드에 댓글
    'REPLY_REPLY',          -- 내 댓글에 대댓글
    'THREAD_LIKED',         -- 내 스레드/댓글 좋아요 (10개 단위 알림)
    'FOLLOW_UPDATE',        -- 팔로우한 인물/노드에 새 스레드
    'REQUEST_APPROVED',     -- 인물 추가 요청 승인
    'REQUEST_REJECTED',     -- 인물 추가 요청 반려
    'RELATION_APPROVED',    -- 관계 제안 승인
    'RELATION_REJECTED',    -- 관계 제안 반려
    'WARNING'               -- 경고 알림
  )),
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,          -- 알림 클릭 시 이동할 경로
  is_read     BOOLEAN DEFAULT FALSE,
  source_id   UUID,          -- 트리거가 된 리소스 ID
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_id_idx ON notifications (user_id, is_read, created_at DESC);
```

### 4-15. 유저 프로필 (profiles)

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  nickname      TEXT UNIQUE,
  avatar_url    TEXT,
  role          TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  is_banned     BOOLEAN DEFAULT FALSE,
  ban_until     TIMESTAMPTZ,           -- NULL이면 영구 정지
  warning_count INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 정지 해제 자동화: Supabase pg_cron
-- 매 시간 실행: UPDATE profiles SET is_banned = FALSE WHERE ban_until < NOW() AND is_banned = TRUE;
```

### 4-16. 경고 이력 (warning_logs)

```sql
CREATE TABLE warning_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id    UUID REFERENCES auth.users(id),
  reason      TEXT NOT NULL,
  target_type TEXT,          -- 경고 원인 콘텐츠 타입
  target_id   UUID,          -- 경고 원인 콘텐츠 ID
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX warning_logs_user_id_idx ON warning_logs (user_id, created_at DESC);
```

### 4-17. 운영진 아티클 (articles)

```sql
CREATE TABLE articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,              -- 마크다운
  summary      TEXT,                       -- 목록 미리보기용 요약
  thumbnail    TEXT,                       -- Supabase Storage URL 또는 이모지
  tag          TEXT NOT NULL CHECK (tag IN ('editorial', 'special', 'spotlight', 'modern', 'notice', 'guide')),
  is_notice    BOOLEAN DEFAULT FALSE,      -- TRUE면 공지사항 섹션에 표시
  is_published BOOLEAN DEFAULT FALSE,
  author_id    UUID REFERENCES auth.users(id),
  view_count   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX articles_published_idx ON articles (is_published, created_at DESC);
CREATE INDEX articles_notice_idx ON articles (is_notice, created_at DESC) WHERE is_published = TRUE;
```

### 4-18. 오늘의 인물 투표 (person_of_day_votes)

```sql
CREATE TABLE person_of_day_votes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  vote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, vote_date)              -- 1일 1회 제한
);

CREATE INDEX person_of_day_votes_date_idx ON person_of_day_votes (vote_date, person_id);
```

### 4-19. 노드 번역 (node_translations)

```sql
CREATE TABLE node_translations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id          UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  locale           TEXT NOT NULL CHECK (locale IN ('en', 'ja')),
  title            TEXT,
  description      TEXT,
  is_ai_translated BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (node_id, locale)
);
```

### 4-20. 좋아요 (likes)

```sql
-- 스레드 + 댓글 통합 좋아요 테이블
CREATE TABLE likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'reply', 'node_comment')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)  -- 중복 좋아요 방지
);

CREATE INDEX likes_target_idx ON likes (target_type, target_id);
CREATE INDEX likes_user_idx   ON likes (user_id, created_at DESC);
```

> **like_count 관리**: threads / replies / node_comments 테이블에 `like_count INTEGER DEFAULT 0` 컬럼 추가.
> 좋아요 INSERT/DELETE 시 트리거 또는 서비스 레이어에서 카운터 동기화.

```sql
-- threads, replies, node_comments 에 컬럼 추가
ALTER TABLE threads       ADD COLUMN like_count INTEGER DEFAULT 0;
ALTER TABLE thread_replies ADD COLUMN like_count INTEGER DEFAULT 0;
ALTER TABLE node_comments ADD COLUMN like_count INTEGER DEFAULT 0;
```

---

### 4-21. 팔로우 (follows)

```sql
-- 인물(PERSON) + 노드(ARTIFACT|MEDIA|EVENT) 팔로우 통합
CREATE TABLE follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('person', 'node')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)  -- 중복 팔로우 방지
);

CREATE INDEX follows_user_idx   ON follows (user_id, created_at DESC);
CREATE INDEX follows_target_idx ON follows (target_type, target_id);
```

> **팔로우 알림**: 팔로우한 인물/노드에 새 스레드(or 댓글)가 달리면 `notifications` 테이블에 `FOLLOW_UPDATE` 타입으로 INSERT.
> **팔로우 수 캐시**: persons / nodes 테이블에 `follow_count INTEGER DEFAULT 0` 컬럼 추가. follows INSERT/DELETE 시 동기화.

```sql
ALTER TABLE persons ADD COLUMN follow_count INTEGER DEFAULT 0;
ALTER TABLE nodes   ADD COLUMN follow_count INTEGER DEFAULT 0;
```

---

### 4-22. 스레드 이미지 (thread_images)

```sql
-- 스레드당 최대 3장, 순서 보장
CREATE TABLE thread_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,           -- Supabase Storage public URL
  sort_order SMALLINT NOT NULL DEFAULT 0,  -- 0~2, 표시 순서
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT max_images_per_thread CHECK (sort_order BETWEEN 0 AND 2)
);

CREATE INDEX thread_images_thread_id_idx ON thread_images (thread_id, sort_order);
```

> **업로드 경로**: `threads/{user_id}/{thread_id}/{uuid}.webp`
> **제약**: 스레드당 최대 3장 / 파일당 5MB / jpeg·png·webp 허용
> **댓글(replies)에는 이미지 첨부 없음** — 복잡도 낮추기 위해 의도적으로 미포함

---

## 5. API 명세

> Next.js API Routes 기반. Base URL: `/api`
> 인증: Supabase JWT — Authorization: Bearer {token}
> 모든 응답: [공통 에러/성공 포맷](#3-3-공통-에러-응답-포맷) 준수
> 페이지네이션: [Cursor 방식](#3-2-cursor-기반-페이지네이션) 통일

### 5-1. 인물 (Persons)

```
GET    /persons                   인물 목록
  Query: limit, cursor, era, field, sort(name|popular|recent), q

GET    /persons/:slug             인물 상세
GET    /persons/:slug/timeline    타임라인
GET    /persons/:slug/relations   관계 목록 (relation_type 필터 가능)
GET    /persons/:slug/threads     스레드 목록 (cursor 페이지네이션)
GET    /persons/:slug/nodes       연결된 노드 목록

POST   /persons                   인물 등록 [ADMIN]
PUT    /persons/:id               인물 수정 [ADMIN]
DELETE /persons/:id               인물 soft delete [ADMIN]
DELETE /persons/:id/hard          인물 hard delete [ADMIN]
POST   /persons/bulk              CSV 벌크 등록 [ADMIN] (하단 상세 참조)
```

### 5-2. 노드 (Nodes)

```
GET    /nodes                     노드 목록
  Query: limit, cursor, type(ARTIFACT|MEDIA|EVENT), q

GET    /nodes/:slug               노드 상세
GET    /nodes/:slug/comments      댓글 목록 (cursor 페이지네이션)

POST   /nodes                     노드 등록 [ADMIN]
PUT    /nodes/:id                 노드 수정 [ADMIN]
DELETE /nodes/:id                 노드 soft delete [ADMIN]
```

### 5-3. 관계 (Relations)

```
GET    /relations                 관계 탐색용 전체 데이터
  Query: person_ids (쉼표 구분, 최대 200명), relation_type
  → 전체 노드를 한번에 반환하지 않음. 중심 인물 기준 최대 2촌 범위로 제한.
  → 전체 탐색 페이지는 클릭/확장 시 추가 로드 방식 (lazy expand)

GET    /persons/:slug/relations   특정 인물의 관계 (1촌)

POST   /relations/suggest         관계 제안 [USER]
  body: {
    from_person_id: UUID,
    to_person_id: UUID,
    relation_type: relation_type,
    description: string (필수),
    source_url: string (필수)
  }

PUT    /relations/:id/approve     승인 [ADMIN]
PUT    /relations/:id/reject      반려 [ADMIN]
  body: { admin_note: string }
DELETE /relations/:id             삭제 [ADMIN]
```

### 5-4. 스레드 (Threads)

```
GET    /threads/:id               스레드 상세 + 댓글 트리 (최상위 20개 + 대댓글 lazy load)
                                  → images[], video_url 포함 반환

POST   /threads                   스레드 작성 [USER]
  body: {
    person_id: UUID,
    title: string,
    content: string,
    video_url?: string,           -- YouTube/네이버TV URL (선택)
    image_ids?: UUID[]            -- 업로드 완료된 thread_images.id 최대 3개
  }
  → 처리 순서:
    1. 텍스트 저장 (threads INSERT)
    2. image_ids가 있으면 thread_images.thread_id 연결
    3. video_url 있으면 유효성 검증 후 저장

PUT    /threads/:id               스레드 수정 [OWNER]
  body: { title?, content?, video_url?, image_ids? }
  → 이미지 교체 시 기존 thread_images 삭제 후 재연결

DELETE /threads/:id               스레드 soft delete [OWNER|ADMIN]
  → thread_images는 Supabase Storage에서도 삭제

POST   /threads/:id/like          좋아요 토글 [USER]
  → 응답: { liked: boolean, like_count: number }

POST   /upload/thread-image       스레드 이미지 업로드 [USER]
  → presigned URL 방식
  → 응답: { image_id: UUID, url: string }
  → 스레드 작성 전에 먼저 이미지 업로드 → image_id를 스레드 작성 body에 포함

GET    /threads/:id/replies       댓글 목록 (트리, cursor)
POST   /threads/:id/replies       댓글 작성 [USER]
  body: { parent_id?: UUID, content: string }
  → depth는 서버에서 parent.depth + 1 로 자동 계산
PUT    /replies/:id               댓글 수정 [OWNER]
DELETE /replies/:id               댓글 soft delete [OWNER|ADMIN]

POST   /replies/:id/like          댓글 좋아요 토글 [USER]
  → 응답: { liked: boolean, like_count: number }
```

**video_url 유효성 검증 규칙**

```typescript
// 허용 도메인: YouTube, Vimeo (글로벌 기준)
const ALLOWED_VIDEO_HOSTS = [
  'youtube.com', 'youtu.be',
  'vimeo.com',
];

function validateVideoUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return ALLOWED_VIDEO_HOSTS.some(h => host === h || host.endsWith('.' + h));
  } catch { return false; }
}

// 프리뷰 썸네일 추출
// YouTube: https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg
// Vimeo: https://vimeo.com/api/oembed.json?url={URL}
```

### 5-5. 노드 댓글 (Node Comments)

```
GET    /nodes/:slug/comments      댓글 목록 (cursor)
POST   /nodes/:slug/comments      댓글 작성 [USER]
  body: { content: string }
PUT    /comments/:id              수정 [OWNER]
DELETE /comments/:id              soft delete [OWNER|ADMIN]

POST   /comments/:id/like         노드 댓글 좋아요 토글 [USER]
  → 응답: { liked: boolean, like_count: number }
```

### 5-5-1. 팔로우 (Follows)

```
POST   /follows                   팔로우 토글 [USER]
  body: { target_type: 'person'|'node', target_id: UUID }
  → 이미 팔로우면 DELETE (언팔로우), 아니면 INSERT
  → 응답: { followed: boolean, follow_count: number }

GET    /follows/me                내가 팔로우한 목록 [USER]
  Query: target_type('person'|'node'|'all'), limit, cursor
  → 응답: 팔로우한 인물/노드 목록 + 각 새 스레드 수

GET    /follows/me/feed           팔로우 피드 [USER]
  Query: limit, cursor
  → 팔로우한 인물/노드의 최신 스레드만 모아보기
  → 메인 피드와 동일한 카드 구조, cursor 페이지네이션
```

> **팔로우 피드 활용**: 메인 페이지 탭에 `[전체] [한국어] [영어] [팔로우]` 4번째 탭으로 추가. 로그인 유저에게만 노출.

### 5-6. 검색 (Search)

```
GET    /search
  Query:
    q: string (필수, 최소 1자)
    type: ALL|PERSON|ARTIFACT|MEDIA|EVENT  (기본: ALL)
    era, field  (type=PERSON 일 때 유효)
    sort: relevance|name_asc|popular|recent  (기본: relevance)
    limit, cursor

GET    /search/suggest
  Query: q (필수)
  반환: { persons[3], artifacts[2], media[2], events[1] }  — 타입별 그룹핑, 최대 8개
```

### 5-7. 인물 추가 요청

```
POST   /person-requests           요청 제출 [USER]
  body: { name_en, name_ko?, birth_year?, death_year?, reason, source_url }

GET    /person-requests           요청 목록 [ADMIN]
  Query: status(PENDING|APPROVED|REJECTED), limit, cursor
  정렬: duplicate_count DESC, created_at ASC

PUT    /person-requests/:id/approve  승인 [ADMIN]
PUT    /person-requests/:id/reject   반려 [ADMIN]
  body: { admin_note: string }
```

### 5-8. 신고

```
POST   /reports                   신고 제출 [USER]
  body: { target_type, target_id, reason }

GET    /reports                   신고 목록 [ADMIN]
  Query: status, limit, cursor

PUT    /reports/:id/resolve       처리 완료 [ADMIN]
  body: { action: 'warn'|'delete'|'ban', ban_duration?: number (시간) }
PUT    /reports/:id/dismiss       기각 [ADMIN]
```

### 5-9. 컬렉션

```
GET    /collections/me            내 컬렉션 목록 [USER]
GET    /collections/public        공개 컬렉션 목록 (cursor)
GET    /collections/:id           컬렉션 상세 (공개이면 비회원도 접근 가능)
POST   /collections               생성 [USER]
PUT    /collections/:id           수정 [OWNER]
DELETE /collections/:id           삭제 [OWNER]

POST   /collections/:id/items     인물 추가 [OWNER]
  body: { person_id: UUID }
DELETE /collections/:id/items/:personId  인물 제거 [OWNER]
```

### 5-10. 알림

```
GET    /notifications             내 알림 목록 [USER] (cursor, 읽음 필터)
PUT    /notifications/:id/read    읽음 처리 [USER]
PUT    /notifications/read-all    전체 읽음 [USER]
GET    /notifications/unread-count 미읽음 수 [USER]
```

### 5-11. 이미지 업로드

```
POST   /upload/presigned-url      Presigned URL 발급 [USER]
  body: { file_type: 'image/jpeg'|'image/png'|'image/webp', file_size: number, target: 'avatar'|'thread'|'person' }
  반환: { upload_url: string, public_url: string, expires_in: 300 }

  제한:
    최대 파일 크기: 5MB
    허용 타입: image/jpeg, image/png, image/webp
    person 썸네일: 어드민만 가능

-- 업로드 플로우
-- 1. 클라이언트 → POST /api/upload/presigned-url (Next.js API Route)
-- 2. API Route → Supabase Storage presigned URL 발급 (supabaseAdmin)
-- 3. 클라이언트 → Supabase Storage에 직접 PUT (서버 미경유)
-- 4. 업로드 완료 후 public_url을 게시물에 포함
```

### 5-12. 메인 페이지 (Home)

```
GET    /home                      메인 페이지 통합 데이터 (SSR용 단일 호출)
  반환:
    today_persons: TodayPerson[]  -- 오늘의 인물 3명 (slot1~3)
    new_persons: Person[]         -- 최근 등록 인물 5명
    site_stats: {                 -- 하단 통계
      total_persons, total_threads, total_comments, total_users
    }
    -- ※ 스레드 피드는 별도 /threads/feed API로 분리 (무한스크롤)

GET    /threads/feed              전체 스레드 무한스크롤 피드
  Query:
    limit: 기본 20
    cursor: created_at ISO (없으면 첫 페이지)
    lang: ko | en | all  (기본: all — 모든 언어 혼용)
  반환: CursorPaginationResponse<ThreadFeedItem>
  ThreadFeedItem: {
    id, title, content_preview(100자),
    person: { slug, name_en, thumbnail },
    author: { nickname, avatar_url },
    reply_count, created_at,
    detected_lang: 'ko' | 'en' | 'ja' | 'other'  -- 자동 감지
  }
  정렬: created_at DESC (최신순 고정)
  -- 논란 인물 스레드 포함, 필터 없음 (Reddit 방식)

GET    /ranking                   핫한 인물 랭킹 (Gravity Decay)
  Query:
    tag: ERA 태그 이름 (선택)
    limit: 기본 100, 최대 100
    cursor: offset (기본 0)
  반환: { persons: RankedPerson[], has_next }
  -- 공식: Σ (1 + replies*0.5 + likes) / (age_days + 2)^1.5
  -- 최근 30일 스레드 대상, gravity decay로 자연 감소

POST   /persons/:id/vote-today    오늘의 인물 추천 투표 [USER]
GET    /persons/today-votes       오늘 투표 현황 (상위 10명)

POST   /translate                 커뮤니티 콘텐츠 번역 [USER]
  body: { text: string, target_locale: 'en' | 'ko' | 'ja' }
  반환: { translated: string, detected_source: string }
  -- DB 저장 없음, 실시간 번역만
  -- Rate limit: 10 req / 1분 / USER
  -- 내부적으로 OpenAI GPT-4o mini 호출
```

### 5-13. 아티클 (Articles)

```
GET    /articles                  아티클 목록
  Query: limit, cursor, tag, is_notice(true|false)

GET    /articles/:slug            아티클 상세

GET    /articles/notices          공지사항 목록 (is_notice=true, 최신 5건)
  → 메인 페이지 사이드바용

POST   /articles                  아티클 작성 [ADMIN]
  body: { slug, title, body, summary, thumbnail, tag, is_notice, is_published }
PUT    /articles/:id              아티클 수정 [ADMIN]
DELETE /articles/:id              아티클 soft delete [ADMIN]
```

### 5-14. 어드민 통계

```
GET    /admin/stats
  반환:
    today_views: number
    new_users_7d: number
    new_threads_7d: number
    pending_requests: number
    pending_reports: number
    top_persons_7d: { slug, name_ko, view_count }[]  — TOP 5

GET    /admin/members             회원 목록 [ADMIN] (cursor, 검색, 정지 필터)
PUT    /admin/members/:id/ban     정지 [ADMIN]
  body: { duration_hours?: number, reason: string }  — duration 없으면 영구 정지
PUT    /admin/members/:id/unban   정지 해제 [ADMIN]
PUT    /admin/members/:id/warn    경고 [ADMIN]
  body: { reason: string, target_type?, target_id? }
```

### 5-15. CSV 벌크 업로드 상세

```
POST   /persons/bulk  [ADMIN]
  Content-Type: multipart/form-data
  file: CSV

CSV 형식:
  name_ko, name_hanja, birth_year, death_year, birth_place, tags, is_controversial, summary
  세종대왕, 世宗大王, 1397, 1450, 한성부, "왕|조선", false, 조선 4대 국왕
  (tags는 | 구분자)

처리 방식: 부분 성공 허용
  - 각 행 독립적으로 처리 (전체 롤백 없음)
  - 유효성 검사 실패 행은 건너뛰고 에러 리포트에 기록
  - 응답:
    {
      total: 100,
      success: 95,
      failed: 5,
      errors: [
        { row: 3, name: "홍길동", reason: "DUPLICATE_SLUG" },
        ...
      ]
    }
```

---

## 6. 페이지 및 라우트 구조

### 6-1. 공개 페이지

| 경로 | 설명 | 렌더링 |
|------|------|--------|
| `/` | Main home (Today's Person, hot threads, recent) | SSR |
| `/person` | Person list (filter/sort) | SSR |
| `/person/[slug]` | Person detail | SSG + ISR(24h) |
| `/artifact/[slug]` | Artifact detail | SSG + ISR(24h) |
| `/media/[slug]` | Media detail | SSG + ISR(24h) |
| `/event/[slug]` | Event detail | SSG + ISR(24h) |
| `/search` | Unified search results | SSR |
| `/relations` | Full relation graph explorer | CSR |
| `/login` | Login | CSR |
| `/signup` | Sign up | CSR |
| `/collection/[id]` | Public collection detail | SSR |
| `/article` | Editorial article list | SSR |
| `/article/[slug]` | Article detail | SSG + ISR(1h) |

### 6-2. 어드민 페이지 (CSR, Admin Guard 적용)

| 경로 | 설명 |
|------|------|
| `/admin` | 대시보드 |
| `/admin/persons` | 인물 관리 |
| `/admin/nodes` | 노드 관리 |
| `/admin/requests` | 인물 추가 요청 큐 |
| `/admin/relations` | 관계 제안 큐 |
| `/admin/reports` | 신고 처리 |
| `/admin/members` | 회원 관리 |
| `/admin/tags` | 태그/분류 관리 |

---

## 7. 핵심 기능 상세 명세

### 7-1. 인물 상세 페이지 레이아웃

```
┌──────────────────────────────────────────────────────────┐
│  [썸네일]  이름 (한자)                                      │
│           생몰년도 · 출생지                                 │
│           태그: #왕 #조선 #세종                            │
│           [⭐ 컬렉션에 추가]                               │
│  ⚠️ 논란 인물 배너 (is_controversial=true 시)              │
├──────────────────────────────────────────────────────────┤
│  ██████████████████ 광고 ① 레더보드 (728×90) █████████████ │
├──────────────────────────┬───────────────────────────────┤
│  좌측 (메인)              │  우측 사이드바                  │
│                          │                               │
│  💬 스레드               │  🕸 관계도 (미니, 1촌)          │
│  [새 스레드 작성]         │  [관계 유형 토글]               │
│  스레드 목록              │  [전체 관계도 탐색 →]           │
│                          │                               │
│  ██████████████████████  │  ██ 광고 ③ 사이드바 ██████     │
│  ██ 광고 ② 렉탱글 ██████  │  ██  (300×250)  ████████      │
│  ██  (300×250)  ████████  │  ████████████████████████    │
│  ██████████████████████  │                               │
│                          │  ⭐ 포함된 컬렉션               │
│  📅 생애 타임라인         │                               │
│  1397 출생 ── 1450 사망   │  🎂 오늘의 인물 배너            │
│                          │  (생일/기일 일치 시 표시)       │
│  🔗 관련 노드 갤러리       │                               │
│  (유물 · 미디어 · 사건)   │                               │
└──────────────────────────┴───────────────────────────────┘

섹션 순서 (좌측 기준):
1. 💬 스레드 — 커뮤니티 핵심, 페이지 진입 즉시 노출
2. 📅 생애 타임라인 — 심화 정보, 스크롤 후 노출
3. 🔗 관련 노드 갤러리 — 유물/미디어/사건 연결
```

### 7-2. 스레드 댓글 렌더링 규칙

```typescript
const MAX_VISUAL_DEPTH = 3; // 0-based, 즉 4단계까지 들여쓰기

function renderReply(reply: Reply, visualDepth: number) {
  const indentDepth = Math.min(visualDepth, MAX_VISUAL_DEPTH);

  return (
    <div style={{ marginLeft: indentDepth * 24 }}>
      {/* depth > MAX_VISUAL_DEPTH 면 @멘션으로 맥락 표시 */}
      {visualDepth > MAX_VISUAL_DEPTH && reply.parent && (
        <span className="text-blue-500">@{reply.parent.author.nickname}</span>
      )}
      <ReplyContent reply={reply} />
      {/* 답글 달기 버튼은 모든 depth에 항상 표시 */}
      <button>답글 달기</button>
    </div>
  );
}
// DB에는 실제 depth 보존 → 나중에 무한 depth로 전환 시 프론트만 수정
```

### 7-3. 관계도 시각화

```typescript
// 관계 유형별 시각화
const RELATION_STYLE = {
  FAMILY:      { color: '#22c55e', dash: null,  label: 'Family' },
  TEACHER:     { color: '#f97316', dash: null,  label: 'Teacher/Student' },
  ALLY:        { color: '#3b82f6', dash: null,  label: 'Ally' },
  RIVAL:       { color: '#ef4444', dash: null,  label: 'Rival' },
  LORD_VASSAL: { color: '#a855f7', dash: null,  label: 'Lord/Vassal' },
  INFLUENCE:   { color: '#94a3b8', dash: '5,5', label: 'Influence' },
};

// 미니 관계도 (인물 페이지 내)
// - D3.js force-directed graph
// - 중심 인물 + 1촌만 렌더링
// - 관계 유형 토글 버튼으로 필터링

// 전체 관계 탐색 페이지 (/relations)
// - vis-network 사용
// - lazy expand: 인물 클릭 시 해당 인물의 1촌 추가 로드
// - 최초 진입: 인기 인물 상위 50명 + 그 사이의 관계만 렌더링
// - 관계 유형 토글 + 시대/분야 필터
```

### 7-4. 오늘의 인물 선정 로직

```typescript
// 표시 개수: 최대 3명 (메인 홈 상단 카드 3장)
// 매일 00:00 갱신

// 슬롯 구성
// SLOT 1 — 생일/기일 자동 선정 (Featured 배지)
//   1순위: 오늘 birth_date (MM-DD) 일치 인물 → 여러 명이면 view_count DESC
//   2순위: 오늘 death_date (MM-DD) 일치 인물 → 동일 기준
//   3순위: 해당 없으면 랜덤 (is_published=true, is_controversial=false 조건)

// SLOT 2 — 운영진 직접 선정
//   어드민 패널에서 운영진이 날짜별로 수동 지정
//   지정 없으면 view_count 상위 인물로 자동 대체

// SLOT 3 — 유저 추천 투표 1위
//   person_of_day_votes 테이블에서 오늘 날짜 기준 투표 수 최다 인물
//   투표는 로그인 유저만, 1일 1회 1인물

// 오늘의 인물 캐싱: Redis 없으면 DB 뷰(materialized view) 또는
// daily_featured 별도 테이블에 cron으로 매일 00:00 갱신
```

### 7-4-1. person_of_day_votes 테이블

```sql
CREATE TABLE person_of_day_votes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  vote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, vote_date)  -- 1일 1회 제한
);

CREATE INDEX person_of_day_votes_date_idx ON person_of_day_votes (vote_date, person_id);
```

### 7-5. 논란 인물 처리

```typescript
// 인물 상세 페이지
if (person.is_controversial) {
  // 1. 페이지 최상단 배너
  // "⚠️ This figure is considered historically controversial.
  //  Sillok provides factual information only."

  // 2. summary 필드 비워둠 — 기본 정보만 표시 (이름, 생몰년, 출생지, 태그)

  // 3. 스레드 게시판 상단 안내
  // "Posts about this figure must be written from a neutral perspective.
  //  Claims without citations may be removed by moderators."
}
```

### 7-6. OG 이미지 자동 생성

```typescript
// app/person/[slug]/opengraph-image.tsx
// Next.js ImageResponse 활용
// 인물 이름 + 대표 이미지 + 생몰년 카드 형식
// → 카카오톡/SNS 공유 시 썸네일 자동 생성
// 크기: 1200 x 630

// app/artifact/[slug]/opengraph-image.tsx
// app/media/[slug]/opengraph-image.tsx
// 동일 방식 적용
```

### 7-7. 메인 페이지 레이아웃

```
┌──────────────────────────────────────────────────────────────────┐
│  NAV: SILLOK | [검색창] | 인물 유물 미디어 사건 관계도 | 로그인 가입  │
├──────────────────────────────────────────────────────────────────┤
│  슬림 히어로 스트립 (1줄)                                           │
│  "Discover the people who shaped Korea"                          │
│  [👤 1,240 Persons]  [🏺 384 Artifacts]  [🎬 218 Media]  [📌 156 Events] │
├──────────────────────────────────────────────────────────────────┤
│  ████████████████████ 광고 ① 레더보드 (728×90) ██████████████████ │
├────────────────────────────────────┬─────────────────────────────┤
│  좌측: 스레드 피드 (넓게, ~75%)      │  우측: 사이드바 (sticky, 300px)│
│                                    │                             │
│  ┌ 전체 스레드  [전체][한국어][영어][팔로우🔒] ┐ │  🌅 오늘의 인물              │
│  │                               │ │  ┌ 안중근 🦅 독립운동가      │
│  │ [정조] 수원화성 건설은...        │ │  │ 신사임당 🎨 예술가        │
│  │ 💬 47  5분전                  │ │  └ 유관순 🕊️ 독립운동가     │
│  ├───────────────────────────────┤ │                             │
│  │ [Yi Sun-sin] EN               │ │  🔥 핫한 인물  [일][주][월]  │
│  │ Was the Battle of Myeongnyang...│ │  ① 세종대왕 ▲  왕          │
│  │ 🌐 번역 보기   💬 31  28분전   │ │  ② 이순신   –  장군        │
│  ├───────────────────────────────┤ │  ③ 유관순   ▲  독립운동가   │
│  │ [장보고] 현대에 태어났다면...    │ │  ④ 박정희   ▼  정치인       │
│  │ 💬 88  1시간전                │ │  ⑤ 봉준호   ▲  문화/예능    │
│  ├───────────────────────────────┤ │                             │
│  │ [Sejong the Great] EN         │ │  📢 공지사항                 │
│  │ Why did Sejong create Hangul..│ │                             │
│  │ 🌐 번역 보기   💬 124 2시간전  │ │  ████████████████████████  │
│  ├───────────────────────────────┤ │  ████ 광고 ③ (300×250) ███  │
│  │ [신채호] 역사관이 현대에 주는... │ │  ████████████████████████  │
│  ├───────────────────────────────┤ │                             │
│  │                               │ │  ✍️ 운영진 아티클             │
│  │  ████████████████████████     │ │                             │
│  │  ████ 광고 ② 인라인 ████████  │ │  ✨ 새로 등록된 인물          │
│  │  ████  (300×250)  █████████  │ │  + 인물 추가 요청             │
│  │  ████████████████████████     │ │                             │
│  │                               │ │  ┌ 1,240  8,412 ┐          │
│  │ [박정희] 경제개발 5개년...       │ │  │  인물   스레드│          │
│  │ 💬 156  4시간전               │ │  │ 64.2k  12.8k │          │
│  │ ... 무한스크롤 ↓ ...           │ │  └  댓글    유저┘          │
│  └───────────────────────────────┘ │                             │
└────────────────────────────────────┴─────────────────────────────┘
```

**사이드바 위젯 순서 (위 → 아래)**

| 순서 | 위젯 | 비고 |
|------|------|------|
| 1 | 🌅 오늘의 인물 | 3슬롯 카드 리스트 + 투표 링크 |
| 2 | 🔥 핫한 인물 랭킹 | 일/주/월간 탭, 5위까지 |
| 3 | 📢 공지사항 | 태그 + NEW 배지 |
| 4 | 광고 ③ (300×250) | AdSense 사이드바 슬롯 |
| 5 | ✍️ 운영진 아티클 | 썸네일 + 태그 + 제목 |
| 6 | ✨ 새로 등록된 인물 | 인물 추가 요청 버튼 포함 |
| 7 | 📊 사이트 통계 | 2×2 콤팩트 그리드 |

**스레드 피드 동작 규칙**
- 정렬: 최신순 고정 (Reddit `/new` 탭과 동일, hot/top 없음)
- 언어 필터: `전체` / `한국어` / `영어` / `팔로우` 탭
  - 팔로우 탭: 로그인 유저에게만 노출, 비로그인 시 클릭하면 로그인 유도
  - 팔로우 탭 API: `GET /follows/me/feed` (cursor 페이지네이션)
- 번역 버튼: 감지 언어 ≠ 현재 locale 시 `🌐 번역 보기` 노출 → GPT-4o mini 실시간 번역
- 무한스크롤: IntersectionObserver + cursor 페이지네이션 (20개씩)
- 인물 배지: 각 카드 최상단에 `[인물명]` 필수 표시 — 클릭 시 인물 페이지 이동
- 광고 ②: 피드 **5번째 카드 다음** 인라인 삽입 (300×250)
- 사이드바: `position: sticky; top: 66px` — 피드 스크롤 내내 고정

**오늘의 인물 카드 3종**

| 슬롯 | 선정 방식 | 배지 |
|------|----------|------|
| SLOT 1 | 생일/기일 자동 (없으면 랜덤) | `FEATURED` |
| SLOT 2 | 운영진 직접 지정 | `운영진 선정` |
| SLOT 3 | 유저 추천 투표 1위 | `유저 추천` |

**핫한 인물 랭킹 기준 — Gravity Decay Algorithm**
- 공식: `person_score = Σ (1 + reply_count × 0.5 + like_count) / (age_days + 2)^1.5`
  - `age_days`: 스레드 작성 후 경과 일수
  - `1.5`: gravity exponent (높을수록 빠르게 감소)
  - 분자: 스레드 기본 1점 + 댓글당 0.5점 + 좋아요 1점
- 쿼리 범위: 최근 30일 (gravity decay로 자연 감소하므로 하드컷 불필요)
- 7일 후 점수: day 0 대비 ~10% 수준으로 자연 감소
- 30일 후 점수: 0.01 미만 → 자동 필터링
- 동작 특성:
  - 오늘 스레드 1개 > 7일 전 스레드 3개
  - 인기 오래된 스레드도 최소 점수 유지 (급락 없음)
  - 새 스레드 + 댓글/좋아요 → 즉시 랭킹 반영
- 순위 변동: ▲(상승) / ▼(하락) / –(유지) 표시
- 10위까지 표시

### 7-8. 광고 슬롯 배치 가이드 (Google AdSense)

#### 배치 원칙
- 콘텐츠 섹션 **경계점**에만 삽입 (섹션 내부 흐름 방해 금지)
- 페이지당 최대 3개 슬롯 (AdSense 정책 준수)
- 모바일에서는 레더보드 → 반응형 배너로 자동 전환 (`data-ad-format="auto"`)
- 광고 로드 실패 시 `min-height` 유지하여 레이아웃 깨짐 방지

#### 메인 페이지 광고 슬롯

| 슬롯 | 위치 | 형식 | 크기 |
|------|------|------|------|
| 광고 ① | 슬림 히어로 하단 / 피드 시작 전 | 레더보드 | 728×90 (반응형) |
| 광고 ② | 피드 **5번째 카드 다음** 인라인 | 직사각형 | 300×250 |
| 광고 ③ | 사이드바 — 공지사항 하단 / 아티클 상단 | 사이드바 | 300×250 |

#### 인물 상세 페이지 광고 슬롯

| 슬롯 | 위치 | 형식 | 크기 |
|------|------|------|------|
| 광고 ① | 히어로(기본정보) 하단 / 2단 레이아웃 시작 전 | 레더보드 | 728×90 (반응형) |
| 광고 ② | 스레드 목록 하단 / 타임라인 상단 | 직사각형 | 300×250 |
| 광고 ③ | 사이드바 — 관계도 하단 / 컬렉션 상단 | 사이드바 | 300×250 |

#### 구현 패턴 (Next.js)

```typescript
// components/AdSlot.tsx
'use client';
import Script from 'next/script';
import { useEffect } from 'react';

interface AdSlotProps {
  slot: string;           // AdSense 슬롯 ID
  format?: 'auto' | 'rectangle' | 'leaderboard';
  style?: React.CSSProperties;
}

export function AdSlot({ slot, format = 'auto', style }: AdSlotProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div style={{ minHeight: format === 'leaderboard' ? 90 : 250, ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Phase 2까지는 AdSlot을 주석 처리된 플레이스홀더로 유지
// → 레이아웃 공간 확보 후 AdSense 심사 통과 시 활성화
```

---

## 8. 어드민 페이지

### 대시보드 위젯

```
오늘 조회수 | 주간 신규 가입 | 미처리 요청 수 | 미처리 신고 수
주간 인기 인물 TOP 5 (조회수 증가 기준)
최근 신고 목록 (빠른 처리용)
```

### 인물 관리

- 목록: 이름, 태그, 공개 여부, 조회수, 등록일 + 검색/필터
- 등록/수정 폼: 기본 정보 + 태그 멀티셀렉트 + 타임라인 항목 추가
- CSV 벌크 업로드: 부분 성공 + 에러 리포트 다운로드

### 요청 큐

```
정렬: duplicate_count DESC → created_at ASC
각 행: 요청자, 인물명, 생몰년, 출처, 요청일, 중복 수
버튼: [승인] [반려 (사유 입력 모달)]
승인 시 → 인물 등록 폼으로 자동 이동 (요청 정보 pre-fill)
```

### 신고 처리

```
목록: 신고 유형, 이유, 대상 게시물 미리보기, 신고일
버튼 (원클릭):
  [경고] → warning_logs 기록 + profiles.warning_count++ + 알림 전송
  [게시물 삭제] → soft delete + 알림
  [정지 (X시간)] → is_banned=true, ban_until 설정 + 알림
처리 시 해당 신고 RESOLVED 처리
```

### 회원 관리

```
검색: 닉네임, 이메일
필터: 정지 여부, 경고 수
정지 해제 자동화: Supabase pg_cron — 매 시간 실행
  UPDATE profiles SET is_banned = FALSE, ban_until = NULL
  WHERE ban_until IS NOT NULL AND ban_until < NOW() AND is_banned = TRUE;
```

---

## 9. 인증 및 권한

### Supabase Auth

```typescript
// 소셜 로그인: Google (메인), Apple, Discord, Twitter(X) + 이메일 인증
// → 글로벌 유저 대상, Supabase Auth OAuth 사용

// middleware.ts — 라우트 보호 (Next.js App Router)
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 어드민 라우트: Supabase SSR 세션 확인 → profiles.role === 'ADMIN' 검증
  if (pathname.startsWith('/admin')) {
    // → 비어드민이면 /login으로 redirect
  }

  // API Routes: Authorization 헤더에서 JWT 추출
  // → requireUser() / requireAdmin() 헬퍼로 각 route.ts에서 처리
}
```

### API Route 권한 체크 패턴

```typescript
// lib/auth.ts
export async function requireUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (!user) return null;
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, is_banned')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'ADMIN' || profile?.is_banned) return null;
  return user;
}

// app/api/persons/route.ts 예시
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);
  // ...
}

export async function PUT(request: Request) {
  const user = await requireUser(request);
  if (!user) return apiError('UNAUTHORIZED', 'Login required.', 401);
  // owner 체크: resource.author_id === user.id
}
```

### Supabase RLS (Row Level Security)

```sql
-- 읽기: 모두 허용 (공개 데이터)
-- 쓰기: API Route에서 서버 사이드 검증 후 supabaseAdmin으로 처리
-- → RLS는 직접 클라이언트 접근 방어용 (이중 보호)

-- profiles: 본인만 수정 가능
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
```

### 권한 매트릭스

| 기능 | 비회원 | 일반 회원 | 운영진 |
|------|--------|-----------|--------|
| 페이지 열람 | ✅ | ✅ | ✅ |
| 공개 컬렉션 열람 | ✅ | ✅ | ✅ |
| 스레드/댓글 작성 | ❌ | ✅ | ✅ |
| 사진 업로드 | ❌ | ✅ | ✅ |
| 인물 추가 요청 | ❌ | ✅ | ✅ |
| 관계 제안 | ❌ | ✅ | ✅ |
| 컬렉션 관리 | ❌ | ✅ | ✅ |
| 어드민 패널 | ❌ | ❌ | ✅ |

---

## 10. 검색 및 필터

### PostgreSQL 전문 검색

```sql
-- 인물 검색 (영문/한글/한자 동시, cursor 페이지네이션)
SELECT id, slug, name_en, name_hanja, birth_year, death_year
FROM persons
WHERE
  is_deleted = FALSE AND is_published = TRUE
  AND (
    name_en ILIKE '%' || $1 || '%'
    OR name_ko ILIKE '%' || $1 || '%'
    OR name_hanja % $1
  )
  AND ($cursor IS NULL OR created_at < $cursor)  -- cursor
ORDER BY
  similarity(name_en, $1) DESC,
  view_count DESC
LIMIT $limit + 1;  -- has_next 판단
```

### 필터 파라미터

```
era:   ancient | three-kingdoms | goryeo | joseon | modern
field: king | general | artist | independence-activist | scholar | religious | entrepreneur | politician | sports | entertainer
type:  ALL | PERSON | ARTIFACT | MEDIA | EVENT
sort:  relevance | name_asc | popular | recent
```

---

## 11. 보안

### XSS / SQL Injection 방어

```typescript
// API Route 입력 검증: zod 사용 (NestJS class-validator 대체)
import { z } from 'zod';

const CreateThreadSchema = z.object({
  person_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = CreateThreadSchema.safeParse(body);
  if (!result.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422);
  // ...
}

// 모든 텍스트 입력: DOMPurify 또는 sanitize-html 로 XSS 필터링
// Supabase parameterized query 사용 (raw SQL 금지)
```

### CSRF 보호

```typescript
// Next.js API Routes + Supabase JWT 구조
// JWT가 Authorization 헤더로 전달되므로 CSRF 위험 없음
// 쿠키 기반 세션 사용 시: Next.js middleware에서 SameSite=Strict 설정
```

### 파일 업로드 제한

```
허용 MIME 타입: image/jpeg, image/png, image/webp
최대 파일 크기: 5MB
최대 파일명 길이: 100자
업로드 경로 규칙:
  avatars/{user_id}/{uuid}.webp
  threads/{user_id}/{uuid}.webp
  persons/{person_id}/{uuid}.webp  (어드민만)
Supabase Storage RLS로 경로별 접근 제어
```

---

## 12. SEO 전략

### 정적 생성 (SSG + ISR)

```typescript
// app/person/[slug]/page.tsx
export async function generateStaticParams() {
  // 빌드 타임: Supabase 직접 쿼리 (NestJS API 미사용)
  const persons = await supabaseAdmin
    .from('persons')
    .select('slug')
    .eq('is_published', true)
    .eq('is_deleted', false);
  return persons.data!.map(p => ({ slug: p.slug }));
}

export const revalidate = 86400; // 24시간 ISR
```

### Schema.org 구조화 데이터

```typescript
// 인물 페이지
{
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: person.name_en,
  alternateName: [person.name_hanja].filter(Boolean),
  birthDate: person.birth_year,
  deathDate: person.death_year,
  birthPlace: { '@type': 'Place', name: person.birth_place },
  description: person.summary,
}

// 유물: VisualArtwork
// 미디어: Movie | TVSeries
// 사건: Event
```

### Sitemap

```typescript
// app/sitemap.ts — 전체 인물/노드 slug 기반 동적 사이트맵
// priority: person(0.8) > artifact/media/event(0.6) > list pages(0.5)
// changeFrequency: 인물(weekly), 노드(monthly)
```

---

## 13. 마일스톤 로드맵

> 목표 중심 마일스톤. 1인 개발 기준 추정치.
> **현재 상태**: 서비스 배포 완료 (sillok.net + sillok.kr), M1 핵심 개발 완료.
> **글로벌 피벗**: 주 타겟은 한국에 관심 있는 글로벌 유저. 어드민만 한국어, Public 전체 영어.

---

### Milestone 1 — 씨앗 심기 ✅ 완료
**목표:** 서비스 런칭 + 첫 글로벌 유저 유입
**기간:** 완료
**달성 지표:** 서비스 배포, sillok.net + sillok.kr 도메인 연결

#### 핵심 개발 (완료)
- [x] DB 스키마 전체 마이그레이션
- [x] pg_cron 설정 (view_count 배치 집계, 정지 해제 자동화)
- [x] Next.js API Routes 공통 인프라 (apiError/apiSuccess, requireUser/requireAdmin, zod)
- [x] 인물 CRUD API + CSV 벌크 업로드
- [x] 노드 CRUD API (ARTIFACT, MEDIA, EVENT)
- [x] 스레드 + Reddit식 댓글 API
- [x] 좋아요 / 팔로우 토글 API
- [x] 통합 검색 API (pg_trgm)
- [x] 회원가입/로그인 (이메일 + 구글)
- [x] Next.js 메인 페이지 + 인물 목록/상세 페이지 (SSG + ISR)
- [x] 어드민 패널
- [x] OG 이미지, Sitemap, Schema.org, robots.txt
- [x] 영문화 전환 (Public 전체 영어, URL /person/ 등)

#### 남은 작업 (M1.5 — 런칭 직후)
- [ ] **인물 데이터 최소 100명 입력** (교과서 인물 우선 — King Sejong, Yi Sun-sin 등)
- [ ] Google Search Console 등록 + Sitemap 제출
- [ ] Vercel Analytics 활성화
- [ ] 소셜 채널 개설 (Reddit r/korea, r/AsianHistory 홍보 준비)

---

### Milestone 2 — 뿌리 내리기 (트래픽 + 차별화)
**목표:** 글로벌 SEO 트래픽 확보 + 핵심 차별화 기능 완성
**기간:** M1 이후 약 3개월
**목표 지표:** DAU 500+, 등록 인물 500명+, 구글 검색 유입 시작

#### 핵심 개발
- [ ] **관계도 시각화** (D3.js 미니 + vis-network 전체 탐색, lazy expand) — 가장 강력한 차별점
- [ ] **생애 타임라인 시각화** — 다른 사이트에 없는 기능
- [ ] 유물/K-콘텐츠/사건 노드 상세 페이지 완성
- [ ] 유저 컬렉션 + 공개 컬렉션 탐색
- [ ] 오늘의 인물 생일/기일 자동 선정 cron
- [ ] **Twitter/X 자동 포스팅** — 오늘의 인물 생일/기일 매일 자동 트윗 (영어)
- [ ] `/translate` API — GPT-4o mini 커뮤니티 번역 버튼 (한국어 스레드 → 영어)
- [ ] 인물 랭킹 고도화 (주간/월간 시각화)
- [ ] 기여 배지 시스템 v1

#### 비즈니스 모델
- [ ] **Google AdSense 심사 신청** (트래픽 확보 후 신청, 메인 ×3, 인물 ×3)
- [ ] **Sillok Plus 출시** — $3.99/월 · $35.99/년 (Stripe 단일 결제, 한국 유저용 토스 추가)
  - 광고 제거, 컬렉션 무제한, 관계도 full view
- [ ] 운영진 후원 페이지 (Buy Me a Coffee / Ko-fi)

#### 목표 수익
```
AdSense:      ~$200/월  (DAU 500 기준)
Sillok Plus:  구독자 30명 → ~$120/월
합계 목표:    ~$320/월 (서버비 자급자족)
```

---

### Milestone 3 — 가지 뻗기 (글로벌 확장)
**목표:** 글로벌 K-culture 커뮤니티로 자리잡기 + 수익 다변화
**기간:** M2 이후 약 6개월 (누적 ~12개월)
**목표 지표:** DAU 5,000+, 글로벌 유저 비율 60%+, 월 수익 $2,000+

#### 핵심 개발
- [ ] **공개 API v1 출시** — 인물 기본정보, 관계 데이터 JSON 제공
  - Free: 1,000 req/일 / Starter: $9/월 / Pro: $49/월
- [ ] PWA (오프라인 캐시, 홈 화면 추가)
- [ ] Upstash Redis 캐싱 (인물 상세, 랭킹)
- [ ] 고급 검색 필터 (era + field + relation 조합)
- [ ] 모바일 UX 고도화
- [ ] **Reddit / Twitter 커뮤니티 활성화** — r/korea, r/kdrama, r/AsianHistory 타겟

#### 비즈니스 모델
- [ ] **공개 API 유료화** — K-pop 앱, 역사 게임사, 교육 앱 타겟
- [ ] **글로벌 기관 스폰서십**
  - Korea Foundation, Korean Cultural Centre (런던/뉴욕/시드니)
  - KTO (Korea Tourism Organization) — 해외 관광객 타겟
  - 예상 단가: 카테고리당 월 $300~$1,000
- [ ] **Sillok Plus 연간 구독** 출시 — $35.99/년 (3개월 할인)
- [ ] **어워드 시스템** — $0.50~$2.00 소액 결제 (Stripe)

#### 목표 수익
```
AdSense:          ~$1,500/월
Sillok Plus:      구독자 200명 → ~$800/월
공개 API:         ~$300/월
기관 스폰서십:    ~$500/월 (1~2건)
합계 목표:        ~$3,100/월
```

---

### Milestone 4 — 숲이 되기 (플랫폼화)
**목표:** 한국 역사 영문 데이터의 글로벌 레퍼런스 플랫폼
**기간:** M3 이후 약 12개월 (누적 ~24개월)
**목표 지표:** DAU 30,000+, 월 수익 $30,000+

#### 핵심 개발
- [ ] **React Native 앱** (iOS + Android)
- [ ] **AI 인물 요약** — 스레드/댓글 자동 요약, 논점 정리 카드
- [ ] **교육 모드** — 글로벌 학교/학원 계정, 퀴즈, 학습 진도
- [ ] **인물 비교** 기능
- [ ] **데이터 Export** — 연구자용 CSV/JSON 대용량 다운로드

#### 비즈니스 모델
- [ ] **AI 데이터 라이선싱**
  - 한국 역사 영문 커뮤니티 데이터 (스레드/댓글 + 인물 정보)
  - 잠재 고객: 글로벌 AI 회사 (역사/문화 도메인 RAG), K-content 플랫폼, 게임사
  - 국내: 네이버 HyperCLOVA X, 카카오 KoGPT
  - 목표: 연 $100,000+ 계약
- [ ] **교육기관 B2B** — 미국/영국/호주 한국어/한국문화 학과 타겟
- [ ] **광고 프리미엄화** — AdSense → 직접 판매로 단가 상승
- [ ] **Sillok API Enterprise** — 게임사, 출판사, 방송사 맞춤 계약

#### 목표 수익
```
AdSense + 직판 광고: ~$8,000/월
Sillok Plus:         구독자 3,000명 → ~$12,000/월
공개 API + 라이선싱: ~$6,000/월
교육 B2B:            ~$3,000/월
기관 스폰서십:       ~$2,000/월
합계 목표:           ~$31,000/월
```

---

### 전체 타임라인

```
완료         현재 진행       ~3개월           ~9개월             ~21개월
│            │               │                │                  │
●────────────●───────────────●────────────────●──────────────────●
│            │               │                │                  │
M1 완료       M1.5            M2               M3                 M4
런칭·배포     데이터·SEO준비   트래픽 확보       글로벌 확장         플랫폼화
DAU ?         인물 100명+     DAU 500+         DAU 5,000+         DAU 30,000+
$0            $0              ~$320/월         ~$3,100/월         ~$31,000/월
```



---

## 14. 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # 서버/빌드 전용 (노출 금지)

# 소셜 로그인
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# 파일 업로드
MAX_FILE_SIZE_MB=5

# 광고 (Milestone 2)
NEXT_PUBLIC_ADSENSE_CLIENT=

# 번역 API (Milestone 2)
OPENAI_API_KEY=                      # GPT-4o mini 커뮤니티 번역

# Rate Limit (Milestone 2 — Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# OCI 배치 서버
OCI_BATCH_SERVER_URL=                # http://{OCI_IP}:3100
OCI_BATCH_SECRET=

# 결제 — Stripe 메인 (글로벌), 토스 선택 (한국)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TOSS_SECRET_KEY=                     # 선택

# 앱
NEXT_PUBLIC_APP_URL=https://sillok.net
```

---

## 15. 비즈니스 모델

### 15-1. 수익원 전체 구조

| 수익원 | 적용 시점 | 설명 |
|--------|----------|------|
| Google AdSense | Milestone 2 | 메인 ×3, 인물 ×3 슬롯 |
| Sillok Plus 구독 | **Milestone 2** | $3.99/월 · $35.99/년 (Stripe 메인) |
| 운영진 후원 | Milestone 2 | 1회성 후원 (Ko-fi / Buy Me a Coffee) |
| 어워드 시스템 | Milestone 3 | $0.50~$2.00 소액 결제 (Stripe) |
| 공개 API 유료화 | Milestone 3 | 개발자/교육 앱/게임사 대상 |
| 글로벌 기관 스폰서십 | Milestone 3 | Korea Foundation, KTO 등 해외 기관 |
| 교육기관 B2B | Milestone 4 | 글로벌 한국어·한국문화 학과 타겟 |
| AI 데이터 라이선싱 | Milestone 4 | 글로벌 AI 회사 + 국내 네이버/카카오 |

---

### 15-2. Sillok Plus 구독

#### 요금제

| 플랜 | 금액 | 결제 주기 |
|------|------|----------|
| Monthly | $3.99 (약 5,500원) | 매월 자동결제 |
| Yearly | $35.99 (약 49,500원, 월 환산 $2.99) | 연 1회 — 2개월 무료 |

#### 혜택

```
무료 유저                    Sillok Plus
─────────────────────────────────────────────
광고 노출 (6슬롯)            광고 제거
즐겨찾기 10명               즐겨찾기 무제한
북마크 기본 폴더             북마크 폴더 무제한 생성
관계도 5촌 제한              관계도 전체 탐색 무제한
타임라인 보기                타임라인 PDF Export
-                           프로필 Plus 배지
-                           Milestone 2: 관계도 full view
-                           Milestone 3: 인물 비교 기능 우선 접근
```

#### 결제 구현

```typescript
// Stripe (글로벌) + 토스페이먼츠 (국내) 이중 연동
// 결제 성공 시 subscriptions 테이블에 INSERT
// Supabase Edge Function으로 Webhook 처리
// 만료 전 7일, 1일 이메일 알림 (pg_cron)

// subscriptions 테이블 (4-22)
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status          TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end   TIMESTAMPTZ NOT NULL,
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'toss')),
  provider_subscription_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)  -- 1인 1구독
);

CREATE INDEX subscriptions_status_idx ON subscriptions (status, current_period_end);
```

---

### 15-3. 어워드 시스템

#### 어워드 종류 (MVP 5종)

| 이름 | 아이콘 | 가격 | 설명 |
|------|--------|------|------|
| Verified Fact | 🏅 | $0.50 | Well-researched, historically accurate post |
| Great Writing | ✍️ | $0.50 | Exceptionally well-written thread or comment |
| Mind Blown | 😮 | $0.50 | Surprising insight or unknown fact |
| Debate Starter | 🔥 | $1.00 | Sparked meaningful discussion |
| Sillok's Choice | 🎩 | $2.00 | Most valuable contribution on the platform |

#### 수익 구조

```
어워드 판매가의 70%  →  Sillok 수익
어워드 판매가의 30%  →  결제 수수료 + 운영비
수령자에게는 금전 지급 없음 (배지/명예만 제공)
```

#### 구현

```sql
-- awards 테이블 (4-23)
CREATE TABLE awards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'comment')),
  target_id   UUID NOT NULL,
  award_type  TEXT NOT NULL CHECK (award_type IN ('certification','prose','wow','debate','sillok')),
  amount_usd  NUMERIC(6,2) NOT NULL,  -- 결제 금액 (USD)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX awards_receiver_idx ON awards (receiver_id, created_at DESC);
CREATE INDEX awards_target_idx   ON awards (target_type, target_id);
```

---

### 15-4. 자원봉사 큐레이터 제도

Reddit의 모더레이터 시스템을 Sillok에 맞게 변형. 콘텐츠 품질 관리를 커뮤니티에 분산시켜 1인 운영의 한계를 극복.

#### 큐레이터 역할

| 역할 | 권한 | 배지 |
|------|------|------|
| Era Curator | 해당 시대 인물 편집 요청 승인/반려 | 🏛️ Goryeo Curator |
| Field Curator | 해당 분야 태그 관리, 부적절 스레드 숨김 | ⚔️ Military Curator |
| Global Curator | 영문 콘텐츠 검수, 해외 유저 스레드 모더레이션 | 🌐 EN Curator |

```sql
-- curator_roles 테이블 (4-24)
CREATE TABLE curator_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type   TEXT NOT NULL CHECK (role_type IN ('era', 'field', 'global')),
  role_value  TEXT NOT NULL,  -- ex: 'joseon', 'independence-activist', 'en'
  granted_by  UUID REFERENCES auth.users(id),  -- 어드민 ID
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, role_type, role_value)
);
```

#### 큐레이터 모집 프로세스
```
1. 어드민이 어드민 패널에서 유저 지정
2. 유저에게 "큐레이터 초대" 알림 발송
3. 수락 시 curator_roles INSERT + 프로필 배지 표시
4. 월간 활동 리포트 이메일 발송 (편집 승인 수, 스레드 관리 수)
5. 3개월 비활동 시 어드민이 권한 회수 가능
```

---

### 15-5. 장기 수익원 개요 (Milestone 3~4)

#### 공개 API 요금제 (Milestone 3)

| 티어 | 월 요금 | 일 요청 한도 | 대상 |
|------|--------|------------|------|
| Free | $0 | 1,000건 | 개인 개발자, 학생 |
| Starter | $9/월 | 10,000건 | 스타트업, 소규모 앱 |
| Pro | $49/월 | 100,000건 | 교육 앱, 역사 게임사 |
| Enterprise | 협의 | 무제한 | 방송사, 출판사, 연구기관 |

제공 데이터: 인물 기본정보, 관계 그래프, 타임라인, 노드 연결 정보

#### 기관 스폰서십 구조 (Milestone 3)

```
카테고리 스폰서십:
  - 해당 카테고리 (예: "Independence Activists") 목록/상세 페이지 상단 로고 노출
  - $300~$1,000/월, 3개월 최소 계약
  - 타겟: Korea Foundation (뉴욕/런던), KTO (Korea Tourism Organization),
           Korean Cultural Centre (해외 지부), 각국 주한대사관 문화부

오늘의 인물 스폰서십:
  - SLOT 2 (운영진 선정 슬롯)를 스폰서 인물로 지정
  - K-drama 방영 시즌, 기념일 등 연계 가능
  - $200~$600/월

아티클 스폰서십:
  - 운영진 아티클 하단 "This content is supported by OO" 표시
  - $300~$1,500/건
```

#### AI 데이터 라이선싱 전략 (Milestone 4)

```
핵심 자산:
  - 한국 역사 인물에 대한 한국어 스레드/댓글 (고품질 토론 데이터)
  - 정제된 인물 기본정보 + 관계 그래프 구조 데이터
  - 다국어 번역 데이터 (한/영/일)

잠재 고객:
  - 글로벌 AI 회사 (역사/문화 도메인 RAG 시스템 구축사)
  - K-content 플랫폼 (Webtoon, Kakao Entertainment 글로벌)
  - 역사 교육 에듀테크 스타트업 (미국/영국/호주)
  - 국내: 네이버 HyperCLOVA X, 카카오 KoGPT (한국어 파인튜닝)

준비 사항 (지금부터):
  - DB 스키마를 처음부터 라이선싱 염두에 두고 설계 (완료)
  - 스팸/어뷰징 데이터 필터링 파이프라인 설계
  - 이용약관에 데이터 활용 관련 조항 명시
  - 향후 "연구자용 데이터 요청" 폼 노출
```

**권장:** 출처 기반 정보 공유, 건설적 토론, 오류 정정 요청
**금지:** 근거 없는 비방/욕설, 사생활 침해, 역사 왜곡, 저작권 침해, 스팸
**논란 인물:** 단정적 가치 판단 지양, 다양한 시각 전제, 출처 없는 주장 삭제 가능
**제재:** 경고 → 게시물 삭제 → 계정 정지 (심각한 위반 시 즉시 정지)
