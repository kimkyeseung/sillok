# Sillok — 한국 인물·문화 아카이브 플랫폼 SPEC

> **버전:** 2.3 (문화·음식·스포츠 TOPIC 노드 확장 반영)
> **작성 목적:** Claude Code 기반 자동 개발을 위한 전체 명세서
> **기술 스택:** Next.js 14 (App Router) + Supabase + Vercel

### v2.2 → v2.3 변경 사항

- **서비스 범위 확장**: 한국 인물 아카이브 → 한국 인물·문화 지식 그래프. 인물 중심성은 유지하되 음식·문화·스포츠 주제도 노드로 수록
- **TOPIC 노드 타입 추가**: 김치, 불고기, 한복, 판소리, 한국축구, 한국야구 등 비인물 주제 지원
- **TOPIC 분류 정책 추가**: `metadata.category`로 `food`, `culture`, `sport`, `music`, `literature`, `custom` 구분
- **노드 간 연결 테이블 추가 예정**: `node_links`로 TOPIC ↔ EVENT/GROUP/MEDIA/ARTIFACT/TOPIC 연결 지원
- **컬렉션 확장**: 컬렉션 아이템이 인물뿐 아니라 노드도 담을 수 있도록 스키마 확장
- **Explore 허브 재정의**: Artifacts, Events, Media, Groups에 Topics 섹션 추가
- **M1.5/M2 로드맵 보강**: 문화·음식·스포츠 TOPIC 데이터 모델, 어드민 입력, 초기 시드 데이터 작업 추가

### v2.1 → v2.2 변경 사항

- **폴더 구조 실제 반영**: 모노레포(`apps/web/`) 구조 → 플랫 구조 (`app/`, `components/`, `lib/`) 로 수정
- **GROUP 노드 타입 추가**: 노드 4종 → 5종 (ARTIFACT, MEDIA, EVENT, GROUP). K-pop 그룹 등 현대 문화 엔티티 지원
- **관계 타입 3종 추가**: MEMBER_OF (멤버/소속), FOUNDED (창업/창설), AFFILIATED (느슨한 연관, 양방향)
- **Age Flow 기능 추가** (섹션 7-9): 시대 흐름 인터랙티브 타임라인 시각화. 8개 전용 컴포넌트 + useAgeFlow 훅
- **tags 테이블 스키마 변경**: `name` 단일 → `name_ko` + `name_en` 이중 컬럼
- **articles.tag 실제 DB 반영**: DB에 한글 태그 사용 (`기획`, `특집`, `인물탐구`, `현대`, `공지`, `안내`)
- **좋아요/조회 대상 확장**: likes·view_logs에 `article` 타입 추가
- **신고 대상 확장**: ReportTargetType에 `person` 추가
- **person_requests 스키마 수정**: `name_en` 필드 미존재 → `name_ko` 필수로 수정
- **awards 금액 단위**: `amount_usd NUMERIC` → `amount_krw INTEGER` (원화)
- **번역 테이블 존속**: `person_translations`, `person_timeline_translations` DB에 존재 (v2.0 삭제 선언과 불일치 — 실제로는 아직 사용 중)
- **네비게이션 전면 수정**: Home | Figures | Age Flow | Explore | Threads | Articles
- **홈페이지 레이아웃 전면 수정**: Latest Articles + Recent Threads + Recently Added Figures 사이드바
- **소셜 로그인 축소**: Google + Discord만 (Apple, Twitter 미구현)
- **도메인 정리**: 기본 도메인 sillok.kr 확정
- **어드민 페이지 대폭 확장**: Articles CRUD, Curators, Groups, Threads, Timelines 관리 추가
- **API Routes 대폭 확장**: AI persons, article like/view, thread view, admin curators/groups/threads/timelines 등
- **PaginatedResponse 스키마 변경**: `data` → `items` 필드명
- **lib 파일 정리 반영**: supabase-browser.ts, fetcher.ts, hooks/, jsonld.ts, notifications.ts, person-utils.ts, upload.ts 추가

### v2.0 → v2.1 변경 사항
- URL 경로 영문화, 태그/에러메시지 영문화, 글로벌 피벗 반영, 마일스톤 재조정
- 소셜 로그인: 카카오 제거, video_url 허용 도메인: 네이버TV → Vimeo 교체

### v1.9 → v2.0 변경 사항
- 영문화 전환: Public 페이지/API에서 `name_en` 표시, i18n locale 라우팅 제거, 영문 단일 사이트
- SEO 구현: robots.txt, sitemap.xml, JSON-LD, OG/Twitter 메타태그

### v1.8 → v1.9 변경 사항
- NestJS 별도 서버 제거 → Next.js App Router API Routes 통합
- Railway 제거 → Vercel 단일 배포 ($0)

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
BoardGameGeek(BGG)의 구조를 벤치마크하여, **한국의 이름있는 인물**을 핵심 노드로 삼고 유물·K-콘텐츠·사건·그룹·음식·문화·스포츠 주제가 연결되는 그래프형 한국 지식 아카이브 플랫폼.

- 단군 시대부터 현재 대한민국의 살아있는 인물까지 수록
- 김치, 불고기, 한복, 판소리, 한국축구, 한국야구처럼 인물만으로 설명되지 않는 한국 문화 주제도 수록
- 논란 있는 인물(친일파, 독재자 등)도 포함하되 **기본 정보만 제공**
- 운영진이 기본 뼈대를 관리하고, 유저가 커뮤니티 콘텐츠를 쌓는 구조
- **운영 도메인**: sillok.kr

### 노드 타입 (6종)

| 타입 | 설명 | 인터랙션 |
|------|------|----------|
| `PERSON` | 인물 (핵심 노드) | 스레드 (Reddit식) |
| `ARTIFACT` | 유물/문화재 | 댓글만 (독립) |
| `MEDIA` | K-영화/드라마/도서/회화 | 댓글만 (독립) |
| `EVENT` | 역사적 사건/업적 | 댓글만 (독립) |
| `GROUP` | K-pop 그룹/현대 문화 엔티티 | 댓글만 (독립) |
| `TOPIC` | 음식·문화·스포츠·개념 주제 (김치, 불고기, 한국축구 등) | 댓글만 (독립) |

#### TOPIC 설계 원칙

- `TOPIC`은 인물 중심 아카이브를 보완하는 지식 노드이며, 인물보다 상위 개념이 아님
- `FOOD`, `SPORT`, `CULTURE`를 별도 `node_type`으로 늘리지 않고 `metadata.category`로 분류
- 대표 예시:
  - food: `kimchi`, `bulgogi`, `bibimbap`
  - culture: `hanbok`, `pansori`, `hangul`, `korean-wave`
  - sport: `korean-football`, `korean-baseball`, `taekwondo`
- TOPIC 상세 페이지는 관련 인물, 관련 사건, 관련 그룹/미디어, 관련 토론을 함께 보여줌

---

## 2. 기술 스택 및 폴더 구조

### 스택

```
Frontend   Next.js 14.2.35 (App Router) + Tailwind CSS 3.4
API        Next.js API Routes (app/api/**/route.ts)
DB         Supabase (PostgreSQL + Auth + Storage + pg_cron)
검색       PostgreSQL pg_trgm 확장
시각화     Age Flow (커스텀 시대 흐름 타임라인)
배포       Vercel (FE + API 통합) — $0
CSR 상태   SWR 2.2
검증       zod 3.24
마크다운   react-markdown 10 + remark-gfm 4
이미지     react-easy-crop (크롭), sharp (최적화)
테스트     vitest 4 + @testing-library/react 16
분석       @vercel/analytics
```

### 인프라 구성

```
┌──────────────────────────────────────────────────────┐
│                      Vercel                          │
│  Next.js App Router                                  │
│  ├── app/(public)/         SSR + SSG + CSR 페이지     │
│  ├── app/(auth)/           로그인 페이지              │
│  ├── app/api/**            API Routes (런타임 핸들러) │
│  └── app/admin/            어드민 SSR 페이지          │
└────────────────────────┬─────────────────────────────┘
                         │ Supabase JS SDK
┌────────────────────────▼─────────────────────────────┐
│                    Supabase                          │
│  PostgreSQL  Auth  Storage  pg_cron  Realtime        │
└──────────────────────────────────────────────────────┘
```

### 폴더 구조 (플랫 — 모노레포 아님)

```
sillok/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # 메인 홈 (SSR)
│   │   ├── about/page.tsx        # About 페이지
│   │   ├── age-flow/
│   │   │   ├── layout.tsx        # Age Flow 전용 레이아웃
│   │   │   └── page.tsx          # Age Flow 시각화 (CSR)
│   │   ├── articles/
│   │   │   ├── page.tsx          # 아티클 목록
│   │   │   └── [slug]/page.tsx   # 아티클 상세
│   │   ├── artifacts/page.tsx    # 유물 목록
│   │   ├── collections/
│   │   │   ├── page.tsx          # 컬렉션 목록
│   │   │   └── [id]/page.tsx     # 컬렉션 상세
│   │   ├── nodes/
│   │   │   ├── page.tsx          # Explore 허브 (전체 노드 타입별)
│   │   │   └── [slug]/page.tsx   # 노드 상세
│   │   ├── notifications/page.tsx # 알림 목록
│   │   ├── persons/
│   │   │   ├── page.tsx          # 인물 목록 (Figures)
│   │   │   └── [slug]/page.tsx   # 인물 상세 (SSG + ISR)
│   │   ├── privacy/page.tsx      # 개인정보처리방침
│   │   ├── profile/page.tsx      # 내 프로필
│   │   ├── search/page.tsx       # 통합 검색
│   │   ├── terms/page.tsx        # 이용약관
│   │   ├── threads/
│   │   │   ├── page.tsx          # 스레드 목록
│   │   │   ├── new/page.tsx      # 스레드 작성
│   │   │   └── [id]/page.tsx     # 스레드 상세
│   │   └── layout.tsx            # Public 공통 레이아웃
│   ├── (auth)/
│   │   ├── login/page.tsx        # 로그인
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── page.tsx              # 대시보드
│   │   ├── articles/
│   │   │   ├── page.tsx          # 아티클 관리
│   │   │   ├── new/page.tsx      # 아티클 작성
│   │   │   └── [slug]/edit/page.tsx # 아티클 수정
│   │   ├── curators/page.tsx     # 큐레이터 관리
│   │   ├── groups/page.tsx       # 그룹 관리
│   │   ├── members/page.tsx      # 회원 관리
│   │   ├── nodes/page.tsx        # 노드 관리
│   │   ├── person-requests/page.tsx # 인물 추가 요청 큐
│   │   ├── persons/
│   │   │   ├── page.tsx          # 인물 관리
│   │   │   ├── new/page.tsx      # 인물 등록
│   │   │   └── [slug]/edit/page.tsx # 인물 수정
│   │   ├── relations/page.tsx    # 관계 제안 큐
│   │   ├── reports/page.tsx      # 신고 처리
│   │   ├── tags/page.tsx         # 태그 관리
│   │   ├── threads/page.tsx      # 스레드 관리 (어드민)
│   │   ├── timelines/page.tsx    # 타임라인 관리
│   │   ├── api-docs/page.tsx     # API 문서
│   │   └── layout.tsx
│   ├── api/                      # API Routes → 섹션 5 참조
│   ├── layout.tsx                # Root 레이아웃
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── admin/                    # AdminForm 컴포넌트
│   │   ├── ArticleForm.tsx
│   │   ├── BulkUploadForm.tsx
│   │   ├── ImageCropModal.tsx
│   │   └── PersonForm.tsx
│   ├── age-flow/                 # Age Flow 전용 (8개 + 훅)
│   │   ├── ArtifactTimeline.tsx  # 유물 타임라인 오버레이
│   │   ├── DensityBar.tsx        # 인물 밀도 시각화 바
│   │   ├── EraFilter.tsx         # 시대 필터
│   │   ├── EventMarker.tsx       # 사건 마커 dot
│   │   ├── PersonCard.tsx        # 타임라인 인물 카드
│   │   ├── PersonHoverPanel.tsx  # 인물 호버 상세 패널
│   │   ├── RelationLines.tsx     # 관계 연결선
│   │   ├── TimelinePanel.tsx     # 사이드바 연도별 패널
│   │   └── useAgeFlow.ts         # 핵심 훅 (데이터 로드, 스크롤 로직)
│   ├── article/
│   │   └── ...
│   ├── auth/
│   │   └── ...
│   ├── collection/
│   │   └── ...
│   ├── common/
│   │   ├── Footer.tsx
│   │   ├── Header.tsx            # 상단 네비게이션 (NAV_ITEMS 6개)
│   │   ├── ImageUpload.tsx
│   │   ├── Modal.tsx
│   │   ├── Pagination.tsx
│   │   ├── PersonAvatar.tsx      # FIELD 태그별 배경색·아이콘 분기
│   │   └── Toast.tsx
│   ├── nodes/
│   │   └── ExploreNodesClient.tsx # Explore 허브 클라이언트
│   ├── notification/
│   ├── person/
│   │   ├── FollowButton.tsx
│   │   ├── VoteTodayButton.tsx
│   │   ├── RelationSuggestForm.tsx
│   │   ├── PersonRequestButton.tsx
│   │   └── PersonPicker.tsx      # 인물 멀티셀렉트 자동완성
│   ├── profile/
│   ├── ranking/
│   ├── search/
│   └── thread/
│       ├── LikeButton.tsx
│       ├── NodeCommentForm.tsx
│       ├── NodeInteractions.tsx
│       ├── RecentThreadsFeed.tsx
│       ├── ReplyForm.tsx
│       ├── ReportButton.tsx
│       ├── ThreadForm.tsx
│       ├── ThreadInteractions.tsx
│       └── ViewLogger.tsx
├── lib/
│   ├── supabase-admin.ts         # 서버 전용 (SERVICE_ROLE_KEY)
│   ├── supabase-server.ts        # SSR 서버 컴포넌트 전용
│   ├── supabase-browser.ts       # 클라이언트 전용
│   ├── auth.ts                   # requireUser / requireAdmin
│   ├── api-helpers.ts            # apiError / apiSuccess
│   ├── fetcher.ts                # SWR용 fetcher
│   ├── hooks/
│   │   └── use-auth.ts           # 인증 컨텍스트 훅
│   ├── jsonld.ts                 # JSON-LD 구조화 데이터
│   ├── notifications.ts          # 알림 생성 헬퍼
│   ├── person-utils.ts           # 인물 유틸 (getPrimaryFieldTag 등)
│   ├── rate-limit.ts             # Rate limit 헬퍼
│   ├── types.ts                  # 공유 타입 (NodeType, RelationType 등)
│   └── upload.ts                 # 파일 업로드 유틸
├── db/
│   └── schema.sql                # 전체 DB 스키마 (현행 29개 + v2.3 node_links 예정)
├── public/
│   └── logo.png
└── package.json
```

**Supabase 클라이언트 사용 규칙:**
- SSG/Server Component → `supabaseAdmin` 또는 `supabaseServer`
- API Route (인증/쓰기) → `supabaseAdmin`
- Client Component → `fetch('/api/...')` + SWR (직접 Supabase 접근 금지)
- 클라이언트 Auth 상태 → `supabase-browser.ts` + `use-auth.ts` 훅

---

## 3. 공통 규칙

### 3-1. Slug 전략

**확정 정책: 영문 slug 사용 (한글 URL 사용 안 함)**

```typescript
// 예시
// ✅ /persons/sejong-daewang
// ✅ /nodes/hunminjeongeum
// ❌ /인물/세종대왕

// slug 생성 규칙
// 1. 이름 한글 → 로마자 변환 (romanization: 국립국어원 표준)
// 2. 소문자 + 하이픈 구분
// 3. 동명이인: 뒤에 생년 추가 (ex: kim-cheol-su-1945)
// 4. DB unique 제약으로 중복 방지
```

### 3-2. Cursor 기반 페이지네이션

**확정 정책: 모든 목록 API는 Cursor 방식 사용**

```typescript
// 요청
interface CursorPaginationQuery {
  limit: number;    // 기본값 20, 최대 100
  cursor?: string;  // 마지막 아이템의 created_at ISO 문자열 (없으면 첫 페이지)
}

// 응답
interface PaginatedResponse<T> {
  items: T[];           // ※ 'data'가 아닌 'items' 사용
  has_next: boolean;
  next_cursor: string | null;
}

// SQL 패턴
// WHERE created_at < :cursor ORDER BY created_at DESC LIMIT :limit + 1
// limit+1 조회 후 has_next 판단, 실제 반환은 limit개
```

### 3-3. 공통 에러 응답 포맷

```typescript
// 모든 에러 응답은 아래 형식으로 통일 (API Route 공통 헬퍼 함수로 처리)
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;       // ex: "PERSON_NOT_FOUND", "UNAUTHORIZED"
    message: string;    // Human-readable message (English)
    details?: unknown;  // 추가 정보 (validation 에러 배열 등)
  };
}

// 성공 응답
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

### 3-4. API 호출 전략

```typescript
// ┌──────────────────────────────────────────────────────────┐
// │ 빌드 타임 SSG      → supabaseAdmin 직접 쿼리              │
// │ Server Component   → supabaseServer 직접 쿼리 (SSR)       │
// │ API Route          → supabaseAdmin (인증/쓰기 요청 처리)   │
// │ Client Component   → fetch('/api/...') + SWR             │
// │ Client Auth        → supabase-browser + use-auth 훅       │
// └──────────────────────────────────────────────────────────┘

// lib/api-helpers.ts
export function apiError(code: string, message: string, status = 400) {
  return Response.json({ success: false, error: { code, message } }, { status });
}
export function apiSuccess<T>(data: T) {
  return Response.json({ success: true, data });
}
```

### 3-5. Rate Limiting

```typescript
// lib/rate-limit.ts — in-memory 기반 (MVP)
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
-- 실제 DELETE는 어드민이 명시적으로 hard delete 요청할 때만 허용
-- 기본 조회 쿼리는 항상 WHERE is_deleted = FALSE 포함
```

### 3-7. 영문화 전략

#### 기본 방향 — 영문 단일 사이트
- **사이트 기본 언어**: 영어 (locale 라우팅 없음, 단일 URL 구조)
- **정적 콘텐츠**: `persons` 테이블에 직접 영문 저장 (`name_en`, `summary`, `birth_place`)
- **커뮤니티(스레드/댓글)**: 다국어 혼용 허용, 별도 번역 없음
- **검색**: `name_en` + `name_ko` + `name_hanja` 동시 검색 지원
- **번역 테이블**: `person_translations`, `node_translations`, `person_timeline_translations` DB에 존재 (향후 다국어 확장용)
- **어드민 페이지**: 한국어 인터페이스 유지

---

## 4. 데이터베이스 스키마

> Supabase(PostgreSQL) 기준. 현행 29개 테이블 + v2.3 `node_links` 추가 예정. 모든 테이블에 `created_at`, `updated_at` 포함.

### 4-1. 인물 (persons)

```sql
CREATE TABLE persons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  name_ko          TEXT NOT NULL,
  name_hanja       TEXT,
  name_en          TEXT,
  birth_year       INTEGER,
  birth_date       TEXT,                        -- MM-DD
  death_year       INTEGER,
  death_date       TEXT,                        -- MM-DD
  birth_place      TEXT,
  summary          TEXT,
  thumbnail        TEXT,                        -- Supabase Storage URL
  is_controversial BOOLEAN DEFAULT FALSE,
  is_alive         BOOLEAN DEFAULT FALSE,
  is_published     BOOLEAN DEFAULT FALSE,
  is_deleted       BOOLEAN DEFAULT FALSE,
  view_count       INTEGER DEFAULT 0,
  follow_count     INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX persons_name_ko_trgm    ON persons USING gin(name_ko gin_trgm_ops);
CREATE INDEX persons_name_hanja_trgm ON persons USING gin(name_hanja gin_trgm_ops);
CREATE INDEX persons_birth_year_idx  ON persons (birth_year);
CREATE INDEX persons_is_published_idx ON persons (is_published) WHERE is_deleted = FALSE;
CREATE INDEX persons_birth_date_idx  ON persons (birth_date);
CREATE INDEX persons_death_date_idx  ON persons (death_date);
```

### 4-2. 태그 (tags / person_tags)

```sql
CREATE TABLE tags (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ko  TEXT UNIQUE NOT NULL,              -- 한글 태그명 (ex: 왕, 장군)
  name_en  TEXT,                              -- 영문 태그명 (ex: king, general)
  type     TEXT NOT NULL CHECK (type IN ('ERA', 'FIELD', 'CUSTOM'))
  -- ERA:   고대 | 삼국 | 고려 | 조선 | 근현대
  -- FIELD: 왕 | 장군 | 예술가 | 독립운동가 | 학자
  --        정치인 | 스포츠 | 문화/예능 | 기업인 | 종교인
);

CREATE TABLE person_tags (
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  tag_id    UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, tag_id)
);
```

### 4-3. 노드 (nodes)

```sql
CREATE TABLE nodes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  node_type    TEXT NOT NULL CHECK (node_type IN ('ARTIFACT', 'MEDIA', 'EVENT', 'GROUP', 'TOPIC')),
  title        TEXT NOT NULL,
  description  TEXT,
  thumbnail    TEXT,
  metadata     JSONB,
  -- ARTIFACT: { "designation": "국보 제70호", "location": "국립중앙박물관" }
  -- MEDIA:    { "year": 2023, "genre": "드라마", "platform": "Netflix" }
  -- EVENT:    { "start_year": 1919, "end_year": 1919, "location": "전국" }
  -- GROUP:    { "members": [...], "debut_year": 2016, "genre": "K-pop" }
  -- TOPIC:    { "category": "food|culture|sport|music|literature|custom",
  --             "origin_period": "Joseon", "aliases": ["Kimchi", "Gimchi"] }
  is_published BOOLEAN DEFAULT FALSE,
  is_deleted   BOOLEAN DEFAULT FALSE,
  view_count   INTEGER DEFAULT 0,
  follow_count INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
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
```

`link_type` 권장값:

| 값 | 의미 | 예시 |
|----|------|------|
| `ASSOCIATED_WITH` | 느슨한 관련 | 손흥민 ↔ 한국축구 |
| `REPRESENTS` | 대표 인물/상징 | 박지성 ↔ 한국축구 |
| `POPULARIZED` | 대중화 기여 | 현대 셰프/연구자 ↔ 김치 |
| `CREATED_BY` | 창작/창설 | 창작자 ↔ 미디어/그룹 |
| `PARTICIPATED_IN` | 사건 참여 | 선수/감독 ↔ 2002 FIFA World Cup |
| `FEATURED_IN` | 작품/미디어 등장 | 인물 ↔ 영화/드라마 |

### 4-4-1. 노드 간 연결 (node_links)

> v2.3 추가 예정. TOPIC 확장 이후 노드끼리의 관계를 표현하기 위한 테이블.

```sql
CREATE TABLE node_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  to_node_id   UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  link_type    TEXT NOT NULL CHECK (link_type IN (
    'RELATED_TO',      -- 느슨한 관련 (양방향)
    'PART_OF',         -- 포함 관계 (단방향)
    'ORIGINATED_IN',   -- 기원/발생 배경 (단방향)
    'INFLUENCED_BY',   -- 영향 관계 (단방향)
    'REPRESENTED_BY',  -- 대표 사건/미디어/그룹 (단방향)
    'ASSOCIATED_WITH'  -- 운영진 판단의 일반 연관 (양방향)
  )),
  description TEXT,
  source_url  TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (from_node_id, to_node_id, link_type)
);
```

노드 간 연결 예시:

| from | link_type | to |
|------|-----------|----|
| `kimchi` | `PART_OF` | `korean-cuisine` |
| `bulgogi` | `PART_OF` | `korean-cuisine` |
| `korean-football` | `REPRESENTED_BY` | `2002-fifa-world-cup` |
| `korean-baseball` | `REPRESENTED_BY` | `kbo-league` |
| `hanbok` | `ASSOCIATED_WITH` | `joseon` |

### 4-5. 인물 간 관계 (person_relations)

```sql
CREATE TYPE relation_type AS ENUM (
  'FAMILY',        -- 가족/혈연 (양방향)
  'TEACHER',       -- 스승/제자 (단방향: from=스승, to=제자)
  'ALLY',          -- 협력자/동지 (양방향)
  'RIVAL',         -- 대립/적대 (양방향)
  'LORD_VASSAL',   -- 군신 관계 (단방향: from=왕, to=신하)
  'INFLUENCE',     -- 영향 (단방향: from=영향을 준 사람, to=받은 사람)
  'MEMBER_OF',     -- 멤버/소속 (단방향: from=멤버, to=그룹 대표 인물)
  'FOUNDED',       -- 창업/창설 (단방향: from=창업자, to=조직 대표 인물)
  'AFFILIATED'     -- 느슨한 연관 (양방향: 고문, 파트너 등)
);

CREATE TABLE person_relations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  to_person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  relation_type  relation_type NOT NULL,
  description    TEXT,
  source_url     TEXT,
  is_approved    BOOLEAN DEFAULT FALSE,
  suggested_by   UUID REFERENCES auth.users(id),
  approved_by    UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (from_person_id, to_person_id, relation_type)
);

-- 양방향 관계 처리 규칙
-- FAMILY, ALLY, RIVAL, AFFILIATED: 단방향으로 1건만 저장, 쿼리 시 OR 조건 사용
-- TEACHER, LORD_VASSAL, INFLUENCE, MEMBER_OF, FOUNDED: 단방향 저장, from→to 방향이 의미를 가짐

-- 양방향 포함 헬퍼 함수
CREATE OR REPLACE FUNCTION get_person_relations(p_id UUID)
RETURNS TABLE (
  relation_id     UUID,
  other_person_id UUID,
  rel_type        relation_type,
  direction       TEXT,
  rel_description TEXT
) AS $$
  SELECT id, to_person_id, relation_type,
    CASE WHEN relation_type IN ('FAMILY','ALLY','RIVAL','AFFILIATED') THEN 'both' ELSE 'outgoing' END,
    description
  FROM person_relations
  WHERE from_person_id = p_id AND is_approved = TRUE
  UNION ALL
  SELECT id, from_person_id, relation_type,
    CASE WHEN relation_type IN ('FAMILY','ALLY','RIVAL','AFFILIATED') THEN 'both' ELSE 'incoming' END,
    description
  FROM person_relations
  WHERE to_person_id = p_id AND is_approved = TRUE
    AND relation_type NOT IN ('FAMILY','ALLY','RIVAL','AFFILIATED')
$$ LANGUAGE sql;
```

### 4-6. 스레드 (threads)

```sql
CREATE TABLE threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES profiles(id),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  video_url   TEXT,                    -- YouTube/Vimeo URL (선택)
  is_pinned   BOOLEAN DEFAULT FALSE,
  is_deleted  BOOLEAN DEFAULT FALSE,
  view_count  INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,       -- 트리거로 동기화
  like_count  INTEGER DEFAULT 0,       -- 트리거로 동기화
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4-7. 스레드 댓글 (thread_replies)

```sql
CREATE TABLE thread_replies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES thread_replies(id) ON DELETE SET NULL,
  author_id  UUID REFERENCES profiles(id),
  content    TEXT NOT NULL,
  depth      INTEGER NOT NULL DEFAULT 0,  -- 트리거로 자동 계산
  like_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4-8. 스레드 이미지 (thread_images)

```sql
CREATE TABLE thread_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT max_images_per_thread CHECK (sort_order BETWEEN 0 AND 2)
);
-- 스레드당 최대 3장, 댓글(replies)에는 이미지 첨부 없음
```

### 4-9. 노드 댓글 (node_comments)

```sql
CREATE TABLE node_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id    UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES profiles(id),
  content    TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4-10. 조회 로그 (view_logs)

```sql
CREATE TABLE view_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('PERSON', 'NODE', 'THREAD', 'ARTICLE')),
  target_id   UUID NOT NULL,
  viewer_ip   TEXT,
  viewed_at   TIMESTAMPTZ DEFAULT NOW()
);
-- 배치 집계 (5분 간격 cron) → persons/nodes/threads/articles의 view_count 갱신
```

### 4-11. 인물 타임라인 (person_timeline)

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
```

### 4-12. 인물 추가 요청 (person_requests)

```sql
CREATE TABLE person_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID REFERENCES profiles(id),
  name_ko         TEXT NOT NULL,               -- 한글 이름 (필수)
  birth_year      INTEGER,
  death_year      INTEGER,
  reason          TEXT NOT NULL,
  source_url      TEXT NOT NULL,
  status          TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_note      TEXT,
  duplicate_count INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4-13. 신고 (reports)

```sql
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('THREAD', 'THREAD_REPLY', 'NODE_COMMENT')),
  target_id   UUID NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
  resolved_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (reporter_id, target_type, target_id)
);
```

> **Note:** `lib/types.ts`의 `ReportTargetType`은 `'thread' | 'reply' | 'node_comment' | 'person'` 으로 person 타입도 포함.

### 4-14. 컬렉션 (collections / collection_items)

```sql
CREATE TABLE collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  title       TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN DEFAULT TRUE,
  item_count  INTEGER DEFAULT 0,      -- 트리거로 관리
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  person_id     UUID REFERENCES persons(id) ON DELETE CASCADE,
  node_id       UUID REFERENCES nodes(id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (person_id IS NOT NULL AND node_id IS NULL)
    OR (person_id IS NULL AND node_id IS NOT NULL)
  ),
  UNIQUE (collection_id, person_id),
  UNIQUE (collection_id, node_id)
);
```

컬렉션은 인물 중심 큐레이션을 기본으로 하되, TOPIC 확장 이후에는 노드도 함께 담을 수 있다.
예: `Korean Cuisine Essentials` 컬렉션에 김치·불고기·비빔밥 TOPIC과 관련 인물/사건을 함께 수록.

### 4-15. 알림 (notifications)

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
    'THREAD_REPLY', 'REPLY_REPLY', 'THREAD_LIKED',
    'FOLLOW_UPDATE', 'REQUEST_APPROVED', 'REQUEST_REJECTED',
    'RELATION_APPROVED', 'RELATION_REJECTED', 'WARNING'
  )),
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  source_id   UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4-16. 유저 프로필 (profiles)

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname      TEXT UNIQUE,
  avatar_url    TEXT,
  role          TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  is_banned     BOOLEAN DEFAULT FALSE,
  ban_until     TIMESTAMPTZ,
  warning_count INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
-- auth.users INSERT 시 handle_new_user() 트리거로 자동 생성
```

### 4-17. 경고 이력 (warning_logs)

```sql
CREATE TABLE warning_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id    UUID REFERENCES auth.users(id),
  reason      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4-18. 운영진 아티클 (articles)

```sql
CREATE TABLE articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,              -- 마크다운
  summary      TEXT,
  thumbnail    TEXT,
  tag          TEXT NOT NULL CHECK (tag IN ('기획', '특집', '인물탐구', '현대', '공지', '안내')),
  is_notice    BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  is_deleted   BOOLEAN DEFAULT FALSE,
  author_id    UUID REFERENCES auth.users(id),
  view_count   INTEGER DEFAULT 0,
  like_count   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 4-19. 오늘의 인물 투표 (person_of_day_votes)

```sql
CREATE TABLE person_of_day_votes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  vote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, vote_date)
);
```

### 4-20. 번역 테이블 (person_translations, node_translations, person_timeline_translations)

```sql
-- 인물 번역 (DB에 존재, 향후 다국어 확장용)
CREATE TABLE person_translations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id        UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  locale           TEXT NOT NULL CHECK (locale IN ('en', 'ja')),
  summary          TEXT,
  birth_place      TEXT,
  is_ai_translated BOOLEAN DEFAULT TRUE,
  UNIQUE (person_id, locale)
);

-- 노드 번역
CREATE TABLE node_translations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id          UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  locale           TEXT NOT NULL CHECK (locale IN ('en', 'ja')),
  title            TEXT,
  description      TEXT,
  is_ai_translated BOOLEAN DEFAULT TRUE,
  UNIQUE (node_id, locale)
);

-- 타임라인 번역
CREATE TABLE person_timeline_translations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id      UUID NOT NULL REFERENCES person_timeline(id) ON DELETE CASCADE,
  locale           TEXT NOT NULL CHECK (locale IN ('en', 'ja')),
  title            TEXT,
  description      TEXT,
  is_ai_translated BOOLEAN DEFAULT TRUE,
  UNIQUE (timeline_id, locale)
);
```

### 4-21. 좋아요 (likes)

```sql
CREATE TABLE likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'reply', 'node_comment', 'article')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);
-- 트리거로 threads/thread_replies/node_comments/articles의 like_count 동기화
```

### 4-22. 팔로우 (follows)

```sql
CREATE TABLE follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('person', 'node')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);
-- 트리거로 persons/nodes의 follow_count 동기화
-- 유저 간 팔로우는 의도적으로 미포함
```

### 4-23. 구독 (subscriptions)

```sql
CREATE TABLE subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                     TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status                   TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
  current_period_start     TIMESTAMPTZ NOT NULL,
  current_period_end       TIMESTAMPTZ NOT NULL,
  payment_provider         TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'toss')),
  provider_subscription_id TEXT,
  UNIQUE (user_id)
);
```

### 4-24. 어워드 (awards)

```sql
CREATE TABLE awards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'comment')),
  target_id   UUID NOT NULL,
  award_type  TEXT NOT NULL CHECK (award_type IN ('certification', 'prose', 'wow', 'debate', 'sillok')),
  amount_krw  INTEGER NOT NULL,            -- 결제 금액 (원화)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4-25. 큐레이터 (curator_roles)

```sql
CREATE TABLE curator_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type   TEXT NOT NULL CHECK (role_type IN ('era', 'field', 'global')),
  role_value  TEXT NOT NULL,
  granted_by  UUID REFERENCES auth.users(id),
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, role_type, role_value)
);
```

### DB 트리거 목록

| 트리거 | 대상 | 동작 |
|--------|------|------|
| `update_updated_at()` | 모든 주요 테이블 | BEFORE UPDATE → `updated_at = NOW()` |
| `calc_reply_depth()` | thread_replies | BEFORE INSERT → `depth = parent.depth + 1` |
| `update_thread_reply_count()` | thread_replies | AFTER INSERT/UPDATE → threads.reply_count 동기화 |
| `update_like_count()` | likes | AFTER INSERT/DELETE → 대상 테이블 like_count 동기화 |
| `update_follow_count()` | follows | AFTER INSERT/DELETE → persons/nodes follow_count 동기화 |
| `update_collection_item_count()` | collection_items | AFTER INSERT/DELETE → collections.item_count 동기화 |
| `handle_new_user()` | auth.users | AFTER INSERT → profiles 자동 생성 |

### pg_cron 작업

```sql
-- 1. 정지 해제 자동화 (매 시간)
-- UPDATE profiles SET is_banned = FALSE WHERE ban_until < NOW() AND is_banned = TRUE

-- 2. view_count 배치 집계 (5분마다)
-- persons/nodes/threads/articles의 view_count 갱신

-- 3. 오래된 view_logs 정리 (매일 자정)
-- DELETE FROM view_logs WHERE viewed_at < NOW() - INTERVAL '7 days'
```

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
DELETE /persons/:slug/hard        인물 hard delete [ADMIN]

POST   /persons/:slug/vote-today  오늘의 인물 추천 투표 [USER]
GET    /persons/today-ranking     오늘 투표 현황

POST   /admin/persons             인물 등록 [ADMIN]
GET    /admin/persons             인물 목록 (어드민) [ADMIN]
GET    /admin/persons/all         전체 인물 (필터 없음) [ADMIN]
POST   /admin/persons/bulk        CSV 벌크 등록 [ADMIN]
```

### 5-2. 노드 (Nodes)

```
GET    /nodes                     노드 목록
  Query: limit, cursor, type(ARTIFACT|MEDIA|EVENT|GROUP|TOPIC), category, q

GET    /nodes/:slug               노드 상세
GET    /nodes/:slug/links         연결된 노드 목록
GET    /nodes/:slug/comments      댓글 목록 (cursor 페이지네이션)
POST   /nodes/:slug/comments      댓글 작성 [USER]

POST   /admin/nodes               노드 등록/수정 [ADMIN]
POST   /admin/nodes/:id/links     노드 간 연결 등록/수정 [ADMIN]
```

### 5-3. 관계 (Relations)

```
GET    /persons/:slug/relations   특정 인물의 관계
POST   /relations/suggest         관계 제안 [USER]
PUT    /relations/:id/approve     승인 [ADMIN]
PUT    /relations/:id/reject      반려 [ADMIN]

GET    /admin/relations           관계 목록 (어드민) [ADMIN]
```

### 5-4. 스레드 (Threads)

```
GET    /threads                   스레드 목록 (전체 피드)
GET    /threads/:id               스레드 상세
POST   /threads                   스레드 작성 [USER]
PUT    /threads/:id               스레드 수정 [OWNER]
DELETE /threads/:id               스레드 soft delete [OWNER|ADMIN]

POST   /threads/:id/like          좋아요 토글 [USER]
POST   /threads/:id/view          조회 로그 기록
GET    /threads/:id/replies       댓글 목록 (트리, cursor)
POST   /threads/:id/replies       댓글 작성 [USER]

PUT    /replies/:id               댓글 수정 [OWNER]
DELETE /replies/:id               댓글 soft delete [OWNER|ADMIN]
POST   /replies/:id/like          댓글 좋아요 토글 [USER]

GET    /admin/threads             스레드 목록 (어드민) [ADMIN]
PUT    /admin/threads/:id         스레드 관리 (pin 등) [ADMIN]
```

### 5-5. 노드 댓글 (Node Comments)

```
GET    /nodes/:slug/comments      댓글 목록 (cursor)
POST   /nodes/:slug/comments      댓글 작성 [USER]
PUT    /comments/:id              수정 [OWNER]
DELETE /comments/:id              soft delete [OWNER|ADMIN]
POST   /comments/:id/like         노드 댓글 좋아요 토글 [USER]
```

### 5-6. 아티클 (Articles)

```
GET    /articles                  아티클 목록
  Query: limit, cursor, tag, is_notice

GET    /articles/:slug            아티클 상세
POST   /articles/:slug/like       아티클 좋아요 토글 [USER]
POST   /articles/:slug/view       아티클 조회 로그 기록
```

### 5-7. 팔로우 (Follows)

```
POST   /follows                   팔로우 토글 [USER]
  body: { target_type: 'person'|'node', target_id: UUID }

GET    /follows/me                내가 팔로우한 목록 [USER]
GET    /follows/me/feed           팔로우 피드 [USER]
```

### 5-8. 검색 (Search)

```
GET    /search
  Query: q, type(ALL|PERSON|ARTIFACT|MEDIA|EVENT|GROUP|TOPIC), category, era, field, sort, limit, cursor

GET    /search/suggest
  Query: q
  반환: 타입별 그룹핑, 최대 8개
```

### 5-9. 인물 추가 요청

```
POST   /person-requests           요청 제출 [USER]
  body: { name_ko, birth_year?, death_year?, reason, source_url }

PUT    /person-requests/:id/approve  승인 [ADMIN]
PUT    /person-requests/:id/reject   반려 [ADMIN]
```

### 5-10. 신고

```
POST   /reports                   신고 제출 [USER]
GET    /reports                   신고 목록 [ADMIN]
PUT    /reports/:id/resolve       처리 완료 [ADMIN]
PUT    /reports/:id/dismiss       기각 [ADMIN]
```

### 5-11. 컬렉션

```
GET    /collections               내 컬렉션 목록 [USER]
GET    /collections/:id           컬렉션 상세
POST   /collections               생성 [USER]
PUT    /collections/:id           수정 [OWNER]
DELETE /collections/:id           삭제 [OWNER]
POST   /collections/:id/items     인물/노드 추가 [OWNER]
  body: { person_id?: UUID, node_id?: UUID } // exactly one
DELETE /collections/:id/items     인물/노드 제거 [OWNER]
```

### 5-12. 알림

```
GET    /notifications             내 알림 목록 [USER]
GET    /notifications/unread-count 미읽음 수 [USER] (30초 폴링)
```

### 5-13. 업로드

```
POST   /upload/presigned-url      Presigned URL 발급 [USER]
  body: { file_type, file_size, target: 'avatar'|'thread'|'person' }
  제한: 5MB, image/jpeg|png|webp
```

### 5-14. 랭킹

```
GET    /ranking                   핫한 인물 랭킹 (Gravity Decay)
  Query: tag, limit, cursor
```

### 5-15. 조회 로그

```
POST   /view-logs                 조회 로그 기록
```

### 5-16. 어드민 전용

```
GET    /admin/stats               대시보드 통계 [ADMIN]
GET    /admin/members             회원 목록 [ADMIN]
PUT    /admin/members/:id/ban     정지 [ADMIN]
PUT    /admin/members/:id/unban   정지 해제 [ADMIN]
PUT    /admin/members/:id/warn    경고 [ADMIN]

GET    /admin/tags                태그 목록 [ADMIN]
POST   /admin/tags                태그 생성 [ADMIN]
PUT    /admin/tags/:id            태그 수정 [ADMIN]
DELETE /admin/tags/:id            태그 삭제 [ADMIN]

GET    /admin/curators            큐레이터 목록 [ADMIN]
POST   /admin/curators            큐레이터 지정 [ADMIN]
DELETE /admin/curators/:id        큐레이터 해제 [ADMIN]

GET    /admin/groups              그룹 목록 [ADMIN]
POST   /admin/groups/:id/members  그룹 멤버 관리 [ADMIN]

GET    /admin/timelines           타임라인 목록 [ADMIN]
POST   /admin/timelines           타임라인 생성 [ADMIN]
PUT    /admin/timelines/:id       타임라인 수정 [ADMIN]
DELETE /admin/timelines/:id       타임라인 삭제 [ADMIN]

GET    /admin/api-docs            API 문서 [ADMIN]
```

### 5-17. AI

```
POST   /ai/persons                AI 인물 데이터 생성 [ADMIN]
```

### 5-18. CSV 벌크 업로드 상세

```
POST   /admin/persons/bulk  [ADMIN]
  Content-Type: multipart/form-data
  file: CSV

처리 방식: 부분 성공 허용
  - 각 행 독립적으로 처리 (전체 롤백 없음)
  - 응답: { total, success, failed, errors[] }
```

---

## 6. 페이지 및 라우트 구조

### 6-1. 네비게이션 구조

```
NAV: [Logo] Home | Figures | Age Flow | Explore | Threads | Articles | [Search] | [User Menu]
```

### 6-2. 공개 페이지

| 경로 | 설명 | 렌더링 |
|------|------|--------|
| `/` | Main home (Latest Articles, Recent Threads, New Persons) | SSR (`force-dynamic`) |
| `/persons` | 인물 목록 (Figures) — Trending + 전체 그리드 + 검색 | SSR |
| `/persons/[slug]` | 인물 상세 | SSG + ISR(24h) |
| `/age-flow` | 시대 흐름 인터랙티브 타임라인 | CSR |
| `/nodes` | Explore 허브 (전체 노드 타입별 그리드) | SSR |
| `/nodes/[slug]` | 노드 상세 (유물/미디어/사건/그룹/토픽) | SSR |
| `/artifacts` | 유물 전용 목록 | SSR |
| `/threads` | 스레드 목록 | SSR |
| `/threads/new` | 스레드 작성 | CSR |
| `/threads/[id]` | 스레드 상세 + 댓글 트리 | SSR |
| `/articles` | 아티클 목록 | SSR |
| `/articles/[slug]` | 아티클 상세 | SSG + ISR(1h) |
| `/search` | 통합 검색 결과 | SSR |
| `/collections` | 컬렉션 목록 | SSR |
| `/collections/[id]` | 컬렉션 상세 | SSR |
| `/notifications` | 알림 목록 [로그인 필요] | CSR |
| `/profile` | 내 프로필 [로그인 필요] | CSR |
| `/about` | About Sillok | SSG |
| `/terms` | 이용약관 | SSG |
| `/privacy` | 개인정보처리방침 | SSG |
| `/login` | 로그인 | CSR |

### 6-3. 어드민 페이지 (Admin Guard 적용)

| 경로 | 설명 |
|------|------|
| `/admin` | 대시보드 |
| `/admin/persons` | 인물 관리 |
| `/admin/persons/new` | 인물 등록 |
| `/admin/persons/[slug]/edit` | 인물 수정 |
| `/admin/nodes` | 노드 관리 |
| `/admin/articles` | 아티클 관리 |
| `/admin/articles/new` | 아티클 작성 |
| `/admin/articles/[slug]/edit` | 아티클 수정 |
| `/admin/threads` | 스레드 관리 |
| `/admin/timelines` | 타임라인 관리 |
| `/admin/person-requests` | 인물 추가 요청 큐 |
| `/admin/relations` | 관계 제안 큐 |
| `/admin/reports` | 신고 처리 |
| `/admin/members` | 회원 관리 |
| `/admin/tags` | 태그 관리 |
| `/admin/curators` | 큐레이터 관리 |
| `/admin/groups` | 그룹 관리 |
| `/admin/api-docs` | API 문서 |

---

## 7. 핵심 기능 상세 명세

### 7-1. 홈페이지 레이아웃

```
┌──────────────────────────────────────────────────────────────────┐
│  NAV: SILLOK | Home | Figures | Age Flow | Explore | Threads    │
│       | Articles | [🔍 검색] | [유저 메뉴/로그인]                   │
├──────────────────────────────────────────────────────────────────┤
│  히어로 배너                                                       │
│  "Connecting notable Korean figures from Dangun to the present  │
│   as interconnected nodes."                                      │
│  [👤 175 Figures]  [💬 54 Threads]                               │
├────────────────────────────────────┬─────────────────────────────┤
│  좌측 메인 (~75%)                   │  우측 사이드바 (320px)        │
│                                    │                             │
│  📰 Latest Articles               │  ✨ Recently Added Figures  │
│  ┌ Featured article (큰 카드)      │  인물 카드 리스트 (8명)       │
│  └ 2개 서브 카드 그리드             │                             │
│                                    │  ℹ️ About                  │
│  💬 Recent Threads                │  "A community archive..."   │
│  ┌ 스레드 카드 (썸네일 + 인물배지)  │  [Explore] [Search]          │
│  │ 작성자, 좋아요, 댓글, 시간       │                             │
│  └ 최대 10개                       │                             │
│                                    │                             │
└────────────────────────────────────┴─────────────────────────────┘
│  Footer: Explore | Company | Contact                            │
│  Terms of Service | Privacy Policy | contact@sillok.kr          │
└──────────────────────────────────────────────────────────────────┘
```

**홈 데이터 로드 (SSR, force-dynamic):**
- `newPersons`: 최근 등록 인물 8명 (태그 포함)
- `latestArticles`: 최신 아티클 3건
- `recentThreads`: 최신 스레드 10건 (작성자, 인물, 이미지 포함)
- `stats`: 인물 수, 스레드 수

### 7-2. 인물 목록 페이지 (Figures)

```
┌──────────────────────────────────────────────────┐
│  🔥 Trending Figures (캐러셀)                      │
│  상위 10명 — 최근 활동 가중 랭킹                     │
│  [rank] [썸네일] [이름] [태그] [스레드수] [좋아요수]  │
├──────────────────────────────────────────────────┤
│  All Figures                                      │
│  [🔍 Search by name...]                          │
│  그리드 카드 (썸네일 + 이름 + 한자 + 생몰년)         │
└──────────────────────────────────────────────────┘
```

### 7-3. 인물 상세 페이지 레이아웃

```
┌──────────────────────────────────────────────────────────┐
│  [썸네일]  이름 (한자)                                      │
│           생몰년도 · 출생지                                 │
│           태그: #왕 #조선                                  │
│           [⭐ 컬렉션에 추가] [❤ 팔로우]                     │
│  ⚠️ 논란 인물 배너 (is_controversial=true 시)              │
├──────────────────────┬──────────────────────────────────┤
│  좌측 (메인)          │  우측 사이드바                      │
│                      │                                   │
│  💬 스레드           │  🕸 관계도 (미니, 1촌)              │
│  [새 스레드 작성]     │  [관계 유형 토글]                   │
│  스레드 목록          │                                   │
│                      │  ⭐ 포함된 컬렉션                   │
│  📅 생애 타임라인     │                                   │
│  1397 출생 ── 사망    │                                   │
│                      │                                   │
│  🔗 관련 노드 갤러리   │                                   │
│  (유물·미디어·사건·토픽) │                                 │
└──────────────────────┴──────────────────────────────────┘
```

### 7-4. 스레드 목록 페이지

```
┌──────────────────────────────────────────────┐
│  Threads                                     │
│  "Community discussions about Korean         │
│   historical figures"            [✏️ Write]  │
├──────────────────────────────────────────────┤
│  [썸네일] [인물배지] 스레드 제목              │
│           작성자 · ❤ N · 💬 N · 2d ago      │
│  ... 무한 스크롤 ...                         │
└──────────────────────────────────────────────┘
```

### 7-5. Explore 허브 (/nodes)

```
┌──────────────────────────────────────────────┐
│  Explore  (157 items)                        │
│  [🔍 All] [🏺 Artifacts] [⚔ Events]         │
│  [🎬 Media] [👥 Groups] [🧭 Topics]         │
├──────────────────────────────────────────────┤
│  ⭐ Featured (6개 하이라이트)                 │
├──────────────────────────────────────────────┤
│  🧭 Topics (음식·문화·스포츠) → View All      │
│  Kimchi, Bulgogi, Hanbok, Korean Football    │
│  Korean Baseball, Taekwondo                  │
├──────────────────────────────────────────────┤
│  🏺 Artifacts (47) → View All               │
│  유물 카드 그리드                             │
├──────────────────────────────────────────────┤
│  ⚔ Events (69) → View All                   │
│  사건 카드 그리드                             │
├──────────────────────────────────────────────┤
│  🎬 Media (38) → View All                   │
│  미디어 카드 그리드                           │
├──────────────────────────────────────────────┤
│  👥 Groups (3) → View All                   │
│  그룹 카드 (BLACKPINK, NewJeans, BTS)        │
└──────────────────────────────────────────────┘
```

### 7-5-1. TOPIC 상세 페이지

TOPIC은 음식·문화·스포츠처럼 인물 하나에 종속되지 않는 주제를 다룬다. 단, Sillok의 기본 탐색 축은 여전히 인물이므로 TOPIC 상세는 항상 관련 인물과 사건을 함께 노출한다.

```
┌──────────────────────────────────────────────┐
│  Kimchi                                      │
│  TOPIC · Food                                │
│  "A fermented Korean food..."                │
│  [Follow] [Add to Collection]                │
├──────────────────────────────────────────────┤
│  Overview                                    │
│  기원, 변천, 지역성, 현대적 의미              │
├──────────────────────┬───────────────────────┤
│  Related Figures     │  Related Nodes         │
│  인물 카드 리스트      │  Korean Cuisine        │
│                      │  Joseon Food Culture   │
├──────────────────────┴───────────────────────┤
│  Discussions                                  │
│  노드 댓글 + 관련 스레드                       │
└──────────────────────────────────────────────┘
```

TOPIC 상세 데이터:
- `nodes.metadata.category`: food | culture | sport | music | literature | custom
- `person_node_links`: 관련 인물
- `node_links`: 관련 주제/사건/그룹/미디어
- `node_comments`: TOPIC 자체 댓글
- `view_logs`, `follows`, `collections`: 기존 노드 공통 인터랙션 재사용

### 7-6. 스레드 댓글 렌더링 규칙

```typescript
const MAX_VISUAL_DEPTH = 3;

function renderReply(reply: Reply, visualDepth: number) {
  const indentDepth = Math.min(visualDepth, MAX_VISUAL_DEPTH);
  return (
    <div style={{ marginLeft: indentDepth * 24 }}>
      {visualDepth > MAX_VISUAL_DEPTH && reply.parent && (
        <span className="text-blue-500">@{reply.parent.author.nickname}</span>
      )}
      <ReplyContent reply={reply} />
      <button>Reply</button>
    </div>
  );
}
```

### 7-7. 논란 인물 처리

```typescript
if (person.is_controversial) {
  // 1. 페이지 최상단 배너
  // "⚠️ This figure is considered historically controversial.
  //  Sillok provides factual information only."
  // 2. summary 필드 비워둠 — 기본 정보만 표시
  // 3. 스레드 게시판 상단 안내
}
```

### 7-8. 핫한 인물 랭킹 (Gravity Decay Algorithm)

```
공식: person_score = Σ (1 + reply_count × 0.5 + like_count) / (age_days + 2)^1.5
범위: 최근 30일 스레드 대상
순위 변동: ▲(상승) / ▼(하락) / –(유지) 표시
```

### 7-9. Age Flow — 시대 흐름 시각화

인물의 생존 기간을 시각적으로 표현하는 인터랙티브 타임라인. `/age-flow` 경로.

**구성 컴포넌트 (8개 + 훅):**

| 컴포넌트 | 역할 |
|----------|------|
| `useAgeFlow.ts` | 핵심 훅 — 인물 데이터 로드, 스크롤/줌 로직, 현재 연도 상태 관리 |
| `PersonCard.tsx` | 타임라인 위의 인물 카드 (PersonAvatar 활용, 생존 바) |
| `PersonHoverPanel.tsx` | 인물 호버 시 상세 패널 (요약, 태그, 타임라인) |
| `TimelinePanel.tsx` | 사이드바 — 연도별 컨텍스트 정보 (왕조, 주요 사건) |
| `EraFilter.tsx` | 시대 필터 (고대~근현대) |
| `DensityBar.tsx` | 인물 밀도 시각화 바 (특정 시대에 얼마나 많은 인물이 있는지) |
| `EventMarker.tsx` | 다이얼 바 위 사건 마커 dot |
| `ArtifactTimeline.tsx` | 유물 타임라인 카드 오버레이 |
| `RelationLines.tsx` | 인물 간 관계 연결선 시각화 |

**동작:**
- 전체 인물을 메모리에 로드 (~1,000명 OK, 2,000명 이상 시 구간 로드 전환)
- 스크롤/줌으로 시대를 탐색하며 인물이 나타나고 사라지는 것을 시각적으로 확인
- PersonAvatar의 FIELD 태그별 배경색·아이콘으로 분야 구분
- 사건 마커로 역사적 맥락 제공
- 유물 타임라인으로 문화재와 인물의 시대적 관계 표현

### 7-10. video_url 유효성 검증

```typescript
const ALLOWED_VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'vimeo.com'];
```

### 7-11. OG 이미지 자동 생성

```typescript
// app/persons/[slug]/opengraph-image.tsx
// Next.js ImageResponse 활용
// 인물 이름 + 대표 이미지 + 생몰년 카드 형식 (1200 x 630)
```

---

## 8. 어드민 페이지

### 대시보드 위젯

```
오늘 조회수 | 주간 신규 가입 | 미처리 요청 수 | 미처리 신고 수
주간 인기 인물 TOP 5
최근 신고 목록
```

### 인물 관리
- 목록: 이름, 태그, 공개 여부, 조회수, 등록일 + 검색/필터
- 등록/수정 폼: 기본 정보 + 태그 멀티셀렉트 + 타임라인 항목 추가 (`PersonForm.tsx`)
- 이미지 크롭: `ImageCropModal.tsx`
- CSV 벌크 업로드: `BulkUploadForm.tsx` — 부분 성공 + 에러 리포트

### 아티클 관리
- 목록: 제목, 태그, 공개 여부, 조회수
- 작성/수정 폼: `ArticleForm.tsx` — 마크다운 에디터 + 썸네일 + 태그

### 타임라인 관리
- 인물별 타임라인 항목 CRUD (연도, 월, 제목, 설명, 정렬순서)

### 큐레이터 관리
- 유저 검색 → 큐레이터 역할 부여 (era/field/global + role_value)

### 그룹 관리
- GROUP 타입 노드 전용 관리 — 멤버 인물 연결

### 스레드 관리
- 스레드 pin/unpin, 삭제 관리

### 회원 관리
```
검색: 닉네임, 이메일
필터: 정지 여부, 경고 수
정지 해제 자동화: pg_cron 매 시간
```

---

## 9. 인증 및 권한

### Supabase Auth

```typescript
// 소셜 로그인: Google (메인) + Discord
// 이메일 인증 지원
// → Supabase Auth OAuth 사용

// lib/hooks/use-auth.ts — 클라이언트 인증 상태 관리 (signIn, signOut, user 상태)
// lib/supabase-browser.ts — 클라이언트 Supabase 싱글턴 인스턴스
```

### Middleware (middleware.ts)

```typescript
// /admin/* 라우트 보호
// - 비인증 → /login 리다이렉트
// - profiles.role !== 'ADMIN' → /login 리다이렉트
// - Supabase SSR 쿠키 동기화
// - localhost 개발 환경 바이패스
```

### API Route 권한 체크 패턴

```typescript
// lib/auth.ts
export async function requireUser(request: Request) { /* JWT 검증 */ }
export async function requireAdmin(request: Request) { /* JWT + ADMIN role */ }
```

### 권한 매트릭스

| 기능 | 비회원 | 일반 회원 | 운영진 |
|------|--------|-----------|--------|
| 페이지 열람 | ✅ | ✅ | ✅ |
| 스레드/댓글 작성 | ❌ | ✅ | ✅ |
| 좋아요/팔로우 | ❌ | ✅ | ✅ |
| 사진 업로드 | ❌ | ✅ | ✅ |
| 인물 추가 요청 | ❌ | ✅ | ✅ |
| 관계 제안 | ❌ | ✅ | ✅ |
| 컬렉션 관리 | ❌ | ✅ | ✅ |
| 어드민 패널 | ❌ | ❌ | ✅ |

---

## 10. 검색 및 필터

### PostgreSQL 전문 검색

```sql
SELECT id, slug, name_en, name_hanja, birth_year, death_year
FROM persons
WHERE
  is_deleted = FALSE AND is_published = TRUE
  AND (
    name_en ILIKE '%' || $1 || '%'
    OR name_ko ILIKE '%' || $1 || '%'
    OR name_hanja % $1
  )
ORDER BY similarity(name_en, $1) DESC, view_count DESC
LIMIT $limit + 1;
```

### 필터 파라미터

```
era:      tags.type = 'ERA' (고대, 삼국, 고려, 조선, 근현대)
field:    tags.type = 'FIELD' (왕, 장군, 예술가, 독립운동가, 학자, 종교인, 기업인, 정치인, 스포츠, 문화/예능)
type:     ALL | PERSON | ARTIFACT | MEDIA | EVENT | GROUP | TOPIC
category: TOPIC 전용 (food | culture | sport | music | literature | custom)
sort:  relevance | name_asc | popular | recent
```

---

## 11. 보안

### XSS / SQL Injection 방어

```typescript
// API Route 입력 검증: zod
// Supabase parameterized query 사용 (raw SQL 금지)
```

### CSRF 보호
- JWT가 Authorization 헤더로 전달 → CSRF 위험 없음

### 파일 업로드 제한

```
허용 MIME 타입: image/jpeg, image/png, image/webp
최대 파일 크기: 5MB
업로드 경로:
  avatars/{user_id}/{uuid}.webp
  threads/{user_id}/{uuid}.webp
  persons/{person_id}/{uuid}.webp  (어드민만)
```

---

## 12. SEO 전략

### 정적 생성 (SSG + ISR)

```typescript
// app/(public)/persons/[slug]/page.tsx
export async function generateStaticParams() { /* 전체 published persons */ }
export const revalidate = 86400; // 24시간 ISR
```

### Schema.org 구조화 데이터 (`lib/jsonld.ts`)
- 인물: `Person` type
- 유물: `VisualArtwork`
- 미디어: `Movie | TVSeries`
- 사건: `Event`
- 토픽: `Thing` 기본, category에 따라 `DefinedTerm`, `SportsOrganization`, `SportsEvent`, `CreativeWork` 보조 검토
- 사이트: `WebSite` (홈페이지)

### Sitemap (`app/sitemap.ts`)
- 전체 persons/nodes slug 기반 동적 사이트맵

### robots.ts
- `app/robots.ts` — 크롤링 규칙

### Next.js Image 설정

```javascript
// next.config.js
images: {
  unoptimized: true,
  remotePatterns: [
    { hostname: '*.supabase.co' },           // Supabase Storage
    { hostname: 'img.youtube.com' },          // YouTube 썸네일
    { hostname: 'lh3.googleusercontent.com' } // Google 아바타
  ]
}
```

---

## 13. 마일스톤 로드맵

> 1인 개발 기준. **현재 상태**: sillok.kr 운영 중, M1 핵심 개발 완료, Age Flow 출시.

---

### Milestone 1 — 씨앗 심기 ✅ 완료
**달성:** 서비스 런칭 + 기본 기능 완성

#### 완료 항목
- [x] DB 스키마 29개 테이블 + 트리거 + pg_cron
- [x] API Routes 공통 인프라
- [x] 인물 CRUD + CSV 벌크 업로드
- [x] 노드 CRUD (ARTIFACT, MEDIA, EVENT, GROUP)
- [x] 스레드 + 댓글 + 좋아요 + 팔로우
- [x] 통합 검색 (pg_trgm)
- [x] 회원가입/로그인 (이메일 + Google + Discord)
- [x] 메인 페이지 + 인물 목록/상세 (SSG + ISR)
- [x] Explore 허브 (/nodes) + Artifacts 목록
- [x] Threads 목록 + 작성 페이지
- [x] Articles 목록/상세 + 어드민 CRUD
- [x] 어드민 패널 (14개 페이지)
- [x] OG 이미지, Sitemap, JSON-LD, robots.txt
- [x] 영문화 전환 (Public 전체 영어)
- [x] **Age Flow 시대 흐름 시각화** (8 컴포넌트)
- [x] PersonAvatar 태그별 스타일
- [x] 컬렉션/알림/프로필 페이지
- [x] About/Terms/Privacy 페이지
- [x] 인물 175명+ 등록

#### 남은 작업 (M1.5)
- [ ] TOPIC 노드 타입 DB 마이그레이션 (`nodes.node_type`, `metadata.category`)
- [ ] `node_links` 테이블 추가 및 어드민 연결 관리 UI
- [ ] 컬렉션 아이템 노드 지원 (`collection_items.node_id`)
- [ ] Explore 허브 Topics 섹션 추가
- [ ] 초기 TOPIC 시드 30개 등록
  - food: 김치, 불고기, 비빔밥, 떡볶이, 막걸리
  - culture: 한복, 한글, 판소리, 사물놀이, Korean Wave
  - sport: 한국축구, 한국야구, 태권도, KBO League, K League
- [ ] Google Search Console 등록 + Sitemap 제출
- [ ] Vercel Analytics 활성화
- [ ] 소셜 채널 개설

---

### Milestone 2 — 뿌리 내리기 (트래픽 + 차별화)
**목표:** 글로벌 SEO 트래픽 확보 + 핵심 차별화 기능 완성
**목표 지표:** DAU 500+, 등록 인물 500명+

#### 핵심 개발
- [ ] **관계도 시각화** (D3.js 미니 + vis-network 전체 탐색, lazy expand)
- [ ] **생애 타임라인 시각화** 고도화
- [ ] **문화 TOPIC 상세 페이지 고도화** — 관련 인물/사건/노드 그래프, 카테고리별 탐색
- [ ] **음식·스포츠 SEO 랜딩 확장** — Korean Cuisine, Korean Sports, Korean Culture 클러스터
- [ ] 오늘의 인물 생일/기일 자동 선정 cron
- [ ] **Twitter/X 자동 포스팅** — 오늘의 인물 매일 자동 트윗
- [ ] 인물 랭킹 고도화 (주간/월간 시각화)
- [ ] 인물 데이터 500명+ 확장
- [ ] TOPIC 데이터 100개+ 확장

#### 비즈니스 모델
- [ ] Google AdSense 심사 신청
- [ ] Sillok Plus 출시 — $3.99/월
- [ ] 운영진 후원 페이지

---

### Milestone 3 — 가지 뻗기 (글로벌 확장)
**목표:** 글로벌 K-culture 커뮤니티 + 수익 다변화
**목표 지표:** DAU 5,000+, 월 수익 $2,000+

#### 핵심 개발
- [ ] 공개 API v1
- [ ] PWA
- [ ] Upstash Redis 캐싱
- [ ] 고급 검색 필터
- [ ] 모바일 UX 고도화

#### 비즈니스 모델
- [ ] 공개 API 유료화
- [ ] 글로벌 기관 스폰서십
- [ ] 어워드 시스템

---

### Milestone 4 — 숲이 되기 (플랫폼화)
**목표:** 한국 역사 영문 데이터의 글로벌 레퍼런스
**목표 지표:** DAU 30,000+, 월 수익 $30,000+

#### 핵심 개발
- [ ] React Native 앱
- [ ] AI 인물 요약
- [ ] 교육 모드
- [ ] 인물 비교 기능

---

## 14. 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # 서버/빌드 전용 (노출 금지)

# 소셜 로그인 (현재 구현)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# 파일 업로드
MAX_FILE_SIZE_MB=5

# 앱
NEXT_PUBLIC_APP_URL=https://sillok.kr

# 광고 (Milestone 2)
NEXT_PUBLIC_ADSENSE_CLIENT=

# Rate Limit (Milestone 2 — Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# 결제 (Milestone 2)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 15. 비즈니스 모델

### 15-1. 수익원 전체 구조

| 수익원 | 적용 시점 | 설명 |
|--------|----------|------|
| Google AdSense | Milestone 2 | 메인 ×3, 인물 ×3 슬롯 |
| Sillok Plus 구독 | Milestone 2 | $3.99/월 · $35.99/년 (Stripe) |
| 운영진 후원 | Milestone 2 | Ko-fi / Buy Me a Coffee |
| 어워드 시스템 | Milestone 3 | 소액 결제 (원화 기준) |
| 공개 API 유료화 | Milestone 3 | 개발자/교육 앱/게임사 대상 |
| 기관 스폰서십 | Milestone 3 | Korea Foundation, KTO 등 |
| 교육기관 B2B | Milestone 4 | 글로벌 한국문화 학과 타겟 |
| AI 데이터 라이선싱 | Milestone 4 | 글로벌 AI 회사 |

### 15-2. Sillok Plus 구독

| 플랜 | 금액 | 결제 주기 |
|------|------|----------|
| Monthly | $3.99 | 매월 자동결제 |
| Yearly | $35.99 (월 환산 $2.99) | 연 1회 |

### 15-3. 어워드 시스템

| 이름 | 아이콘 | 설명 |
|------|--------|------|
| Verified Fact | 🏅 | Well-researched post |
| Great Writing | ✍️ | Exceptionally well-written |
| Mind Blown | 😮 | Surprising insight |
| Debate Starter | 🔥 | Sparked meaningful discussion |
| Sillok's Choice | 🎩 | Most valuable contribution |

> 금액은 원화(`amount_krw`) 기준으로 DB 저장

### 15-4. 자원봉사 큐레이터 제도

| 역할 | 권한 |
|------|------|
| Era Curator | 해당 시대 인물 편집 요청 승인/반려 |
| Field Curator | 해당 분야 태그 관리, 부적절 스레드 숨김 |
| Global Curator | 영문 콘텐츠 검수, 해외 유저 모더레이션 |

---

**커뮤니티 규칙 요약:**
- **권장:** 출처 기반 정보 공유, 건설적 토론, 오류 정정 요청
- **금지:** 근거 없는 비방/욕설, 사생활 침해, 역사 왜곡, 저작권 침해, 스팸
- **논란 인물:** 단정적 가치 판단 지양, 다양한 시각 전제, 출처 없는 주장 삭제 가능
- **제재:** 경고 → 게시물 삭제 → 계정 정지 (심각한 위반 시 즉시 정지)
