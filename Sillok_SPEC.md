# Sillok — 제품 명세 · 설계 결정

> 한국 인물 중심 지식 아카이브 + Reddit식 커뮤니티. sillok.kr 운영 중. Next.js 14 (App Router) + Supabase + Vercel, 1인 개발.
>
> **이 문서의 범위:** 코드만 봐서는 알 수 없는 것 — 제품 의도, 규칙, 공식, 정책, 로드맵.
> 코드에서 바로 읽히는 것은 여기 적지 않는다 (적으면 낡는다):
>
> | 알고 싶은 것 | 원본 |
> |---|---|
> | 작업 규칙 · 아키텍처 · 금지 사항 · 핵심 결정 | `AGENTS.md` |
> | 테이블 · 컬럼 · 인덱스 · 트리거 | `db/schema.sql` (+ `db/migrations/`) |
> | API 목록 | `app/api/**/route.ts` (어드민 화면 `/admin/api-docs`) |
> | 페이지 · 라우트 | `app/` 디렉터리 |
> | 환경 변수 | `AGENTS.md` Commands 절, `.env.local.example` |
>
> 변경 이력은 `git log -- Sillok_SPEC.md`. 섹션 단위로 필요한 곳만 읽는다.

---

## 1. 서비스 컨셉

BoardGameGeek(BGG) 구조를 벤치마크해, **한국의 이름 있는 인물**을 핵심 노드로 두고 유물·K-콘텐츠·사건·그룹이 연결되는 그래프형 아카이브. 영어 사용자 대상.

- 단군 시대부터 현대까지 수록. 논란 인물(친일파, 독재자 등)도 포함하되 **기본 정보만** (7-6)
- 운영자가 뼈대(인물·노드·편집 콘텐츠)를 관리하고, 유저가 커뮤니티 콘텐츠(스레드·댓글·컬렉션)를 쌓는다

### 노드 타입

| 타입 | 설명 | 인터랙션 |
|------|------|----------|
| `PERSON` (`persons` 테이블) | 인물 — 핵심 노드 | 스레드 (Reddit식) |
| `ARTIFACT` | 유물·문화재 (국보·보물 일괄 등록 포함) | 노드 댓글 |
| `MEDIA` | 영화·드라마·도서·회화 | 노드 댓글 |
| `EVENT` | 사건·전쟁·업적 | 노드 댓글 |
| `GROUP` | K-pop 그룹 등 현대 문화 엔티티 | 노드 댓글 |

`TOPIC`(음식·문화·스포츠 주제)은 **계획만 있고 미구현** — DB `node_type` CHECK에 없다. 로드맵 13 참고.

---

## 2. 공통 규칙

### 2-1. Slug
- 영문 소문자 + 하이픈 (`sejong-daewang`, `hunminjeongeum`). 한글 URL 쓰지 않음
- 로마자 표기는 국립국어원 표준. 동명이인은 생년을 붙임 (`kim-cheol-su-1945`). DB unique 제약

### 2-2. 목록 = 커서 페이지네이션
- 요청 `limit`(기본 20, 최대 100) + `cursor`. 응답 `{ items, has_next, next_cursor }` (`data` 아님)
- `limit + 1`개 조회 → 넘치면 `has_next`. 정렬 키가 겹칠 수 있으면 `(키, id)` 복합 커서
- offset 페이지네이션 금지 (중복·누락)

### 2-3. 응답 형식
`{ success: true, data }` / `{ success: false, error: { code, message, details? } }` — `lib/api-helpers.ts`의 `apiSuccess` / `apiError`. 공개 API 메시지는 영어, 어드민 API는 한국어.

### 2-4. Rate limit (`lib/rate-limit.ts`, in-memory)

| 대상 | 한도 |
|------|------|
| 전체 기본 | 100 / 분 / IP |
| 검색 | 30 / 분 / IP |
| 인물 추가 요청 | 5 / 시간 / 유저 |
| 관계 제안 · 신고 · 스레드 작성 | 각 10 / 시간 / 유저 |
| 댓글 작성 | 30 / 시간 / 유저 |
| 어드민 API | 제외 |

### 2-5. Soft delete
모든 콘텐츠 테이블에 `is_deleted`. 읽기 쿼리는 항상 `is_deleted = FALSE`. hard delete는 어드민이 명시적으로 요청할 때만.

### 2-6. 언어
- 공개 사이트는 **영어 단일** (locale 라우팅 없음). 인물은 `name_en`·`summary` 등 영문을 테이블에 직접 저장
- 한글은 meta·구조화 데이터·인용 원문에만. 관리자 화면은 한국어
- 검색은 `name_en` + `name_ko` + `name_hanja` + `aliases_en`("King Sejong" 등) 동시 지원
- 커뮤니티(스레드·댓글)는 언어 혼용 허용, 번역 없음
- `person_translations` / `node_translations` / `person_timeline_translations`는 향후 다국어용으로 남아 있음

---

## 3. 데이터 모델 — 설계 결정

컬럼 정의는 `db/schema.sql`. 여기는 스키마만 봐서는 모르는 규칙만.

### 3-1. 인물 간 관계 (`person_relations`)

| 타입 | 방향 | 의미 |
|------|------|------|
| `FAMILY` | 양방향 | 가족·혈연. `family_role` = `PARENT`(from이 to의 부모) / `SPOUSE` / `SIBLING` / NULL(기타 친족) — 가족관계도에 사용 |
| `ALLY` · `RIVAL` · `AFFILIATED` | 양방향 | 협력 · 대립 · 느슨한 연관 |
| `TEACHER` | from=스승 → to=제자 | |
| `LORD_VASSAL` | from=왕 → to=신하 | |
| `INFLUENCE` | from=영향 준 사람 → to=받은 사람 | |
| `MEMBER_OF` · `FOUNDED` | from=멤버/창업자 → to=그룹/조직 대표 인물 | |

- **양방향 타입은 1건만 저장**하고 조회 시 `from = X OR to = X` (헬퍼 `get_person_relations`)
- 유저 제안은 `is_approved = FALSE`로 들어와 어드민 승인 후 노출

### 3-2. 인물 ↔ 노드 (`person_node_links.link_type`)
`ASSOCIATED_WITH`(느슨한 관련) · `REPRESENTS`(대표 인물) · `POPULARIZED` · `CREATED_BY` · `PARTICIPATED_IN`(사건 참여) · `FEATURED_IN`(작품 등장). 영화·드라마 출연은 `portrayed_by`(배우명).

### 3-3. 스레드
- `category` ↔ 토픽 URL: `DISCUSSION`=`/t/discussion`, `TRIVIA`=`/t/trivia`, `QNA`=`/t/qna`, `SOURCES`=`/t/sources`, `MEDIA`=`/t/film-tv`
- **hot_score** = `(1 + replies × 0.5 + likes) / (age_days + 2)^1.5`, **소수점 12자리 반올림** — PostgREST가 float를 15자리로 직렬화해서, 반올림하지 않으면 피드 커서 경계 행이 다음 페이지에 중복된다. 트리거(좋아요·댓글 변경 시) + pg_cron 15분 감쇠
- `top_score`는 생성 컬럼. 피드 인덱스는 `(hot_score|top_score|created_at DESC, id DESC) WHERE is_deleted = FALSE`
- `updated_at`은 내용 컬럼(`title, content, video_url, category, person_id, is_pinned, is_deleted`) 수정 시에만 갱신 — 카운터 변경으로 sitemap lastmod가 흔들리지 않게
- `thread_persons`: 스레드 ↔ 여러 인물 (`is_primary` 주 인물)
- 이미지: 스레드당 최대 3장. `thread_images.alt` = 이미지 설명 + 이미지 속 글자 → img alt · og:image:alt · `ImageObject.caption`
- `video_url`: YouTube · Vimeo만 (`youtube.com`, `youtu.be`, `vimeo.com`)

### 3-4. 대댓글 (`thread_replies`)
- `parent_id`는 같은 스레드의 미삭제 댓글이어야 함 (아니면 404). `depth`는 트리거로 계산
- 부모 depth가 4 이상이면 **부모의 부모**에 붙여 최대 4단계 유지
- 표시는 `buildReplyTree`(`lib/feed.ts`): 부모 아래 오래된 순, 부모가 삭제된 댓글은 최상위로. 들여쓰기는 3단계까지, 더 깊으면 `@부모닉네임` 표시
- 댓글에는 이미지 첨부 없음

### 3-5. 카운터 · 조회수
- `like_count`, `reply_count`, `follow_count`, `item_count`는 트리거로 동기화
- `view_count`는 직접 UPDATE 금지 → `view_logs` INSERT + 배치 집계 (race condition 방지). `view_logs`는 7일 보관
- pg_cron 설계: 정지 해제(매시), view_count 집계(5분), view_logs 정리(매일), hot_score 감쇠(15분)

### 3-6. 팔로우 · 좋아요
- 팔로우 대상은 인물·노드만. **유저 간 팔로우 없음** (SNS화 방지)
- 좋아요만 있고 싫어요·다운보트 없음. 대상: 스레드 · 댓글 · 노드 댓글 · 아티클

### 3-7. 인물 편집 콘텐츠 · 커뮤니티
- `person_facts`(인포박스) · `person_highlights`(업적 `ACHIEVEMENT` / 어록 / `TRIVIA`) · `person_sources`
- AI 초안은 `is_ai_generated = TRUE`로 **즉시 공개 + "AI draft" 라벨**, 어드민 검수(`/admin/content-review`) 시 라벨 해제
- 인물별 투표(`person_polls`, 1인 1표), 개인 상태(`STUDIED` / `VISITED` / `WANT_TO_LEARN`), 사실 제안(`person_suggestions`: FACT · ACHIEVEMENT · TRIVIA · SOURCE · CORRECTION → 어드민 승인·반려)
- 항목 반응(`person_item_likes` / `person_item_comments`): 대상 `HIGHLIGHT` · `GALLERY` · `PORTRAYAL`, 댓글 1~1000자, 신고 대상 `PERSON_ITEM_COMMENT`

### 3-8. 재위 · 유물 이미지 · AI 초안
- `reigns`: 왕 1인 1재위 1행 (복위한 왕은 2행). age-flow의 "현재 왕"과 연도 페이지가 사용
- `node_images`: 국가유산청 API 이미지 URL, **미러링 없음**. `license` = `kogl-1`(자유) / `kogl-3`(변경금지 → 크롭 없이 표시)
- `ai_drafts`: 어드민 작업 공간 (섹션 8). 게시하면 `thread_id`로 일반 스레드와 연결 — 수정 시 스레드 갱신, 게시 취소·삭제 시 스레드 soft delete
- 이 계열 신규 테이블은 RLS 켜고 정책 없음 (service role 전용)

### 3-9. 업로드
- jpeg / png / webp, 5MB. presigned URL. 경로 `{bucket}/{user_id}/…`
- `memes` 버킷(번역할 원본 짤)은 jpeg / png만 — 렌더러가 webp 불가
- 이미지 출처 정책(운영자 콘텐츠 vs 유저 업로드)은 `prompts/image-policy.md`, 저작권 신고는 `/copyright`

---

## 4. 인증 · 권한

- Supabase Auth: 이메일 + **Google, Discord만**
- API Route: `requireUser()` / `requireActiveUser()`(작성·댓글 — 정지 유저 차단) / `requireAdmin()` (`lib/auth.ts`, `profiles.role = 'ADMIN'`)
- `middleware.ts`: `/admin/*` 보호 (비로그인·비관리자 → `/login`)
- JWT는 Authorization 헤더 → CSRF 위험 없음. 입력은 zod, DB는 query builder (raw SQL 금지)

| 기능 | 비회원 | 회원 | 운영자 |
|------|:--:|:--:|:--:|
| 열람 | ✅ | ✅ | ✅ |
| 스레드·댓글 작성, 좋아요·팔로우, 이미지 업로드 | ❌ | ✅ | ✅ |
| 인물 추가 요청, 관계 제안, 사실 제안, 컬렉션 | ❌ | ✅ | ✅ |
| 어드민 패널 | ❌ | ❌ | ✅ |

**제재:** 경고(`warning_logs`) → 게시물 삭제 → 계정 정지(`ban_until`, 만료 시 자동 해제). 심각한 위반은 즉시 정지.

---

## 5. 핵심 기능

### 5-1. 홈 = 커뮤니티 피드 (`/`, `/b/{board}`, `/t/{topic}`)
- 정렬: Hot(`hot_score`) · New(`created_at`) · Top(`top_score` + 기간 day/week/month/all)
- **기본 정렬 자동 전환**: 최근 7일 새 스레드 5개 미만이면 Top·전체 기간, 이상이면 Hot (`pickDefaultSort`)
- **편집 모듈**을 피드 사이에 삽입 (KST 날짜 기준 매일 교체) — 활동이 적을 때도 피드가 비어 보이지 않게:
  - Today in Korean History: 오늘의 인물(하이라이트 보유 인물 순환) + 오늘/이번 달 탄생·사망·사건
  - Poll of the Day · Trivia(인물 TRIVIA 하이라이트) · Recent activity(항목 댓글, 없으면 숨김)
- 게시판(`/b/`)은 시대별: ancient, three-kingdoms, unified-silla, goryeo, joseon, modern. 토픽(`/t/`)은 스레드 category
- **스레드는 단일 스트림**: 뻘글·사진·밈·장문 모두 같은 스레드. 특정 콘텐츠 유형 전용 카테고리·섹션·UI를 만들지 않는다
- 이미지 한 장짜리 스레드는 원본 비율로 크게, 여러 장이면 썸네일 스트립
- 구현: `lib/feed.ts`(순수 로직) · `lib/feed-data.ts`(로더) · `components/feed/*`

### 5-2. 인물 상세 (`/persons/{slug}/{tab}`)
- 탭: Overview · timeline · relations · legacy · related · gallery · threads · sources · stats. **탭마다 별도 URL·메타·canonical** (탭마다 색인)
- 항목 수가 `TAB_MIN_ITEMS` 미만인 탭은 숨김 + 404. Overview·Stats는 항상
- 헤더(layout): 인포박스, 개인 상태, Suggest a fact. Overview: 하이라이트, 투표, 갤러리, On screen(portrayed_by), 가족관계도(왕 중심, `family_role`)
- 로더 `lib/person-page.ts` — React `cache()`로 layout·page·metadata 공유, 사이트 공용 목록은 `sharedCache`
- PersonAvatar는 FIELD 태그별 배경·아이콘 (`components/common/PersonAvatar.tsx`)

### 5-3. 트렌딩 인물 랭킹 (Gravity decay)
`person_score = Σ (1 + reply_count × 0.5 + like_count) / (age_days + 2)^1.5`, 최근 30일 스레드 대상. 순위 변동 ▲ ▼ – 표시.

### 5-4. Age Flow (`/age-flow`, `/age-flow/{year}`)
- 인물 생존 기간을 스크롤·줌으로 탐색하는 타임라인. 사건 마커, 유물 타임라인, 관계선
- 데이터는 `lib/age-flow-data.ts`(sharedCache 5분, 쓰기 API는 `revalidateAgeFlow()`). 전체 인물 메모리 로드는 ~2,000명까지 — 넘으면 구간 로드로 전환
- **카드 뷰포트 캡**: 화면에 들어가는 만큼만 중요도(포커스·왕·전쟁·조회수) 순으로, 나머지는 "+N more"
- 왕은 `reigns`, 전쟁은 EVENT 노드(`war`/`revolt`) + `metadata.end_year` + 참여자 링크. **하드코딩 금지**
- 연도 페이지 "Korea in 1592" + 공유 카드 `/api/og/age-flow/{year}`. 생존 인물 5명(`YEAR_PAGE_MIN_FIGURES`) 미만 연도는 noindex, sitemap에는 사건·즉위 연도만

### 5-5. 유물 (`/nodes` 유물 탭, `/nodes/{slug}`)
- 국보·보물 ~2,800건을 국가유산청 API로 일괄 등록 (`metadata.source = 'khs'`). AI 번역 초안이라 **검수 전까지 큐레이션 목록·age-flow·sitemap 제외 + noindex**
- 목록/지도(MapLibre + MapTiler) 보기, 지정·유형·시대·지역·소장처 필터, 커서 페이지네이션
- 이미지는 공공누리 1유형만 썸네일, 1·3유형은 갤러리 (3유형은 크롭 금지)

### 5-6. 논란 인물 (`is_controversial`)
정책: 페이지 상단 배너("This figure is considered historically controversial. Sillok provides factual information only."), summary는 비우고 기본 정보만, 스레드 목록 상단 안내.
**현재는 어드민 플래그만 있고 공개 페이지 표시는 미구현** (로드맵 M1.5).

### 5-7. OG 이미지
연도 공유 카드 · 밈 미리보기 · 홍보 슬라이드는 `ImageResponse`로 생성 (`app/api/og/age-flow|meme|promo`). 인물·스레드·아티클은 썸네일·첫 이미지를 og:image로 쓰고 없으면 기본 이미지.

---

## 6. 어드민 (`/admin`, 한국어)

- 인물·노드·아티클·타임라인·태그·그룹·큐레이터·재위 CRUD, CSV 벌크 업로드(행 단위 부분 성공 + 에러 리포트)
- 큐(queue): 인물 추가 요청, 관계 제안, 사실 제안, 신고, AI 콘텐츠 검수
- 스레드 pin/삭제, 회원 경고·정지

### 6-1. AI Drafts (`/admin/memes`, 테이블 `ai_drafts`)
- **워작 밈**: 형식은 도감 `lib/meme-formats.ts`가 원본 (형식 추가 = 도감 항목 + MemeCanvas 레이아웃 + 테스트 샘플). 캡션은 Claude가 DB 사실로 작성. 모자(익선관·갓·투구·상투)는 FIELD 태그로 자동
- **한국 짤 번역**: 업로드 → Claude가 한국어 위치 탐지·번역 → 영어 박스 편집. 게시하려면 인물 지정 + 출처·크레딧 필수
- **짧은 소설**: 반전으로 끝나는 초단편, 이미지 없는 스레드. 본문 뒤 "What's real:" + AI 표기
- 게시하면 관리자 명의 **일반 스레드**. 사용자는 이 테이블을 모른다. 밈 PNG는 threads 버킷, 이미지 속 글자는 `thread_images.alt`
- **대상은 근대 이전 인물만** (1850년 이후 출생·생존·modern 태그 제외 — 명예훼손 방지). 사실 기반, 본문에 근거(`fact`)와 AI 표기
- 남의 밈은 구조만 빌리고 이미지·문구·캐릭터는 가져오지 않는다
- CLI: `scripts/meme-draft.ts` (`/write-meme` 스킬)

### 6-2. 홍보 Share kit (`/admin/promo`)
- 참여도 순 스레드 목록 → 스레드별 인스타 캐러셀 3장(1080×1350: 표지·역사·CTA), Instagram·Reddit(서브레딧별)·X·Threads 문구(Claude 초안), UTM 링크
- **게시는 사람이 직접** → 게시 URL 기록(`promo_posts`). 레딧 자동 게시 금지(자기홍보 차단·계정 정지 위험). 운영자임을 숨기는 문구 금지 — 제3자 행세 금지
- 외부 재사용 이미지는 관리자가 작성한 스레드의 것만 (`promoImage`) — 유저 업로드는 사이트 안에서만
- 예정: Instagram Graph API 자동 게시·예약 (Meta 앱 검수 필요)

---

## 7. SEO

- 공개 페이지는 대부분 SSR `force-dynamic` + `fetchCache = 'force-no-store'` (Next 14의 Supabase fetch 무기한 캐시 방지). DB 부하는 `sharedCache`로 줄인다
- **빌드 시점에 DB를 조회하지 않는다** — DB가 느리면 빌드가 60초 제한에 걸려 실패한다 (sitemap · `/api/reigns`도 요청 시점 생성)
- 구조화 데이터(`lib/jsonld.ts`): 인물 `Person` · 유물 `VisualArtwork` · 미디어 `Movie|TVSeries` · 사건 `Event` · 홈 `WebSite` · 스레드 `DiscussionForumPosting`(대댓글 `comment` 중첩) · 게시판/토픽 `CollectionPage` + `BreadcrumbList`. 사용자 입력이 들어가는 JSON-LD는 `<` → `<`
- Sitemap(`app/sitemap.ts`): 인물(+ 기준 이상 탭) · 노드 · 스레드 · 아티클 · 게시판/토픽. PostgREST 1000행 제한 → `fetchAll`로 페이징. `lastmod`는 실제 수정 시각
- **얇은 페이지 noindex**: 글 0개 게시판·토픽, 기준 미만 인물 탭, 생존 인물 5명 미만 연도, 검수 전 국가유산

---

## 8. 커뮤니티 규칙

- **권장:** 출처 기반 정보 공유, 건설적 토론, 오류 정정 요청
- **금지:** 근거 없는 비방·욕설, 사생활 침해, 역사 왜곡, 저작권 침해, 스팸
- **논란 인물:** 단정적 가치 판단 지양, 다양한 시각 전제, 출처 없는 주장은 삭제 가능
- 영상 직접 업로드 없음 (스토리지 비용) — YouTube·Vimeo 임베드만

---

## 9. 로드맵

> 1인 개발. **현재:** sillok.kr 운영 중, M1 완료. 상태는 확인된 것만 체크한다.

### M1.5 — 남은 기반 작업
- [ ] **TOPIC 노드** (음식·문화·스포츠): `node_type`에 `TOPIC` 추가, `metadata.category` = food / culture / sport / music / literature / custom (별도 node_type으로 쪼개지 않음). 인물보다 상위 개념이 아니며, TOPIC 상세는 항상 관련 인물·사건을 함께 노출
- [ ] `node_links` 테이블 (노드 ↔ 노드: `kimchi` PART_OF `korean-cuisine` 등) + 어드민 연결 UI
- [ ] 컬렉션에 노드 담기 (`collection_items.node_id`)
- [ ] 초기 TOPIC 시드 30개 (김치·불고기·비빔밥·한복·한글·판소리·한국축구·한국야구·태권도 …)
- [ ] Google Search Console 등록 + sitemap 제출
- [x] Vercel Analytics
- [ ] 국가유산 AI 번역 검수 (검수 전에는 noindex)
- [ ] 논란 인물 배너·안내 공개 페이지 표시 (5-6)

### M2 — 트래픽 + 차별화 (목표: DAU 500+, 인물 500명+)
- [ ] 관계도 시각화 고도화, 생애 타임라인 고도화
- [ ] TOPIC 상세·SEO 랜딩 (Korean Cuisine / Sports / Culture 클러스터), TOPIC 100개+
- [ ] 오늘의 인물 생일·기일 자동 선정
- [ ] 인물 랭킹 주간·월간
- [ ] 수익: AdSense, Sillok Plus, 후원 페이지

### M3 — 글로벌 확장 (목표: DAU 5,000+)
- [ ] 공개 API v1, PWA, Upstash Redis(rate limit·캐시), 고급 검색 필터
- [ ] 수익: 공개 API 유료화, 기관 스폰서십, 어워드

### M4 — 플랫폼화 (목표: DAU 30,000+)
- [ ] 모바일 앱, 교육 모드, 인물 비교

---

## 10. 비즈니스 모델 (계획)

| 수익원 | 시점 | 내용 |
|--------|------|------|
| Google AdSense | M2 | 메인 ×3, 인물 ×3 슬롯 |
| Sillok Plus 구독 | M2 | $3.99/월 · $35.99/년 (Stripe) — `subscriptions` 테이블 준비됨 |
| 운영자 후원 | M2 | Ko-fi / Buy Me a Coffee |
| 어워드 | M3 | 소액 결제(원화 `amount_krw`): Verified Fact 🏅 · Great Writing ✍️ · Mind Blown 😮 · Debate Starter 🔥 · Sillok's Choice 🎩 — `awards` 테이블 준비됨 |
| 공개 API 유료화 | M3 | 개발자·교육 앱·게임사 |
| 기관 스폰서십 | M3 | Korea Foundation, KTO 등 |
| 교육기관 B2B · AI 데이터 라이선싱 | M4 | |

**자원봉사 큐레이터** (`curator_roles`): Era Curator(시대별 인물 편집 승인) · Field Curator(분야 태그 관리, 부적절 스레드 숨김) · Global Curator(영문 검수, 해외 모더레이션).
