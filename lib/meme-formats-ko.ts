import type { TemplateFormat } from './meme-formats';

// ─── Korean labels for the admin UI ───
// The catalog (lib/meme-formats.ts) stays English because it also feeds
// Claude's prompts. Admin pages read labels from here; a test checks every
// format and field has one.

export interface FormatKo {
  label: string;
  description: string;
  /** Shown above the editor fields */
  structure: string;
  /** Field key → label (nested row fields included by their own key) */
  fields: Record<string, string>;
}

export const FORMAT_KO: Record<TemplateFormat, FormatKo> = {
  'feels-bro': {
    label: 'I know that feel bro',
    description: '같은 고생·인연을 겪은 두 인물',
    structure: '두 인물이 서로 공감하는 구도. 왼쪽 = 인물 1의 고생, 오른쪽 = 인물 2의 비슷한 고생, 아래 = 펀치라인.',
    fields: { left: '인물 1 캡션', right: '인물 2 캡션', bottom: '펀치라인' },
  },
  drake: {
    label: '거부 / 선호 (Drake)',
    description: '한 인물이 하나는 거부하고 하나는 고르는 구도',
    structure: '인물 1이 한 가지를 거부하고 다른 것을 고릅니다. 인물 2는 맥락용입니다.',
    fields: { reject: '거부하는 것', prefer: '고르는 것' },
  },
  'virgin-chad': {
    label: 'Virgin vs Chad',
    description: '라이벌 두 인물의 특징 비교 (첫째 = virgin, 둘째 = chad)',
    structure: '인물 1은 virgin, 인물 2는 chad. 서로 대응되는 짧은 특징을 3개씩.',
    fields: { virgin: 'Virgin 특징 (인물 1)', chad: 'Chad 특징 (인물 2)' },
  },
  'its-over': {
    label: "It's over",
    description: '한 인물의 최악의 순간 (전쟁, 유배, 패배)',
    structure: '위 = 1인칭 상황 ("me when…"), 아래 = 펀치라인.',
    fields: { top: '상황 (1인칭)', bottom: '펀치라인' },
  },
  review: {
    label: '구글 리뷰',
    description: '인물이 장소·왕조·기관에 별점 리뷰를 남김',
    structure: '인물이 온라인 리뷰를 씁니다: 리뷰 대상, 별점, 방문 메모(선택), 짧은 후기.',
    fields: { place: '리뷰 대상', stars: '별점 (1–5)', when: '방문 메모 (예: "1653 · stayed 13 years")', body: '후기' },
  },
  'starter-pack': {
    label: '스타터팩',
    description: '어떤 유형의 사람이 꼭 가진 것들',
    structure: '제목은 사람의 유형("Joseon scholar starter pack"), 항목은 그 유형이 가진 것 3~5개.',
    fields: { title: '제목 (… starter pack)', items: '항목 (3–5개)' },
  },
  'tier-list': {
    label: '티어표',
    description: '인물이나 대상을 S~F 등급으로 순위 매기기',
    structure: '제목 = 무엇을 매기는지, 행 = 높은 등급부터(S, A, B, C, D, F) 각 1~4개.',
    fields: { title: '제목', rows: '등급', tier: '등급', items: '항목' },
  },
  'expectation-reality': {
    label: '기대 vs 현실',
    description: '인물이 기대한 것과 실제로 일어난 일',
    structure: '두 칸: 인물 1이 기대한 것 / 실제로 일어난 일.',
    fields: { expectation: '기대', reality: '현실' },
  },
  texting: {
    label: '문자 대화',
    description: '두 인물의 가상 채팅',
    structure: '인물 1(오른쪽, 보낸 사람)과 인물 2(왼쪽)의 채팅. 짧은 메시지 3~7개, 마지막 메시지에서 웃음이 터지게.',
    fields: { messages: '메시지', from: '보낸 사람', text: '메시지' },
  },
  'how-it-started': {
    label: "How it started / How it's going",
    description: '같은 인물의 처음과 나중',
    structure: '두 칸: 어떤 일의 시작 / 그 결과. 같은 인물.',
    fields: { started: '처음 (How it started)', going: "지금 (How it's going)" },
  },
  'nobody-me': {
    label: 'Nobody: / Me:',
    description: '아무도 안 시켰는데 인물이 하는 일',
    structure: '"Nobody:" 고정 문구 다음에, 아무도 부탁하지 않았는데 인물이 한 일.',
    fields: { reaction: '인물이 알아서 한 일' },
  },
  pov: {
    label: 'POV',
    description: '어떤 시점에서 본 한 줄 상황',
    structure: '"POV:" 없이 한 줄 상황을 쓰면, 얼굴이 그 인물의 반응이 됩니다.',
    fields: { pov: '상황 ("POV:" 제외)', bottom: '아래 캡션 (선택)' },
  },
  'tell-me': {
    label: 'Tell me without telling me',
    description: '"Tell me you\'re X without telling me you\'re X"',
    structure: '위 문장은 고정: "Tell me you\'re {정체} without telling me you\'re {정체}". 인물의 대답이 정체를 드러냅니다.',
    fields: { identity: '정체 (예: "a Joseon king")', answer: '인물의 대답' },
  },
};

export const formatKo = (f: TemplateFormat) => FORMAT_KO[f];
