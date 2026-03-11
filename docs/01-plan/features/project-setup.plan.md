# Project Setup Planning Document

> **Summary**: Next.js 모노레포 프로젝트 초기화 및 개발 환경 구성
>
> **Project**: Sillok (실록)
> **Version**: 0.1.0
> **Author**: kimkyeseung
> **Date**: 2026-03-10
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

Sillok(실록) 프로젝트의 코드베이스를 SPEC v2.0에 정의된 모노레포 폴더 구조에 맞게 초기화하고, 모든 후속 기능 개발의 기반이 되는 개발 환경을 구성한다.

### 1.2 Background

- 1인 개발 프로젝트로, Vercel 단일 배포 구조 채택
- Next.js 14 App Router + Supabase + OCI 배치 서버 아키텍처
- CLAUDE.md 및 SPEC v2.0 문서가 이미 완성된 상태
- 코드는 아직 없으며 완전히 새로운 프로젝트

### 1.3 Related Documents

- CLAUDE.md (개발 규칙 정의)
- Sillok_SPEC_v2.0.md (전체 명세)
- SPEC 섹션 2: 기술 스택 및 폴더 구조
- SPEC 섹션 3: 공통 규칙
- SPEC 섹션 14: 환경 변수

---

## 2. Scope

### 2.1 In Scope

- [ ] Next.js 14 App Router 프로젝트 생성 (`apps/web/`)
- [ ] 모노레포 폴더 구조 구성 (apps/web, packages/types, batch, db)
- [ ] TypeScript 설정 (tsconfig.json, path alias)
- [ ] Tailwind CSS 설정
- [ ] ESLint + Prettier 설정
- [ ] Supabase 클라이언트 설정 (admin, server, browser 분리)
- [ ] 공통 API 헬퍼 (apiError, apiSuccess)
- [ ] 공통 인증 헬퍼 (requireUser, requireAdmin)
- [ ] Rate limit 기본 구조 (in-memory Map)
- [ ] Zod 패키지 설치
- [ ] .env.local.example 템플릿
- [ ] middleware.ts 기본 구조 (admin 라우트 보호)
- [ ] packages/types 공유 타입 기본 구조

### 2.2 Out of Scope

- DB 스키마 마이그레이션 (별도 PDCA: db-schema)
- 인증 기능 구현 (별도 PDCA: auth)
- API 엔드포인트 구현 (별도 PDCA: 각 기능별)
- UI 컴포넌트 구현
- OCI 배치 서버 구성 (Milestone 1 후반)
- CI/CD 파이프라인

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Next.js 14 App Router 프로젝트가 `npm run dev`로 정상 실행 | High | Pending |
| FR-02 | 모노레포 폴더 구조가 SPEC과 일치 | High | Pending |
| FR-03 | Supabase 클라이언트 3종 분리 (admin/server/browser) | High | Pending |
| FR-04 | apiError/apiSuccess 헬퍼가 CLAUDE.md 응답 포맷과 일치 | High | Pending |
| FR-05 | requireUser/requireAdmin 헬퍼 인터페이스 정의 | High | Pending |
| FR-06 | Rate limit 유틸리티 기본 구조 | Medium | Pending |
| FR-07 | TypeScript path alias (@/ 사용) 정상 동작 | Medium | Pending |
| FR-08 | middleware.ts가 /admin/* 라우트 보호 | Medium | Pending |
| FR-09 | 공유 타입 패키지 (packages/types) 사용 가능 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Build | `npm run build` 에러 없이 성공 | CLI 실행 |
| Type Safety | `npm run type-check` 에러 없이 성공 | tsc --noEmit |
| Lint | `npm run lint` 에러 없이 성공 | ESLint |
| Security | SUPABASE_SERVICE_ROLE_KEY가 클라이언트에 노출되지 않음 | 코드 리뷰 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `npm run dev`로 Next.js 개발 서버 정상 실행
- [ ] `npm run build` 에러 없이 성공
- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 통과
- [ ] 모든 lib 헬퍼 파일이 타입 에러 없이 작성됨
- [ ] .env.local.example에 필요한 변수 목록 명시됨

### 4.2 Quality Criteria

- [ ] SPEC에 정의된 폴더 구조와 100% 일치
- [ ] CLAUDE.md의 Critical Rules 위반 사항 없음
- [ ] 빌드 경고 최소화

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Next.js 14 vs 15 호환성 | Medium | Low | package.json에서 Next.js 14 버전 고정 |
| Supabase SDK 버전 충돌 | Medium | Low | @supabase/supabase-js, @supabase/ssr 최신 안정 버전 사용 |
| 모노레포 path 설정 복잡도 | Low | Medium | tsconfig paths + next.config.js 설정으로 해결 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based, BaaS integration | Web apps with backend | ☑ |
| **Enterprise** | Strict layer separation, microservices | High-traffic systems | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js 14 / 15 | Next.js 14 | SPEC 명시, App Router 안정성 |
| Styling | Tailwind CSS | Tailwind CSS | SPEC 명시 |
| API Client | SWR / react-query | SWR | Next.js 생태계 호환, 경량 |
| Form Handling | react-hook-form | react-hook-form | zod 통합 용이 |
| Validation | zod | zod | CLAUDE.md 필수 규칙 |
| DB Client | Supabase JS SDK | Supabase JS SDK | SPEC 명시 |
| Backend | Next.js API Routes | Next.js API Routes | Vercel 단일 배포 |

### 6.3 Folder Structure (SPEC v2.0)

```
sillok/
├── apps/
│   └── web/                        # Next.js (FE + API 통합)
│       ├── app/
│       │   ├── (public)/           # 정적 SSG + ISR 페이지
│       │   ├── (auth)/             # 로그인/회원가입
│       │   ├── admin/              # 어드민 SSR 페이지
│       │   └── api/                # API Routes
│       ├── components/             # UI 컴포넌트
│       └── lib/                    # 유틸리티 (supabase, auth, api-helpers)
├── packages/
│   └── types/                      # 공유 타입
├── batch/                          # OCI 배치 서버
├── db/
│   └── schema.sql                  # 전체 DB 스키마
└── docs/                           # PDCA 문서
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [ ] ESLint configuration
- [ ] Prettier configuration
- [ ] TypeScript configuration

### 7.2 Conventions to Define

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | CLAUDE.md에 slug 규칙 정의됨 | 컴포넌트/함수 네이밍 | High |
| **Folder structure** | SPEC에 정의됨 | 구현 | High |
| **Import order** | 미정의 | @/ alias 기반 정렬 | Medium |
| **Environment variables** | CLAUDE.md에 목록 있음 | .env.local.example 생성 | High |
| **Error handling** | CLAUDE.md에 패턴 정의됨 | apiError/apiSuccess 구현 | High |
| **API pattern** | CLAUDE.md에 상세 패턴 있음 | 템플릿 코드 구현 | High |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Client | ☑ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | Client | ☑ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 키 (서버 전용) | Server | ☑ |
| `NEXT_PUBLIC_APP_URL` | 앱 URL | Client | ☑ |

---

## 8. 패키지 목록 (설치 예정)

### Dependencies

```
next@14
react@18
react-dom@18
@supabase/supabase-js
@supabase/ssr
zod
swr
tailwindcss
```

### Dev Dependencies

```
typescript
@types/react
@types/node
eslint
eslint-config-next
prettier
prettier-plugin-tailwindcss
```

---

## 9. Next Steps

1. [ ] Plan 리뷰 완료 후 Design 문서 작성 (`project-setup.design.md`)
2. [ ] Design 확정 후 구현 (Do)
3. [ ] 구현 완료 후 Gap Analysis

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-10 | Initial draft | kimkyeseung |
