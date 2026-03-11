# 실록(Sillok) 인물 데이터 생성 프롬프트

한국 역사 인물 아카이브 "실록"에 등록할 인물 데이터를 생성해줘.
아래 규칙과 JSON 형식을 정확히 따라야 해.

## 규칙

### slug
- 국립국어원 로마자 표기법 기준 영문 소문자 + 하이픈
- 동명이인은 생년 suffix 추가: `kim-cheol-su-1945`
- 예: 세종대왕 → `sejong-daewang`, 이순신 → `yi-sun-sin`

### 이름
- `name_ko`: 한글 이름 (필수)
- `name_hanja`: 한자 이름 (있으면)
- `name_en`: 영문 이름 (있으면)

### 생몰년
- `birth_year`, `death_year`: 정수 (생존 인물은 death_year 생략)
- `birth_date`, `death_date`: "MM-DD" 형식 (정확한 날짜를 알 때만)
- `is_alive`: 생존 인물이면 true

### summary
- 1~3문장으로 핵심 업적/정체성 요약
- 최대 5000자

### tag_names
- 아래 목록에서만 선택 (시대 1개 + 분야 1~2개 권장)
- 시대: 고대, 삼국, 고려, 조선, 근현대
- 분야: 왕, 장군, 예술가, 독립운동가, 학자, 정치인, 스포츠, 문화/예능, 기업인, 종교인

### timeline
- 주요 생애 사건을 시간순으로 정리
- 출생, 주요 업적, 사망은 반드시 포함
- `year`: 정수 (필수)
- `month`: 1~12 (알 때만)
- `title`: 사건 제목 (필수, 최대 200자)
- `description`: 상세 설명 (선택, 최대 2000자)

### is_controversial
- 역사적으로 논쟁이 있는 인물이면 true (예: 친일파 등)

### is_published
- true로 설정하면 즉시 공개

## JSON 형식

단건:
```json
{
  "slug": "sejong-daewang",
  "name_ko": "세종대왕",
  "name_hanja": "世宗大王",
  "name_en": "Sejong the Great",
  "birth_year": 1397,
  "birth_date": "05-15",
  "death_year": 1450,
  "death_date": "03-30",
  "birth_place": "한성부",
  "summary": "조선 제4대 국왕. 훈민정음을 창제하고 과학·문화·국방 등 전 분야에서 조선의 황금기를 이끌었다.",
  "is_controversial": false,
  "is_alive": false,
  "is_published": true,
  "tag_names": ["조선", "왕"],
  "timeline": [
    { "year": 1397, "title": "출생", "description": "태종 이방원의 셋째 아들로 태어남" },
    { "year": 1418, "title": "즉위", "description": "조선 제4대 왕으로 즉위" },
    { "year": 1443, "title": "훈민정음 창제", "description": "백성을 위한 새 문자 체계를 창제" },
    { "year": 1446, "title": "훈민정음 반포" },
    { "year": 1450, "title": "승하", "description": "영릉에 안장" }
  ]
}
```

복수 (배열, 최대 50건):
```json
[
  { "slug": "sejong-daewang", "name_ko": "세종대왕", ... },
  { "slug": "yi-sun-sin", "name_ko": "이순신", ... }
]
```

## API 호출

```bash
curl -X POST https://sillok-web.vercel.app/api/ai/persons \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $AI_API_SECRET_KEY" \
  -d '<위 JSON>'
```

## 요청

{여기에 생성할 인물 또는 조건을 입력}

JSON만 출력해. 설명 불필요.
