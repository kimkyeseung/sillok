/**
 * 한국 영화·드라마 주요 인물 30명 일괄 등록 스크립트
 * 실행: npx tsx scripts/add-film-persons.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = value;
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PersonInput {
  slug: string;
  name_ko: string;
  name_hanja?: string;
  name_en: string;
  birth_year: number;
  birth_date?: string;
  death_year?: number;
  death_date?: string;
  birth_place?: string;
  summary: string;
  is_alive: boolean;
  is_published: boolean;
  tag_names: string[];
  timeline: {
    year: number;
    month?: number;
    title: string;
    description?: string;
    sort_order: number;
  }[];
}

const persons: PersonInput[] = [
  // ── 감독 7명 ──
  {
    slug: 'park-chan-wook',
    name_ko: '박찬욱',
    name_hanja: '朴贊郁',
    name_en: 'Park Chan-wook',
    birth_year: 1963,
    birth_date: '08-23',
    birth_place: 'Seoul',
    summary: 'A visionary filmmaker known for his stylistically bold and thematically complex works. His "Vengeance Trilogy" redefined Korean cinema on the world stage, and Oldboy won the Grand Prix at Cannes in 2004. He later won the Best Director award at Cannes for Decision to Leave in 2022, cementing his status as one of Asia\'s most influential directors.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1963, title: 'Born in Seoul', sort_order: 0 },
      { year: 2000, title: 'Joint Security Area Released', description: 'Became the highest-grossing Korean film at the time.', sort_order: 1 },
      { year: 2003, title: 'Oldboy Premieres', description: 'Won the Grand Prix at Cannes Film Festival.', sort_order: 2 },
      { year: 2009, title: 'Thirst at Cannes', description: 'Won the Jury Prize at Cannes.', sort_order: 3 },
      { year: 2016, title: 'The Handmaiden Released', description: 'Critical acclaim worldwide, selected for Cannes.', sort_order: 4 },
      { year: 2022, title: 'Wins Best Director at Cannes', description: 'Awarded for Decision to Leave.', sort_order: 5 },
    ],
  },
  {
    slug: 'kim-ki-duk',
    name_ko: '김기덕',
    name_hanja: '金基德',
    name_en: 'Kim Ki-duk',
    birth_year: 1960,
    birth_date: '12-20',
    death_year: 2020,
    death_date: '12-11',
    birth_place: 'Bonghwa, North Gyeongsang',
    summary: 'A self-taught filmmaker whose raw, minimalist style explored the margins of Korean society. He won the Golden Lion at Venice for Pieta in 2012 and the Silver Bear for Best Director at Berlin for Samaritan Girl in 2004. His career was later overshadowed by misconduct allegations.',
    is_alive: false,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1960, title: 'Born in Bonghwa', sort_order: 0 },
      { year: 2000, title: 'The Isle Screens at Venice', description: 'Gained international attention for his provocative style.', sort_order: 1 },
      { year: 2003, title: 'Spring, Summer, Fall, Winter... and Spring', description: 'Widely regarded as his most poetic work.', sort_order: 2 },
      { year: 2004, title: 'Silver Bear at Berlin', description: 'Won Best Director for Samaritan Girl.', sort_order: 3 },
      { year: 2012, title: 'Golden Lion at Venice', description: 'Won the top prize for Pieta.', sort_order: 4 },
      { year: 2020, title: 'Death', description: 'Died from COVID-19 complications in Latvia.', sort_order: 5 },
    ],
  },
  {
    slug: 'lee-chang-dong',
    name_ko: '이창동',
    name_hanja: '李滄東',
    name_en: 'Lee Chang-dong',
    birth_year: 1954,
    birth_date: '04-01',
    birth_place: 'Daegu',
    summary: 'A novelist-turned-filmmaker celebrated for deeply humanistic dramas. He served as South Korea\'s Minister of Culture and Tourism from 2003 to 2004. His films Burning and Poetry received worldwide critical acclaim, with Poetry winning Best Screenplay at Cannes in 2010.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1954, title: 'Born in Daegu', sort_order: 0 },
      { year: 1997, title: 'Directorial Debut with Green Fish', sort_order: 1 },
      { year: 2002, title: 'Oasis Wins at Venice', description: 'Won the Special Director\'s Award at Venice.', sort_order: 2 },
      { year: 2003, title: 'Appointed Minister of Culture', description: 'Served as South Korea\'s Minister of Culture and Tourism.', sort_order: 3 },
      { year: 2010, title: 'Poetry Wins at Cannes', description: 'Won Best Screenplay at Cannes Film Festival.', sort_order: 4 },
      { year: 2018, title: 'Burning Premieres', description: 'Became the highest-rated film in Cannes Screen history at the time.', sort_order: 5 },
    ],
  },
  {
    slug: 'hong-sang-soo',
    name_ko: '홍상수',
    name_hanja: '洪常秀',
    name_en: 'Hong Sang-soo',
    birth_year: 1960,
    birth_date: '10-25',
    birth_place: 'Seoul',
    summary: 'A prolific art-house director who has made over 30 films with a distinctive minimalist style, often exploring chance encounters over soju and conversation. He won the Silver Bear Grand Jury Prize at Berlin for The Woman Who Ran in 2020 and the Grand Jury Prize for The Novelist\'s Film in 2022.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1960, title: 'Born in Seoul', sort_order: 0 },
      { year: 1996, title: 'Debut: The Day a Pig Fell into the Well', description: 'Won multiple awards at Korean film festivals.', sort_order: 1 },
      { year: 2020, title: 'Silver Bear at Berlin', description: 'Won Grand Jury Prize for The Woman Who Ran.', sort_order: 2 },
      { year: 2022, title: 'Grand Jury Prize at Berlin', description: 'Won for The Novelist\'s Film.', sort_order: 3 },
    ],
  },
  {
    slug: 'hwang-dong-hyuk',
    name_ko: '황동혁',
    name_hanja: '黃東赫',
    name_en: 'Hwang Dong-hyuk',
    birth_year: 1971,
    birth_date: '09-26',
    birth_place: 'Seoul',
    summary: 'The creator, writer, and director of Squid Game, which became Netflix\'s most-watched series globally with over 1.65 billion viewing hours. He became the first Asian to win the Primetime Emmy for Outstanding Directing for a Drama Series in 2022.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1971, title: 'Born in Seoul', sort_order: 0 },
      { year: 2011, title: 'Silenced Released', description: 'Based on true events, led to legislative change in South Korea.', sort_order: 1 },
      { year: 2014, title: 'Miss Granny Released', description: 'Major box office hit remade across Asia.', sort_order: 2 },
      { year: 2021, title: 'Squid Game Season 1', description: 'Became Netflix\'s most-watched series of all time.', sort_order: 3 },
      { year: 2022, title: 'Emmy Award for Directing', description: 'First Asian to win Outstanding Directing for a Drama Series.', sort_order: 4 },
    ],
  },
  {
    slug: 'na-hong-jin',
    name_ko: '나홍진',
    name_hanja: '羅泓軫',
    name_en: 'Na Hong-jin',
    birth_year: 1974,
    birth_place: 'Seoul',
    summary: 'A genre filmmaker acclaimed for intense, visceral thrillers. His debut The Chaser was a box office sensation, and The Wailing became one of the most discussed Korean horror films internationally, blending supernatural elements with psychological tension.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1974, title: 'Born in Seoul', sort_order: 0 },
      { year: 2008, title: 'The Chaser Released', description: 'Debut feature became a major box office and critical hit.', sort_order: 1 },
      { year: 2010, title: 'The Yellow Sea', description: 'Selected for Cannes Un Certain Regard.', sort_order: 2 },
      { year: 2016, title: 'The Wailing Released', description: 'International sensation, competed at Cannes.', sort_order: 3 },
    ],
  },
  {
    slug: 'yeon-sang-ho',
    name_ko: '연상호',
    name_hanja: '延尚昊',
    name_en: 'Yeon Sang-ho',
    birth_year: 1978,
    birth_date: '06-25',
    birth_place: 'Seoul',
    summary: 'A director who transitioned from independent animation to mainstream blockbusters. Train to Busan became the first Korean film to break 10 million admissions in its opening weekend and a global zombie genre landmark. He also created the Netflix series Hellbound.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1978, title: 'Born in Seoul', sort_order: 0 },
      { year: 2011, title: 'The King of Pigs', description: 'Award-winning animated debut.', sort_order: 1 },
      { year: 2016, title: 'Train to Busan Released', description: 'Became a global phenomenon, screened at Cannes midnight section.', sort_order: 2 },
      { year: 2021, title: 'Hellbound on Netflix', description: 'Reached #1 on Netflix globally on release.', sort_order: 3 },
    ],
  },

  // ── 남자배우 8명 ──
  {
    slug: 'song-kang-ho',
    name_ko: '송강호',
    name_hanja: '宋康昊',
    name_en: 'Song Kang-ho',
    birth_year: 1967,
    birth_date: '01-17',
    birth_place: 'Gimhae, South Gyeongsang',
    summary: 'Widely regarded as South Korea\'s greatest living actor. He starred in many of the country\'s most acclaimed films including Parasite, Memories of Murder, and The Host. He won Best Actor at Cannes in 2022 for Broker, becoming the first Korean actor to receive the honor.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1967, title: 'Born in Gimhae', sort_order: 0 },
      { year: 2000, title: 'Joint Security Area', description: 'Breakthrough role in Park Chan-wook\'s blockbuster.', sort_order: 1 },
      { year: 2003, title: 'Memories of Murder', description: 'Iconic performance in Bong Joon-ho\'s crime masterpiece.', sort_order: 2 },
      { year: 2019, title: 'Parasite Wins Palme d\'Or', description: 'Starred in Bong Joon-ho\'s historic Cannes winner.', sort_order: 3 },
      { year: 2022, title: 'Best Actor at Cannes', description: 'Won for Broker, first Korean actor to receive the honor.', sort_order: 4 },
    ],
  },
  {
    slug: 'lee-byung-hun',
    name_ko: '이병헌',
    name_hanja: '李秉憲',
    name_en: 'Lee Byung-hun',
    birth_year: 1970,
    birth_date: '07-12',
    birth_place: 'Seoul',
    summary: 'One of the most internationally recognized Korean actors, known for both Korean cinema and Hollywood blockbusters. He starred in A Bittersweet Life, I Saw the Devil, and Masquerade domestically, while appearing in the G.I. Joe franchise, Terminator Genisys, and The Magnificent Seven in Hollywood.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1970, title: 'Born in Seoul', sort_order: 0 },
      { year: 2000, title: 'Joint Security Area', description: 'Rose to stardom alongside Song Kang-ho.', sort_order: 1 },
      { year: 2005, title: 'A Bittersweet Life', description: 'Screened at Cannes, regarded as a modern noir classic.', sort_order: 2 },
      { year: 2009, title: 'Hollywood Debut: G.I. Joe', description: 'Played Storm Shadow in the global franchise.', sort_order: 3 },
      { year: 2012, title: 'Masquerade', description: 'Won multiple Best Actor awards domestically.', sort_order: 4 },
    ],
  },
  {
    slug: 'lee-jung-jae',
    name_ko: '이정재',
    name_hanja: '李政宰',
    name_en: 'Lee Jung-jae',
    birth_year: 1972,
    birth_date: '12-15',
    birth_place: 'Seoul',
    summary: 'An acclaimed actor who achieved global stardom as Seong Gi-hun in Squid Game. He won the Screen Actors Guild Award and the Primetime Emmy for Outstanding Lead Actor in a Drama Series in 2022, becoming the first Asian actor to win the latter. Also debuted as director with Hunt.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1972, title: 'Born in Seoul', sort_order: 0 },
      { year: 1999, title: 'City of the Rising Sun', description: 'Won Best Actor at the Blue Dragon Film Awards.', sort_order: 1 },
      { year: 2012, title: 'The Thieves', description: 'Starred in the then-highest-grossing Korean film.', sort_order: 2 },
      { year: 2021, title: 'Squid Game Global Phenomenon', description: 'Became one of the most recognized Korean actors worldwide.', sort_order: 3 },
      { year: 2022, title: 'Emmy and SAG Awards', description: 'First Asian actor to win Emmy for Outstanding Lead Actor in a Drama.', sort_order: 4 },
    ],
  },
  {
    slug: 'choi-min-sik',
    name_ko: '최민식',
    name_hanja: '崔岷植',
    name_en: 'Choi Min-sik',
    birth_year: 1962,
    birth_date: '05-30',
    birth_place: 'Seoul',
    summary: 'A powerhouse actor known for transformative, physically demanding roles. His portrayal of Oh Dae-su in Oldboy is considered one of the greatest performances in Korean cinema history. He also starred in Nameless Gangster and I Saw the Devil.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1962, title: 'Born in Seoul', sort_order: 0 },
      { year: 1999, title: 'Shiri', description: 'Starred in the first Korean blockbuster to surpass Hollywood films domestically.', sort_order: 1 },
      { year: 2002, title: 'Chihwaseon', description: 'Won Best Actor at multiple Korean awards.', sort_order: 2 },
      { year: 2003, title: 'Oldboy', description: 'Iconic lead performance in Park Chan-wook\'s Cannes Grand Prix winner.', sort_order: 3 },
      { year: 2014, title: 'The Admiral: Roaring Currents', description: 'Played Admiral Yi Sun-sin in the highest-grossing Korean film ever.', sort_order: 4 },
    ],
  },
  {
    slug: 'ha-jung-woo',
    name_ko: '하정우',
    name_hanja: '河正宇',
    name_en: 'Ha Jung-woo',
    birth_year: 1978,
    birth_date: '03-11',
    birth_place: 'Seoul',
    summary: 'One of South Korea\'s most bankable actors, known for consistently appearing in hit films across genres. He starred in The Chaser, The Handmaiden, Along with the Gods, and 1987: When the Day Comes. His filmography has accumulated over 100 million admissions.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1978, title: 'Born in Seoul', sort_order: 0 },
      { year: 2008, title: 'The Chaser', description: 'Breakout role in the critically acclaimed thriller.', sort_order: 1 },
      { year: 2009, title: 'The Yellow Sea', description: 'Followed up with another intense thriller performance.', sort_order: 2 },
      { year: 2016, title: 'The Handmaiden', description: 'Starred in Park Chan-wook\'s international hit.', sort_order: 3 },
      { year: 2017, title: 'Along with the Gods', description: 'Led the fantasy blockbuster franchise surpassing 14 million viewers.', sort_order: 4 },
    ],
  },
  {
    slug: 'hwang-jung-min',
    name_ko: '황정민',
    name_hanja: '黃政民',
    name_en: 'Hwang Jung-min',
    birth_year: 1970,
    birth_date: '09-01',
    birth_place: 'Changnyeong, South Gyeongsang',
    summary: 'A versatile actor celebrated for seamlessly shifting between comedy, drama, and action. He has won the Blue Dragon Film Award for Best Actor four times. His filmography includes New World, Ode to My Father, A Taxi Driver, and Deliver Us from Evil.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1970, title: 'Born in Changnyeong', sort_order: 0 },
      { year: 2005, title: 'You Are My Sunshine', description: 'Won Best Actor at Blue Dragon Film Awards.', sort_order: 1 },
      { year: 2013, title: 'New World', description: 'Critically acclaimed crime film performance.', sort_order: 2 },
      { year: 2014, title: 'Ode to My Father', description: 'Surpassed 14 million admissions.', sort_order: 3 },
      { year: 2017, title: 'A Taxi Driver', description: 'Starred opposite Song Kang-ho in the political drama hit.', sort_order: 4 },
    ],
  },
  {
    slug: 'ma-dong-seok',
    name_ko: '마동석',
    name_en: 'Ma Dong-seok',
    birth_year: 1971,
    birth_date: '03-01',
    birth_place: 'Seoul',
    summary: 'Known internationally as Don Lee, he rose to fame through Train to Busan and the Roundup franchise, which shattered Korean box office records. He crossed into Hollywood with Marvel\'s Eternals in 2021, becoming one of the most recognizable Korean action stars globally.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1971, title: 'Born in Seoul', sort_order: 0 },
      { year: 2016, title: 'Train to Busan', description: 'Breakout role as the fan-favorite strongman.', sort_order: 1 },
      { year: 2021, title: 'Marvel\'s Eternals', description: 'Played Gilgamesh in the MCU film.', sort_order: 2 },
      { year: 2022, title: 'The Roundup', description: 'Launched the highest-grossing Korean franchise post-COVID.', sort_order: 3 },
    ],
  },
  {
    slug: 'gong-yoo',
    name_ko: '공유',
    name_hanja: '孔劉',
    name_en: 'Gong Yoo',
    birth_year: 1979,
    birth_date: '07-10',
    birth_place: 'Busan',
    summary: 'An actor who became a global Hallyu icon through the blockbuster film Train to Busan and the hit drama Goblin. His magnetic screen presence helped both properties achieve massive success across Asia and beyond, making him one of the most influential Korean actors in the streaming era.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1979, title: 'Born in Busan', sort_order: 0 },
      { year: 2007, title: 'Coffee Prince', description: 'Breakthrough K-drama role establishing him as a leading man.', sort_order: 1 },
      { year: 2016, title: 'Train to Busan', description: 'Led the zombie blockbuster to global success.', sort_order: 2 },
      { year: 2016, title: 'Goblin (Guardian)', description: 'Became one of the highest-rated K-dramas in cable TV history.', sort_order: 3 },
      { year: 2021, title: 'Squid Game Cameo', description: 'Memorable appearance in the global Netflix hit.', sort_order: 4 },
    ],
  },
  {
    slug: 'kang-dong-won',
    name_ko: '강동원',
    name_hanja: '姜棟元',
    name_en: 'Kang Dong-won',
    birth_year: 1981,
    birth_date: '01-18',
    birth_place: 'Busan',
    summary: 'An actor known for his striking visuals and versatile range across action, thriller, and drama genres. He starred in Broker alongside Song Kang-ho at Cannes, and appeared in Peninsula and 1987: When the Day Comes. He is considered one of the top leading men in Korean cinema.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1981, title: 'Born in Busan', sort_order: 0 },
      { year: 2003, title: 'Temptation of Wolves', description: 'Debut film establishing his star power.', sort_order: 1 },
      { year: 2017, title: '1987: When the Day Comes', description: 'Critically acclaimed political drama.', sort_order: 2 },
      { year: 2022, title: 'Broker at Cannes', description: 'Starred in Kore-eda Hirokazu\'s Korean-language film.', sort_order: 3 },
    ],
  },
  {
    slug: 'yoo-hae-jin',
    name_ko: '유해진',
    name_hanja: '柳海真',
    name_en: 'Yoo Hae-jin',
    birth_year: 1970,
    birth_date: '01-04',
    birth_place: 'Seoul',
    summary: 'A beloved character actor whose films have collectively drawn over 100 million viewers in South Korea. Known for his comedic timing and everyman charm, he has starred in Veteran, Confidential Assignment, and A Taxi Driver, consistently appearing in the country\'s biggest box office hits.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1970, title: 'Born in Seoul', sort_order: 0 },
      { year: 2009, title: 'Tidal Wave', description: 'Early leading role in the disaster film.', sort_order: 1 },
      { year: 2015, title: 'Veteran', description: 'Supporting role in the 13-million viewer hit.', sort_order: 2 },
      { year: 2017, title: 'A Taxi Driver / Confidential Assignment', description: 'Two major hits in a single year.', sort_order: 3 },
    ],
  },

  // ── 여자배우 10명 ──
  {
    slug: 'youn-yuh-jung',
    name_ko: '윤여정',
    name_hanja: '尹汝貞',
    name_en: 'Youn Yuh-jung',
    birth_year: 1947,
    birth_date: '06-19',
    birth_place: 'Kaesong',
    summary: 'A legendary Korean actress whose career spans over five decades. She won the Academy Award for Best Supporting Actress in 2021 for Minari, becoming the first Korean actor to win an Oscar. Known for her sharp wit and commanding presence in both film and television.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1947, title: 'Born in Kaesong', sort_order: 0 },
      { year: 1971, title: 'Film Debut: Woman of Fire', description: 'Starred in Kim Ki-young\'s landmark film.', sort_order: 1 },
      { year: 2010, title: 'The Housemaid Remake', description: 'Returned to the spotlight with a modern classic.', sort_order: 2 },
      { year: 2021, title: 'Academy Award for Minari', description: 'First Korean actor to win an Oscar.', sort_order: 3 },
    ],
  },
  {
    slug: 'jeon-do-yeon',
    name_ko: '전도연',
    name_hanja: '全道嬿',
    name_en: 'Jeon Do-yeon',
    birth_year: 1973,
    birth_date: '02-11',
    birth_place: 'Seoul',
    summary: 'Considered one of Korea\'s finest dramatic actresses. She won Best Actress at Cannes in 2007 for Secret Sunshine, becoming the first Korean actor to win a major acting award at the festival. Her filmography includes Untold Scandal, My Mother the Mermaid, and Kill Boksoon.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1973, title: 'Born in Seoul', sort_order: 0 },
      { year: 1997, title: 'A Promise', description: 'Early leading role establishing her dramatic range.', sort_order: 1 },
      { year: 2007, title: 'Best Actress at Cannes', description: 'Won for Secret Sunshine, a first for Korean cinema.', sort_order: 2 },
      { year: 2023, title: 'Kill Boksoon on Netflix', description: 'Action role that reached global audiences.', sort_order: 3 },
    ],
  },
  {
    slug: 'lee-young-ae',
    name_ko: '이영애',
    name_hanja: '李英愛',
    name_en: 'Lee Young-ae',
    birth_year: 1971,
    birth_date: '01-31',
    birth_place: 'Seoul',
    summary: 'Known as the face of the original Korean Wave, her role as Jang-geum in the historical drama Daejanggeum (Jewel in the Palace) became a cultural phenomenon across Asia, the Middle East, and Africa. She also starred in Park Chan-wook\'s Sympathy for Lady Vengeance.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1971, title: 'Born in Seoul', sort_order: 0 },
      { year: 2003, title: 'Daejanggeum (Jewel in the Palace)', description: 'Became one of the most-watched Korean dramas worldwide.', sort_order: 1 },
      { year: 2005, title: 'Sympathy for Lady Vengeance', description: 'Starred in Park Chan-wook\'s acclaimed trilogy finale.', sort_order: 2 },
    ],
  },
  {
    slug: 'kim-min-hee',
    name_ko: '김민희',
    name_hanja: '金敏喜',
    name_en: 'Kim Min-hee',
    birth_year: 1982,
    birth_date: '03-01',
    birth_place: 'Seoul',
    summary: 'An actress celebrated for her nuanced, naturalistic performances in auteur cinema. She won the Silver Bear for Best Actress at Berlin in 2017 for On the Beach at Night Alone. She has become the central muse of director Hong Sang-soo, starring in over a dozen of his films.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1982, title: 'Born in Seoul', sort_order: 0 },
      { year: 2016, title: 'The Handmaiden', description: 'Starred in Park Chan-wook\'s critically acclaimed film.', sort_order: 1 },
      { year: 2017, title: 'Silver Bear at Berlin', description: 'Won Best Actress for On the Beach at Night Alone.', sort_order: 2 },
    ],
  },
  {
    slug: 'jung-ho-yeon',
    name_ko: '정호연',
    name_hanja: '鄭浩妍',
    name_en: 'Jung Ho-yeon',
    birth_year: 1994,
    birth_date: '06-23',
    birth_place: 'Seoul',
    summary: 'A model-turned-actress who became a global sensation through her debut acting role as Kang Sae-byeok in Squid Game. She won the SAG Award for Outstanding Female Actor in a Drama Series in 2022, and was named one of Time\'s 100 Most Influential People.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1994, title: 'Born in Seoul', sort_order: 0 },
      { year: 2013, title: 'Korea\'s Next Top Model', description: 'Runner-up on Season 4, launching her modeling career.', sort_order: 1 },
      { year: 2021, title: 'Squid Game Debut', description: 'Acting debut became a global phenomenon.', sort_order: 2 },
      { year: 2022, title: 'SAG Award', description: 'Won for Outstanding Female Actor in a Drama Series.', sort_order: 3 },
    ],
  },
  {
    slug: 'bae-doona',
    name_ko: '배두나',
    name_hanja: '裴斗娜',
    name_en: 'Bae Doona',
    birth_year: 1979,
    birth_date: '10-11',
    birth_place: 'Seoul',
    summary: 'One of the most internationally active Korean actresses, known for crossing between Korean, Hollywood, and European cinema. She starred in Sympathy for Mr. Vengeance, The Host, Cloud Atlas, Sense8, and Kingdom. Her multilingual abilities have made her a rare global presence in Korean entertainment.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1979, title: 'Born in Seoul', sort_order: 0 },
      { year: 2000, title: 'Barking Dogs Never Bite', description: 'First collaboration with director Bong Joon-ho.', sort_order: 1 },
      { year: 2006, title: 'The Host', description: 'Starred in Bong Joon-ho\'s monster film blockbuster.', sort_order: 2 },
      { year: 2012, title: 'Cloud Atlas', description: 'Major role in the Wachowskis\' Hollywood production.', sort_order: 3 },
      { year: 2015, title: 'Sense8 on Netflix', description: 'Became known to global audiences through the sci-fi series.', sort_order: 4 },
      { year: 2019, title: 'Kingdom', description: 'Joined the hit Netflix Korean zombie period drama.', sort_order: 5 },
    ],
  },
  {
    slug: 'song-hye-kyo',
    name_ko: '송혜교',
    name_hanja: '宋慧喬',
    name_en: 'Song Hye-kyo',
    birth_year: 1981,
    birth_date: '11-22',
    birth_place: 'Daegu',
    summary: 'One of the defining faces of the Korean Wave, she rose to prominence through Autumn in My Heart and Full House, which were broadcast across Asia and the Middle East. Descendants of the Sun cemented her status as one of the most influential Korean actresses. She continues to lead top-rated dramas including The Glory on Netflix.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1981, title: 'Born in Daegu', sort_order: 0 },
      { year: 2000, title: 'Autumn in My Heart', description: 'Early Hallyu Wave drama that aired across Asia.', sort_order: 1 },
      { year: 2004, title: 'Full House', description: 'Became one of the most popular Korean dramas internationally.', sort_order: 2 },
      { year: 2016, title: 'Descendants of the Sun', description: 'Massive pan-Asian hit drama.', sort_order: 3 },
      { year: 2022, title: 'The Glory on Netflix', description: 'Global hit revenge drama.', sort_order: 4 },
    ],
  },
  {
    slug: 'han-so-hee',
    name_ko: '한소희',
    name_en: 'Han So-hee',
    birth_year: 1994,
    birth_date: '11-18',
    birth_place: 'Ulsan',
    summary: 'A rising actress who gained global recognition through Netflix series My Name and The Glory. Her intense performances in action and dramatic roles, combined with a strong international social media presence, have made her one of the most in-demand Korean actresses of the streaming era.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1994, title: 'Born in Ulsan', sort_order: 0 },
      { year: 2020, title: 'The World of the Married', description: 'Breakout role in the highest-rated Korean cable drama.', sort_order: 1 },
      { year: 2021, title: 'My Name on Netflix', description: 'Action role that reached global audiences.', sort_order: 2 },
      { year: 2022, title: 'The Glory', description: 'Major supporting role in the global Netflix hit.', sort_order: 3 },
    ],
  },
  {
    slug: 'tang-wei',
    name_ko: '탕웨이',
    name_en: 'Tang Wei',
    birth_year: 1979,
    birth_date: '10-07',
    birth_place: 'Wenzhou, China',
    summary: 'A Chinese actress who became deeply embedded in the Korean film industry. After her breakout in Ang Lee\'s Lust, Caution, she married Korean director Kim Tae-yong and starred in Park Chan-wook\'s Decision to Leave, which won Best Director at Cannes in 2022. She serves as a cultural bridge between Chinese and Korean cinema.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1979, title: 'Born in Wenzhou, China', sort_order: 0 },
      { year: 2007, title: 'Lust, Caution', description: 'Breakout role in Ang Lee\'s controversial drama.', sort_order: 1 },
      { year: 2011, title: 'Late Autumn', description: 'First Korean film, romantic drama with Hyun Bin.', sort_order: 2 },
      { year: 2022, title: 'Decision to Leave', description: 'Starred in Park Chan-wook\'s Cannes Best Director winner.', sort_order: 3 },
    ],
  },
  {
    slug: 'kim-tae-ri',
    name_ko: '김태리',
    name_hanja: '金泰梨',
    name_en: 'Kim Tae-ri',
    birth_year: 1990,
    birth_date: '04-24',
    birth_place: 'Seoul',
    summary: 'An actress who debuted spectacularly in Park Chan-wook\'s The Handmaiden, which screened at Cannes in 2016. She went on to lead the hit drama Twenty-Five Twenty-One and star in the sci-fi action film Alienoid. She is considered one of the most talented actresses of her generation.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1990, title: 'Born in Seoul', sort_order: 0 },
      { year: 2016, title: 'The Handmaiden', description: 'Film debut in Park Chan-wook\'s acclaimed film at Cannes.', sort_order: 1 },
      { year: 2018, title: 'Little Forest', description: 'Led the gentle slice-of-life film.', sort_order: 2 },
      { year: 2022, title: 'Twenty-Five Twenty-One', description: 'Led the hit coming-of-age K-drama.', sort_order: 3 },
    ],
  },
  {
    slug: 'bae-suzy',
    name_ko: '배수지',
    name_en: 'Bae Suzy',
    birth_year: 1994,
    birth_date: '10-10',
    birth_place: 'Gwangju',
    summary: 'A multi-talent who began as a member of K-pop group miss A before transitioning into acting. Her film debut in Architecture 101 was a major hit, and she went on to lead popular dramas including While You Were Sleeping and Vagabond. She is often cited as the archetypal K-pop to K-drama crossover success.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1994, title: 'Born in Gwangju', sort_order: 0 },
      { year: 2010, title: 'Debut with miss A', description: 'Debuted in the JYP Entertainment girl group.', sort_order: 1 },
      { year: 2012, title: 'Architecture 101', description: 'Film debut became a surprise box office hit.', sort_order: 2 },
      { year: 2017, title: 'While You Were Sleeping', description: 'Hit fantasy romance K-drama.', sort_order: 3 },
      { year: 2019, title: 'Vagabond', description: 'Led the big-budget action drama.', sort_order: 4 },
    ],
  },
  {
    slug: 'park-seo-jun',
    name_ko: '박서준',
    name_hanja: '朴敘俊',
    name_en: 'Park Seo-jun',
    birth_year: 1988,
    birth_date: '12-16',
    birth_place: 'Seoul',
    summary: 'A leading Korean actor known for hit dramas like Itaewon Class and What\'s Wrong with Secretary Kim, both of which became global streaming phenomena. He crossed into Hollywood with a role in Marvel\'s The Marvels in 2023 and starred in the Korean blockbuster Concrete Utopia.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1988, title: 'Born in Seoul', sort_order: 0 },
      { year: 2018, title: 'What\'s Wrong with Secretary Kim', description: 'Breakout romantic comedy K-drama.', sort_order: 1 },
      { year: 2020, title: 'Itaewon Class', description: 'Major Netflix K-drama hit.', sort_order: 2 },
      { year: 2023, title: 'The Marvels / Concrete Utopia', description: 'Marvel debut and Cannes-screened disaster film in the same year.', sort_order: 3 },
    ],
  },
  {
    slug: 'lee-min-ho',
    name_ko: '이민호',
    name_hanja: '李敏鎬',
    name_en: 'Lee Min-ho',
    birth_year: 1987,
    birth_date: '06-22',
    birth_place: 'Seoul',
    summary: 'One of the most prominent Hallyu stars globally, he rose to fame with Boys Over Flowers and The Heirs, both of which were broadcast in over 30 countries. He is one of the most-followed Korean actors on social media worldwide, making him a key figure in the global spread of K-drama culture.',
    is_alive: true,
    is_published: true,
    tag_names: ['근현대', '문화/예능'],
    timeline: [
      { year: 1987, title: 'Born in Seoul', sort_order: 0 },
      { year: 2009, title: 'Boys Over Flowers', description: 'Became a pan-Asian phenomenon and Hallyu icon.', sort_order: 1 },
      { year: 2013, title: 'The Heirs', description: 'Another globally successful K-drama.', sort_order: 2 },
      { year: 2016, title: 'Legend of the Blue Sea', description: 'Hit fantasy romance drama.', sort_order: 3 },
      { year: 2020, title: 'The King: Eternal Monarch', description: 'Big-budget Netflix K-drama.', sort_order: 4 },
    ],
  },
];

// ── 실행 ──

async function main() {
  console.log(`\n🎬 Adding ${persons.length} film/drama persons...\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const input of persons) {
    const { tag_names, timeline, ...personData } = input;

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('persons')
      .select('id')
      .eq('slug', input.slug)
      .single();

    if (existing) {
      console.log(`⏭️  SKIP: ${input.name_en} (${input.slug}) — already exists`);
      skipped++;
      continue;
    }

    // Insert person
    const { data: person, error } = await supabase
      .from('persons')
      .insert(personData)
      .select()
      .single();

    if (error) {
      console.log(`❌ FAIL: ${input.name_en} — ${error.message}`);
      failed++;
      continue;
    }

    // Insert tags
    if (tag_names && tag_names.length > 0) {
      const { data: tags } = await supabase
        .from('tags')
        .select('id, name_ko')
        .in('name_ko', tag_names);

      if (tags && tags.length > 0) {
        await supabase.from('person_tags').insert(
          tags.map((t) => ({ person_id: person.id, tag_id: t.id }))
        );
      }
    }

    // Insert timeline
    if (timeline && timeline.length > 0) {
      await supabase.from('person_timeline').insert(
        timeline.map((item, idx) => ({
          person_id: person.id,
          year: item.year,
          month: item.month,
          title: item.title,
          description: item.description,
          sort_order: item.sort_order ?? idx,
        }))
      );
    }

    console.log(`✅ OK: ${input.name_en} (${input.slug})`);
    success++;
  }

  console.log(`\n── Results ──`);
  console.log(`✅ Created: ${success}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`Total:     ${persons.length}\n`);
}

main().catch(console.error);
