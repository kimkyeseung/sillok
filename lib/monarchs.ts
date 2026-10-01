/**
 * Monarch lists per dynasty — the "Kings of Joseon" navbox on person pages.
 * Full succession (1st → last) so gaps show where a ruler has no page yet;
 * `slug` only for rulers that have a person record. Linked only when published.
 */

export interface Monarch {
  en: string;
  ko: string;
  slug?: string;
}

export interface Dynasty {
  id: string;
  /** Navbox title, e.g. "Kings of Joseon" */
  title: string;
  /** "Joseon" — the list page heading ("List of Joseon monarchs") */
  name: string;
  ko: string;
  /** Years the dynasty lasted (negative = BCE) */
  start: number;
  end: number;
  /** One-paragraph intro for the list page */
  intro: string;
  monarchs: Monarch[];
}

const m = (en: string, ko: string, slug?: string): Monarch => ({
  en,
  ko,
  slug,
});

export const DYNASTIES: Dynasty[] = [
  {
    id: 'goguryeo',
    title: 'Kings of Goguryeo',
    name: 'Goguryeo',
    ko: '고구려',
    start: -37,
    end: 668,
    intro:
      'Goguryeo was one of the Three Kingdoms of Korea, stretching across the northern Korean Peninsula and Manchuria at its height under Gwanggaeto the Great and Jangsu, until it fell to the Silla–Tang alliance in 668.',
    monarchs: [
      m('Dongmyeong', '동명성왕', 'jumong'),
      m('Yuri', '유리왕'),
      m('Daemusin', '대무신왕', 'daemusin-of-goguryeo'),
      m('Minjung', '민중왕'),
      m('Mobon', '모본왕'),
      m('Taejo', '태조왕'),
      m('Chadae', '차대왕'),
      m('Sindae', '신대왕'),
      m('Gogukcheon', '고국천왕', 'gogukcheon-of-goguryeo'),
      m('Sansang', '산상왕'),
      m('Dongcheon', '동천왕'),
      m('Jungcheon', '중천왕'),
      m('Seocheon', '서천왕'),
      m('Bongsang', '봉상왕'),
      m('Micheon', '미천왕'),
      m('Gogugwon', '고국원왕'),
      m('Sosurim', '소수림왕'),
      m('Gogugyang', '고국양왕'),
      m('Gwanggaeto', '광개토왕', 'gwanggaeto-the-great'),
      m('Jangsu', '장수왕', 'jangsu-of-goguryeo'),
      m('Munjamyeong', '문자명왕'),
      m('Anjang', '안장왕'),
      m('Anwon', '안원왕'),
      m('Yangwon', '양원왕'),
      m('Pyeongwon', '평원왕'),
      m('Yeongyang', '영양왕'),
      m('Yeongnyu', '영류왕'),
      m('Bojang', '보장왕'),
    ],
  },
  {
    id: 'baekje',
    title: 'Kings of Baekje',
    name: 'Baekje',
    ko: '백제',
    start: -18,
    end: 660,
    intro:
      'Baekje was one of the Three Kingdoms of Korea, ruling the southwest of the peninsula and passing Buddhism, writing and craftsmanship on to Japan before it fell to the Silla–Tang alliance in 660.',
    monarchs: [
      m('Onjo', '온조왕', 'onjo-of-baekje'),
      m('Daru', '다루왕'),
      m('Giru', '기루왕'),
      m('Gaeru', '개루왕'),
      m('Chogo', '초고왕'),
      m('Gusu', '구수왕'),
      m('Saban', '사반왕'),
      m('Goi', '고이왕'),
      m('Chaekgye', '책계왕'),
      m('Bunseo', '분서왕'),
      m('Biryu', '비류왕'),
      m('Gye', '계왕'),
      m('Geunchogo', '근초고왕', 'geunchogo-of-baekje'),
      m('Geungusu', '근구수왕'),
      m('Chimnyu', '침류왕'),
      m('Jinsa', '진사왕'),
      m('Asin', '아신왕'),
      m('Jeonji', '전지왕'),
      m('Guisin', '구이신왕'),
      m('Biyu', '비유왕'),
      m('Gaero', '개로왕'),
      m('Munju', '문주왕'),
      m('Samgeun', '삼근왕'),
      m('Dongseong', '동성왕'),
      m('Muryeong', '무령왕'),
      m('Seong', '성왕', 'seong-of-baekje'),
      m('Wideok', '위덕왕'),
      m('Hye', '혜왕'),
      m('Beop', '법왕'),
      m('Mu', '무왕', 'mu-of-baekje'),
      m('Uija', '의자왕', 'uija-of-baekje'),
    ],
  },
  {
    id: 'silla',
    title: 'Rulers of Silla',
    name: 'Silla',
    ko: '신라',
    start: -57,
    end: 935,
    intro:
      'Silla was one of the Three Kingdoms of Korea and, after defeating Baekje and Goguryeo, unified most of the peninsula — ruled by kings and three reigning queens from Gyeongju until it surrendered to Goryeo in 935.',
    monarchs: [
      m('Hyeokgeose', '혁거세 거서간', 'bak-hyeokgeose'),
      m('Namhae', '남해 차차웅'),
      m('Yuri', '유리 이사금'),
      m('Talhae', '탈해 이사금'),
      m('Pasa', '파사 이사금'),
      m('Jima', '지마 이사금'),
      m('Ilseong', '일성 이사금'),
      m('Adalla', '아달라 이사금'),
      m('Beolhyu', '벌휴 이사금'),
      m('Naehae', '내해 이사금'),
      m('Jobun', '조분 이사금'),
      m('Cheomhae', '첨해 이사금'),
      m('Michu', '미추 이사금'),
      m('Yurye', '유례 이사금'),
      m('Girim', '기림 이사금'),
      m('Heulhae', '흘해 이사금'),
      m('Naemul', '내물 마립간'),
      m('Silseong', '실성 마립간'),
      m('Nulji', '눌지 마립간'),
      m('Jabi', '자비 마립간'),
      m('Soji', '소지 마립간'),
      m('Jijeung', '지증왕'),
      m('Beopheung', '법흥왕'),
      m('Jinheung', '진흥왕', 'jinheung-of-silla'),
      m('Jinji', '진지왕'),
      m('Jinpyeong', '진평왕', 'jinpyeong-of-silla'),
      m('Queen Seondeok', '선덕여왕', 'seondeok-of-silla'),
      m('Queen Jindeok', '진덕여왕'),
      m('Muyeol', '태종 무열왕', 'kim-chunchu'),
      m('Munmu', '문무왕'),
      m('Sinmun', '신문왕'),
      m('Hyoso', '효소왕'),
      m('Seongdeok', '성덕왕'),
      m('Hyoseong', '효성왕'),
      m('Gyeongdeok', '경덕왕'),
      m('Hyegong', '혜공왕'),
      m('Seondeok', '선덕왕'),
      m('Wonseong', '원성왕'),
      m('Soseong', '소성왕'),
      m('Aejang', '애장왕'),
      m('Heondeok', '헌덕왕'),
      m('Heungdeok', '흥덕왕'),
      m('Huigang', '희강왕'),
      m('Minae', '민애왕'),
      m('Sinmu', '신무왕'),
      m('Munseong', '문성왕'),
      m('Heonan', '헌안왕'),
      m('Gyeongmun', '경문왕'),
      m('Heongang', '헌강왕'),
      m('Jeonggang', '정강왕'),
      m('Queen Jinseong', '진성여왕', 'queen-jinseong'),
      m('Hyogong', '효공왕'),
      m('Sindeok', '신덕왕'),
      m('Gyeongmyeong', '경명왕'),
      m('Gyeongae', '경애왕'),
      m('Gyeongsun', '경순왕'),
    ],
  },
  {
    id: 'balhae',
    title: 'Kings of Balhae',
    name: 'Balhae',
    ko: '발해',
    start: 698,
    end: 926,
    intro:
      'Balhae was founded by Dae Jo-yeong, a former Goguryeo general, and ruled Manchuria and the northern peninsula as “the flourishing land in the east” until the Khitan conquered it in 926.',
    monarchs: [
      m('Go', '고왕', 'dae-joyeong'),
      m('Mu', '무왕'),
      m('Mun', '문왕'),
      m('Dae Won-ui', '대원의'),
      m('Seong', '성왕'),
      m('Gang', '강왕'),
      m('Jeong', '정왕'),
      m('Hui', '희왕'),
      m('Gan', '간왕'),
      m('Seon', '선왕'),
      m('Dae Ijin', '대이진'),
      m('Dae Geonhwang', '대건황'),
      m('Dae Hyeonseok', '대현석'),
      m('Dae Wihae', '대위해'),
      m('Dae Inseon', '대인선'),
    ],
  },
  {
    id: 'goryeo',
    title: 'Kings of Goryeo',
    name: 'Goryeo',
    ko: '고려',
    start: 918,
    end: 1392,
    intro:
      'Goryeo, founded by Wang Geon, reunified the Later Three Kingdoms and gave Korea its English name; it is known for celadon, the Tripitaka Koreana and the Mongol invasions, and ended when Yi Seong-gye founded Joseon in 1392.',
    monarchs: [
      m('Taejo', '태조', 'taejo-wang-geon'),
      m('Hyejong', '혜종', 'hyejong-wang-mu'),
      m('Jeongjong', '정종', 'jeongjong-wang-yo'),
      m('Gwangjong', '광종', 'gwangjong-wang-so'),
      m('Gyeongjong', '경종', 'gyeongjong-wang-ju'),
      m('Seongjong', '성종', 'seongjong-wang-chi'),
      m('Mokjong', '목종', 'mokjong-wang-song'),
      m('Hyeonjong', '현종', 'hyeonjong-wang-sun'),
      m('Deokjong', '덕종', 'deokjong-wang-heum'),
      m('Jeongjong II', '정종', 'jeongjong-wang-hyeong'),
      m('Munjong', '문종', 'munjong-wang-hwi'),
      m('Sunjong', '순종', 'sunjong-wang-hun'),
      m('Seonjong', '선종', 'seonjong-wang-un'),
      m('Heonjong', '헌종', 'heonjong-wang-uk'),
      m('Sukjong', '숙종', 'sukjong-wang-hui'),
      m('Yejong', '예종', 'yejong-wang-u'),
      m('Injong', '인종', 'injong-wang-hae'),
      m('Uijong', '의종', 'uijong-wang-hyeon'),
      m('Myeongjong', '명종', 'myeongjong-wang-ho'),
      m('Sinjong', '신종', 'sinjong-wang-tak'),
      m('Huijong', '희종', 'huijong-wang-yeong'),
      m('Gangjong', '강종', 'gangjong-wang-suk'),
      m('Gojong', '고종', 'gojong-wang-cheol'),
      m('Wonjong', '원종', 'wonjong-wang-jeong'),
      m('Chungnyeol', '충렬왕', 'chungnyeol-wang-wang-geo'),
      m('Chungseon', '충선왕', 'chungseon-wang-wang-jang'),
      m('Chungsuk', '충숙왕', 'chungsuk-wang-wang-man'),
      m('Chunghye', '충혜왕', 'chung-hye-wang-wang-jeong'),
      m('Chungmok', '충목왕', 'chungmok-wang-wang-heun'),
      m('Chungjeong', '충정왕', 'chungjeong-wang-wang-jeo'),
      m('Gongmin', '공민왕', 'gongmin-wang-wang-jeon'),
      m('U', '우왕', 'u-wang-wang-u'),
      m('Chang', '창왕', 'chang-wang-wang-chang'),
      m('Gongyang', '공양왕', 'gongyang-wang-wang-yo'),
    ],
  },
  {
    id: 'joseon',
    title: 'Kings of Joseon',
    name: 'Joseon',
    ko: '조선',
    start: 1392,
    end: 1897,
    intro:
      'Joseon was Korea’s longest-ruling dynasty, founded by Yi Seong-gye (Taejo) in 1392. Its kings oversaw the creation of Hangul, Confucian statecraft and the Annals of the Joseon Dynasty, until Gojong proclaimed the Korean Empire in 1897.',
    monarchs: [
      m('Taejo', '태조', 'taejo-yi-seong-gye'),
      m('Jeongjong', '정종', 'jeongjong-yi-bang-gwa'),
      m('Taejong', '태종', 'taejong-yi-bang-won'),
      m('Sejong', '세종', 'sejong-daewang'),
      m('Munjong', '문종', 'munjong-yi-hyang'),
      m('Danjong', '단종', 'danjong-yi-hong-wi'),
      m('Sejo', '세조', 'sejo-yi-yu'),
      m('Yejong', '예종', 'yejong-yi-hwang'),
      m('Seongjong', '성종', 'seongjong-yi-hyeol'),
      m('Yeonsangun', '연산군', 'yeonsangun-yi-yung'),
      m('Jungjong', '중종', 'jungjong-yi-yeok'),
      m('Injong', '인종', 'injong-yi-ho'),
      m('Myeongjong', '명종', 'myeongjong-yi-hwan'),
      m('Seonjo', '선조', 'seonjo-yi-yeon'),
      m('Gwanghaegun', '광해군', 'gwanghaegun-yi-hon'),
      m('Injo', '인조', 'injo-yi-jong'),
      m('Hyojong', '효종', 'hyojong-yi-ho'),
      m('Hyeonjong', '현종', 'hyeonjong-yi-yeon'),
      m('Sukjong', '숙종', 'sukjong-yi-sun'),
      m('Gyeongjong', '경종', 'gyeongjong-yi-yun'),
      m('Yeongjo', '영조', 'yeongjo-yi-geum'),
      m('Jeongjo', '정조', 'jeongjo-yi-san'),
      m('Sunjo', '순조', 'sunjo-yi-gong'),
      m('Heonjong', '헌종', 'heonjong-yi-hwan'),
      m('Cheoljong', '철종', 'cheoljong-yi-byeon'),
      m('Gojong', '고종', 'gojong-yi-myeong-bok'),
      m('Sunjong', '순종', 'sunjong-yi-cheok'),
    ],
  },
  {
    id: 'korean-empire',
    title: 'Emperors of the Korean Empire',
    name: 'Korean Empire',
    ko: '대한제국',
    start: 1897,
    end: 1910,
    intro:
      'The Korean Empire was proclaimed by Gojong in 1897 to assert independence and modernize the state; it had two emperors before Japan annexed Korea in 1910.',
    monarchs: [
      m('Gwangmu (Gojong)', '광무제', 'gojong-yi-myeong-bok'),
      m('Yunghui (Sunjong)', '융희제', 'sunjong-yi-cheok'),
    ],
  },
];

/** Short name in a dynasty's list: ("sejong-daewang", "joseon") → "Sejong" */
export function monarchName(slug: string, dynastyId: string): string | null {
  const d = DYNASTIES.find((x) => x.id === dynastyId);
  return d?.monarchs.find((x) => x.slug === slug)?.en ?? null;
}

/** Dynasties this person ruled (Gojong → Joseon + Korean Empire) */
export function dynastiesOf(slug: string): Dynasty[] {
  return DYNASTIES.filter((d) => d.monarchs.some((x) => x.slug === slug));
}

/** 1 → "1st", 22 → "22nd" */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

export const findDynasty = (id: string): Dynasty | undefined => DYNASTIES.find((d) => d.id === id);

/** List page for a dynasty's rulers */
export const dynastyPath = (d: Dynasty) => `/monarchs/${d.id}`;

/** "Kings of Joseon" → "King of Joseon" */
export const rulerTitle = (d: Dynasty) => d.title.replace(/^(\w+)s\b/, '$1');

/**
 * A ruler's place in each dynasty: ["4th King of Joseon"].
 * Gojong → ["26th King of Joseon", "1st Emperor of the Korean Empire"].
 */
export function rulerRoles(slug: string): { dynasty: Dynasty; label: string }[] {
  return DYNASTIES.flatMap((d) => {
    const i = d.monarchs.findIndex((x) => x.slug === slug);
    return i < 0 ? [] : [{ dynasty: d, label: `${ordinal(i + 1)} ${rulerTitle(d)}` }];
  });
}

/** -37 → "37 BCE" */
export const formatEraYear = (y: number) => (y < 0 ? `${-y} BCE` : String(y));

export interface ReignInfo {
  reign_start: number;
  reign_end: number;
  slug: string;
  name_en: string;
  name_ko: string;
  thumbnail: string | null;
  /** Dynasty id (DYNASTIES) — one ruler per dynasty is shown */
  dynasty: string;
  /** Name within the dynasty list ("Sejong") — the header has no room for "Sejong the Great" */
  short_en: string;
}

/**
 * Rulers on the throne in `year`, one per dynasty (the Three Kingdoms can have several).
 * In a handover year the successor wins. Ordered by DYNASTIES.
 */
export function reigningAt(reigns: ReignInfo[], year: number): ReignInfo[] {
  const byDynasty = new Map<string, ReignInfo>();
  for (const r of reigns) {
    if (year < r.reign_start || year > r.reign_end) continue;
    const prev = byDynasty.get(r.dynasty);
    if (!prev || r.reign_start > prev.reign_start) byDynasty.set(r.dynasty, r);
  }
  const order = (id: string) => {
    const i = DYNASTIES.findIndex((d) => d.id === id);
    return i < 0 ? DYNASTIES.length : i;
  };
  return [...byDynasty.values()].sort(
    (a, b) => order(a.dynasty) - order(b.dynasty)
  );
}

// ─── Dynasty list page ───

export interface RosterPerson {
  id: string;
  slug: string;
  name_en: string;
  name_hanja: string | null;
  thumbnail: string | null;
  summary: string | null;
  birth_year: number | null;
  death_year: number | null;
}

export interface RosterEntry {
  /** 1-based place in the succession */
  order: number;
  monarch: Monarch;
  /** Published page, if any */
  person: RosterPerson | null;
  /** Reigns in this dynasty's span (Gojong's Korean Empire years belong to the other list) */
  reigns: { start: number; end: number }[];
}

/** Full succession joined with published pages and their reigns in this dynasty's years */
export function buildRoster(
  dynasty: Dynasty,
  persons: RosterPerson[],
  reigns: { person_id: string; reign_start: number; reign_end: number }[]
): RosterEntry[] {
  const bySlug = new Map(persons.map((p) => [p.slug, p]));
  return dynasty.monarchs.map((monarch, i) => {
    const person = (monarch.slug && bySlug.get(monarch.slug)) || null;
    const all = person
      ? reigns
          .filter((r) => r.person_id === person.id)
          .sort((a, b) => a.reign_start - b.reign_start)
          .map((r) => ({ start: r.reign_start, end: r.reign_end }))
      : [];
    // A reign starting in the dynasty's last year belongs to its successor (Gojong 1897 → Korean Empire);
    // none inside the span (Sunjong, counted in both lists) → show them all
    const inSpan = all.filter((r) => r.start >= dynasty.start && r.start < dynasty.end);
    const own = inSpan.length ? inSpan : all;
    return { order: i + 1, monarch, person, reigns: own };
  });
}

/** "1418–1450", "57 BCE–4"; several reigns joined ("1863–1897") */
export const formatReigns = (reigns: { start: number; end: number }[]) =>
  reigns.map((r) => (r.start === r.end ? formatEraYear(r.start) : `${formatEraYear(r.start)}–${formatEraYear(r.end)}`)).join(', ');

/** Fewer published rulers than this → the list page is mostly gaps: noindex, not in the sitemap */
export const DYNASTY_PAGE_MIN_LINKED = 5;

export const linkedCount = (dynasty: Dynasty, publishedSlugs: Set<string>) =>
  dynasty.monarchs.filter((x) => x.slug && publishedSlugs.has(x.slug)).length;
