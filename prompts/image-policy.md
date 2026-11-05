# 이미지 사용 지침 (운영자 콘텐츠)

`/write-thread` · `/write-article` · `/write-meme`가 공통으로 따른다. 운영자(관리자 명의)가 올리는 이미지는 **Sillok이 직접 쓰는 것**이라 유저 업로드처럼 플랫폼 면책을 받지 못한다. 그래서 출처는 아래 허용 목록 안에서만 고르되, **그 안에서는 적극적으로** 쓴다.

## 원칙: 이미지를 기본값으로

- **스레드는 이미지 1장 이상이 기본.** 이미지 없는 스레드는 허용 출처에서 맞는 이미지를 끝내 못 찾았을 때만. 피드·공유 카드·검색 결과 모두 이미지가 있는 글이 훨씬 잘 눌린다.
- 1장이면 원본 비율로 크게, 2~3장이면 썸네일 스트립으로 보인다 — 핵심 이미지 1장 + 보조 1~2장 구성이 좋다.
- **아티클은 `thumbnail` 필수 + 본문 섹션마다 이미지 1장 정도** (`![alt](url)`).
- 웃음 포인트를 이미지로: 엄숙한 조선 초상화·기록화에 현대 자막이나 선글라스를 얹는 대비가 이 사이트의 무기다 (변형 가능한 출처만 — 아래 표).
- 모든 이미지에 `alt` 필수 (`thread_images.alt`): 무엇이 그려져 있는지 + 이미지 속 글자. img alt · og:image:alt · 구조화 데이터에 그대로 쓰인다.

## 허용 출처

| 출처 | 그대로 게시 | 변형 (자막·선글라스·크롭) | 표기 |
|------|:--:|:--:|------|
| 공공누리 **1유형** (국립중앙박물관 e뮤지엄, 국가유산포털, 국립고궁박물관 등) | O | O | 출처표시 필수 |
| 공공누리 **3유형** (변경금지) | O | **X** (크롭도 금지) | 출처표시 필수 |
| 퍼블릭 도메인 / CC0 (Wikimedia Commons — 파일 페이지의 라이선스 줄 확인) | O | O | 권장 |
| CC BY | O | O | 저작자·라이선스 필수 |
| CC BY-SA | O | 변형물도 BY-SA가 됨 — 가급적 그대로만 | 저작자·라이선스 필수 |
| Sillok 자체 이미지: 인물 썸네일, `node_images` 갤러리, 밈 렌더 PNG, Sillok 화면 캡처 (age-flow·타임라인) | O | O | 불필요 |
| 직접 만든 이미지·AI 생성 이미지 (실존 인물 비하·사실 왜곡 금지) | O | O | AI 생성이면 본문에 표기 |

조선 초상화(어진·공신 초상), 풍속화(김홍도·신윤복), 의궤·기록화, 고지도, 유물 사진은 대부분 공공누리 1유형이나 퍼블릭 도메인으로 구할 수 있다 — 먼저 여기서 찾는다.

## 금지 (운영자가 올리면 안 됨)

- 영화·드라마·웹툰·예능 캡처, 배우·연예인 사진 — 저작권 + 퍼블리시티권. 유저가 직접 올리는 건 신고 처리 체계(`/copyright`) 아래 허용되지만, **운영자가 올리거나 다른 계정으로 올리게 하는 건 안 된다** (제3자 행세 금지 원칙과도 충돌).
- 공공누리 2·4유형 (상업적 이용금지), CC NC·ND 계열
- 라이선스를 확인할 수 없는 구글 이미지 검색 결과, 뉴스 사진, 블로그 이미지
- 남의 밈 이미지 (형식만 빌린다 — `/write-meme` 참고)
- 유저가 올린 이미지를 홍보(Share kit)에 재사용 — Share kit가 자동으로 막는다

## 출처 표기

이미지를 쓴 스레드·아티클 본문 끝에 한 줄:

```
Image: Portrait of Yi Hwang, National Museum of Korea (KOGL Type 1)
Image: "Ssireum" by Kim Hong-do, public domain via Wikimedia Commons
```

## 올리는 방법: 핫링크 말고 업로드

외부 URL을 `thread_images.url`에 그대로 넣지 않는다 (원본이 바뀌거나 막히면 깨지고, 상대 서버에 부담). 받아서 `threads` 버킷에 올린 뒤 그 URL을 저장한다. jpeg/png/webp, 5MB 이하.

```bash
node --input-type=module -e "
import { sb, ADMIN_ID, out } from './scripts/sb.mjs';
const THREAD = '{thread_id}';
const images = [
  { src: '{source_image_url}', alt: '{what is shown + any text in the image}' },
];
const rows = [];
for (const [i, img] of images.entries()) {
  const res = await fetch(img.src);
  const type = res.headers.get('content-type') || '';
  if (!res.ok || !['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('bad image ' + img.src + ' ' + type);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 5 * 1024 * 1024) throw new Error('over 5MB ' + img.src);
  const path = ADMIN_ID + '/' + THREAD + '/img-' + Date.now() + '-' + i + '.' + type.split('/')[1].replace('jpeg', 'jpg');
  const up = await sb.storage.from('threads').upload(path, buf, { contentType: type });
  if (up.error) throw up.error;
  rows.push({ thread_id: THREAD, url: sb.storage.from('threads').getPublicUrl(path).data.publicUrl, alt: img.alt, sort_order: i });
}
out(await sb.from('thread_images').insert(rows).select('id, url'));
"
```

5MB가 넘으면 먼저 줄인다 — 프로젝트에 설치된 sharp로: `node -e "require('sharp')('in.jpg').resize(2000, 2000, { fit: 'inside' }).jpeg({ quality: 85 }).toFile('out.jpg')"` (변경금지인 3유형은 크기만 줄이고 크롭하지 않는다).
