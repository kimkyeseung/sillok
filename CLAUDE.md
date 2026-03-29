# Sillok (실록) — CLAUDE.md

> 한국 인물 아카이브 + 커뮤니티 플랫폼. 1인 개발. Next.js 14 + Supabase + Vercel.

---

## Commands

```bash
npm run dev          # Next.js dev (port 3000)
npm run build        # 프로덕션 빌드
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run db:migrate   # Supabase migration 적용
npm run db:generate  # 타입 자동 생성
```

---

## Architecture

```
app/
├── (public)/        SSG/ISR 페이지 + CSR (age-flow)
├── (auth)/          로그인/회원가입
├── admin/           어드민 (로그인 필수)
└── api/             API Routes (persons, threads, nodes, collections 등)
components/
├── age-flow/        시대 흐름 시각화 (8 컴포넌트 + useAgeFlow 훅)
├── common/          Header, Modal, Toast, PersonAvatar
├── person/ thread/ collection/ ranking/ search/ admin/
lib/
├── supabase-admin.ts   서버 전용 (SERVICE_ROLE_KEY)
├── supabase-server.ts  SSR 서버 컴포넌트 전용
├── auth.ts             requireUser / requireAdmin
├── api-helpers.ts      apiError / apiSuccess
├── types.ts            NodeType, RelationType 등
db/schema.sql           전체 DB 스키마 (27 테이블)
```

**Supabase 클라이언트 사용 규칙:**
- SSG/Server Component → `supabaseAdmin` 또는 `supabaseServer`
- API Route (인증/쓰기) → `supabaseAdmin`
- Client Component → `fetch('/api/...')` + SWR (직접 Supabase 접근 금지)

---

## Critical Rules

### 반드시 지킬 것

- API Route: `requireUser()` 또는 `requireAdmin()`으로 인증
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

- 전체 스키마: `db/schema.sql` (27 테이블)
- soft delete: `is_deleted = TRUE` (hard delete는 어드민만)
- 카운터: 트리거 동기화 (`like_count`, `reply_count` 등)
- `view_count`: 직접 UPDATE 금지 → `view_logs` + 배치 집계
- 관계: FAMILY·ALLY·RIVAL은 단방향 저장 후 OR 쿼리
- 파일 업로드: Supabase Storage presigned URL 방식 (image/jpeg, png, webp, 5MB)

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
| age-flow 전체 메모리 로드 | ~1,000명 OK. 2,000명 이상 시 구간 로드 전환 (SCALABILITY NOTE 참조) |
| PersonAvatar 태그별 스타일 | FIELD 태그별 배경색·아이콘 분기 (`components/common/PersonAvatar.tsx`) |
