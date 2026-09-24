/**
 * AI-drafted editorial content for notable figures (pilot expansion after the Joseon kings).
 * Seeded with is_ai_generated = true → shown with an "AI draft" label until reviewed.
 *
 * Kept to well-established facts. Quotations are limited to widely published,
 * attributable texts (Nanjung Ilgi, Dansimga, Seong Sam-mun's death poem,
 * An Jung-geun's calligraphy, Kim Gu's "My Wish").
 */

const ANNALS = {
  kind: 'PRIMARY',
  title: 'Veritable Records of the Joseon Dynasty',
  url: 'https://sillok.history.go.kr/search/inspectionList.do',
  citation: 'National Institute of Korean History',
};
const wiki = (page) => ({
  kind: 'ENCYCLOPEDIA',
  title: `Wikipedia — ${page.replace(/_/g, ' ')}`,
  url: `https://en.wikipedia.org/wiki/${page}`,
});

export const NOTABLE_FIGURES = [
  // ── Sejong's court ──
  {
    slug: 'jang-yeong-sil',
    facts: [
      { label: 'Known for', value: 'Inventor and engineer of Sejong\'s court' },
      { label: 'Origin', value: 'Born a government slave in Dongnae' },
      { label: 'Highest rank', value: 'Daehogun (military, junior 3rd rank)' },
      { label: 'Patron', linkedSlug: 'sejong-daewang' },
    ],
    achievements: [
      { year: 1434, title: 'Built the Jagyeongnu water clock', body: 'An automatic striking water clock that announced the hours with bells, drums and gongs.' },
      { year: 1438, title: 'Created the Okru astronomical clock', body: 'Installed in the Heumgyeonggak pavilion of Gyeongbokgung, it combined timekeeping with a model of the seasons.' },
      { title: 'Rose from slavery to high office', body: 'Sejong freed him and granted him court rank for his technical genius — a rare leap in a rigidly hierarchical society.' },
    ],
    trivia: [
      { title: 'He vanished from the records', body: 'In 1442 a royal palanquin he supervised broke; he was dismissed and nothing certain is known of him afterwards.' },
    ],
    sources: [ANNALS, wiki('Jang_Yeong-sil')],
  },
  {
    slug: 'hwang-hui',
    facts: [
      { label: 'Pen name', value: 'Bangchon' },
      { label: 'Highest office', value: 'Chief State Councillor (Yeonguijeong)' },
      { label: 'Served under', value: 'Taejo, Jeongjong, Taejong and Sejong' },
      { label: 'Known for', value: 'Integrity and frugality' },
    ],
    achievements: [
      { year: 1431, title: 'Eighteen years as Chief State Councillor', body: 'Led Sejong\'s government from 1431 to 1449, the longest tenure in that office.' },
      { year: 1418, title: 'Opposed the change of crown prince', body: 'Objected when Taejong replaced Crown Prince Yangnyeong and was exiled for it, until he was recalled in 1422.' },
    ],
    trivia: [
      { title: '"You are right, too"', body: 'A famous anecdote has him telling two quarrelling servants they were both right — and his wife that she was right as well.' },
    ],
    sources: [ANNALS, wiki('Hwang_Hui')],
  },
  {
    slug: 'kim-jong-seo',
    facts: [
      { label: 'Pen name', value: 'Jeoljae' },
      { label: 'Highest office', value: 'Left State Councillor' },
      { label: 'Nickname', value: '"The Great Tiger"' },
    ],
    achievements: [
      { year: 1433, title: 'Established the Six Garrisons', body: 'Pushed Joseon\'s northeastern frontier to the Duman River by building six fortified garrisons.' },
      { year: 1451, title: 'Compiled the History of Goryeo', body: 'Led the compilation of Goryeosa and the abridged Goryeosa Jeoryo.' },
      { year: 1453, title: 'Killed in the Gyeyu Jeongnan', body: 'As the senior minister protecting young King Danjong, he was the first target of Grand Prince Suyang\'s coup.' },
    ],
    trivia: [],
    sources: [ANNALS, wiki('Kim_Jong-seo')],
  },
  {
    slug: 'seong-sam-mun',
    facts: [
      { label: 'Pen name', value: 'Maejukheon' },
      { label: 'Institution', value: 'Hall of Worthies (Jiphyeonjeon)' },
      { label: 'Remembered as', value: 'One of the Six Martyred Ministers (Sayuksin)' },
    ],
    achievements: [
      { title: 'Researched the sounds of Hangul', body: 'As a Jiphyeonjeon scholar he travelled repeatedly to Liaodong to consult the Chinese phonologist Huang Zan during work on the new alphabet.' },
      { year: 1456, title: 'Plotted to restore King Danjong', body: 'Led the plan to reinstate the deposed boy king; it was betrayed and he was executed.' },
    ],
    quotes: [
      { year: 1456, title: 'Death poem (sijo)', body: 'When this body is dead and gone, what shall I become? A tall pine on the highest peak of Bongnaesan — and when white snow fills heaven and earth, I alone shall stand evergreen.' },
    ],
    trivia: [],
    sources: [ANNALS, wiki('Seong_Sam-mun')],
  },
  {
    slug: 'an-gyeon',
    facts: [
      { label: 'Known for', value: 'Landscape painting' },
      { label: 'Institution', value: 'Royal Bureau of Painting (Dohwaseo)' },
      { label: 'Masterpiece', value: 'Dream Journey to the Peach Blossom Land (1447)' },
      { label: 'Patron', linkedSlug: 'grand-prince-anpyeong' },
    ],
    achievements: [
      { year: 1447, title: 'Painted "Mongyu Dowondo"', body: 'Painted Grand Prince Anpyeong\'s dream of a utopian valley in just three days; it is considered the finest early Joseon landscape.' },
      { title: 'Shaped early Joseon landscape painting', body: 'His style became the model for Korean landscape painters for generations.' },
    ],
    trivia: [
      { title: 'A masterpiece abroad', body: 'Dream Journey to the Peach Blossom Land is held today by the Tenri Central Library in Japan.' },
    ],
    sources: [wiki('An_Gyeon')],
  },
  // ── Founding of Joseon ──
  {
    slug: 'jeong-do-jeon',
    facts: [
      { label: 'Pen name', value: 'Sambong' },
      { label: 'Role', value: 'Chief architect of the Joseon state' },
      { label: 'Served', linkedSlug: 'taejo-yi-seong-gye' },
    ],
    achievements: [
      { year: 1394, title: 'Drafted the Joseon Gyeonggukjeon', body: 'Wrote the founding administrative code that set out how the new dynasty would be governed.' },
      { year: 1395, title: 'Designed the capital Hanyang', body: 'Planned the layout of the new capital and named Gyeongbokgung and its main halls.' },
      { year: 1398, title: 'Killed in the First Strife of the Princes', body: 'Yi Bang-won, who opposed his vision of minister-led government, had him killed.' },
    ],
    trivia: [
      { title: 'Named after a classic', body: 'The name Gyeongbokgung comes from a line in the Chinese Book of Odes wishing the king "great blessings".' },
    ],
    sources: [ANNALS, wiki('Jeong_Do-jeon')],
  },
  {
    slug: 'jeong-mong-ju',
    facts: [
      { label: 'Pen name', value: 'Poeun' },
      { label: 'Loyalty', value: 'Goryeo dynasty' },
      { label: 'Honored as', value: 'Father of Korean Neo-Confucianism' },
    ],
    achievements: [
      { title: 'Diplomat to Ming and Japan', body: 'Led missions to Ming China and to Japan, where he negotiated the return of captured Koreans.' },
      { title: 'Spread Neo-Confucian learning', body: 'Promoted Confucian schools and rites in the late Goryeo court.' },
      { year: 1392, title: 'Killed at Seonjuk Bridge', body: 'Refusing to support Yi Seong-gye\'s new dynasty, he was assassinated in Gaegyeong on Yi Bang-won\'s orders.' },
    ],
    quotes: [
      { title: 'Dansimga ("Song of a Loyal Heart")', body: 'Though this body die and die again, a hundred times over, and my bones become dust, whether my soul remains or not — my single-hearted devotion to my lord will never change.' },
    ],
    trivia: [],
    sources: [wiki('Jeong_Mong-ju')],
  },
  // ── Scholars & artists ──
  {
    slug: 'yi-hwang',
    facts: [
      { label: 'Pen name', value: 'Toegye' },
      { label: 'School', value: 'Neo-Confucianism (Yeongnam school)' },
      { label: 'Academy', value: 'Dosan Seowon, Andong' },
    ],
    achievements: [
      { year: 1568, title: 'Ten Diagrams on Sage Learning', body: 'Presented the Seonghak Sipdo to the young King Seonjo as a guide to Confucian self-cultivation.' },
      { year: 1559, title: 'The Four-Seven Debate', body: 'His years-long exchange of letters with Gi Dae-seung became a landmark of Korean philosophy.' },
      { title: 'Teacher of a generation', body: 'Trained many disciples at his Dosan study hall, later the Dosan Seowon academy.' },
    ],
    trivia: [
      { title: 'On the 1,000-won note', body: 'His portrait appears on South Korea\'s 1,000-won banknote, and Toegye-ro in Seoul is named after him.' },
    ],
    sources: [wiki('Yi_Hwang')],
  },
  {
    slug: 'yi-i',
    facts: [
      { label: 'Pen name', value: 'Yulgok' },
      { label: 'Mother', linkedSlug: 'sin-saimdang' },
      { label: 'Known for', value: 'Neo-Confucian philosophy and reform proposals' },
    ],
    achievements: [
      { year: 1575, title: 'Essentials of the Studies of the Sages', body: 'Compiled the Seonghak Jibyo as a guide for the king.' },
      { year: 1577, title: 'Gyeongmong Yogyeol', body: 'Wrote a primer for beginning students that was used for centuries.' },
      { title: 'Top scorer nine times', body: 'Placed first in nine state examinations, earning the nickname "Gudo Jangwon-gong".' },
    ],
    trivia: [
      { title: 'On the 5,000-won note', body: 'His portrait is on the 5,000-won banknote — and his mother Sin Saimdang is on the 50,000-won note.' },
    ],
    sources: [wiki('Yi_I')],
  },
  {
    slug: 'jo-gwang-jo',
    facts: [
      { label: 'Pen name', value: 'Jeongam' },
      { label: 'Served', linkedSlug: 'jungjong-yi-yeok' },
      { label: 'Known for', value: 'Radical Confucian reform' },
    ],
    achievements: [
      { year: 1519, title: 'Created the Hyeollyanggwa', body: 'Introduced a recommendation-based examination to recruit virtuous scholars into office.' },
      { title: 'Spread village codes (hyangyak)', body: 'Promoted local self-governing codes of Confucian conduct across the country.' },
      { year: 1519, title: 'Fell in the Gimyo Purge', body: 'Accused by rival officials, he was exiled and ordered to drink poison.' },
    ],
    trivia: [
      { title: 'The honey-leaf legend', body: 'Legend says his enemies wrote a phrase meaning "Jo will become king" in honey on leaves so insects would carve it out as an omen.' },
    ],
    sources: [ANNALS, wiki('Jo_Gwang-jo')],
  },
  {
    slug: 'jeong-yak-yong',
    facts: [
      { label: 'Pen name', value: 'Dasan' },
      { label: 'School', value: 'Silhak (Practical Learning)' },
      { label: 'Patron', linkedSlug: 'jeongjo-yi-san' },
      { label: 'Exile', value: 'Gangjin, 1801–1818' },
    ],
    achievements: [
      { year: 1792, title: 'Engineering for Hwaseong Fortress', body: 'Designed construction methods and the geojunggi lifting crane used to build the Suwon fortress.' },
      { year: 1818, title: 'Mongmin Simseo', body: 'Wrote "Admonitions on Governing the People", a classic guide for local officials.' },
      { title: 'Some 500 volumes of writing', body: 'Produced most of his work during 18 years of exile, covering government, law, medicine and classics.' },
    ],
    trivia: [
      { title: 'Exiled for his faith connections', body: 'He was banished in the 1801 Catholic persecution because of his family\'s ties to the church.' },
    ],
    sources: [wiki('Jeong_Yak-yong')],
  },
  {
    slug: 'heo-jun',
    facts: [
      { label: 'Role', value: 'Royal physician' },
      { label: 'Served', linkedSlug: 'seonjo-yi-yeon' },
      { label: 'Masterwork', value: 'Dongui Bogam' },
    ],
    achievements: [
      { year: 1610, title: 'Completed the Dongui Bogam', body: 'Finished the comprehensive encyclopedia of East Asian medicine, published in 1613.' },
      { year: 2009, title: 'UNESCO Memory of the World', body: 'The Dongui Bogam was inscribed on UNESCO\'s Memory of the World Register.' },
      { year: 1592, title: 'Followed the king into war', body: 'Accompanied King Seonjo when the court fled north during the Imjin War.' },
    ],
    trivia: [],
    sources: [wiki('Heo_Jun')],
  },
  {
    slug: 'sin-saimdang',
    facts: [
      { label: 'Known for', value: 'Painting, calligraphy and poetry' },
      { label: 'Birthplace', value: 'Ojukheon, Gangneung' },
      { label: 'Son', linkedSlug: 'yi-i' },
    ],
    achievements: [
      { title: 'Paintings of grasses and insects', body: 'Her delicate Chochungdo paintings of plants and insects are among the most beloved works of the period.' },
      { title: 'Calligraphy and poetry', body: 'Admired in her own time for her brushwork and verse.' },
    ],
    trivia: [
      { title: 'First woman on a Korean banknote', body: 'Her portrait appeared on the 50,000-won note introduced in 2009.' },
    ],
    sources: [wiki('Sin_Saimdang')],
  },
  {
    slug: 'kim-jeong-hui',
    facts: [
      { label: 'Pen name', value: 'Chusa' },
      { label: 'Known for', value: 'Calligraphy (Chusa style) and epigraphy' },
      { label: 'Exile', value: 'Jeju Island, 1840–1848' },
    ],
    achievements: [
      { year: 1844, title: 'Painted "Sehando"', body: 'Painted the Winter Scene in exile on Jeju as thanks to a loyal disciple; it is a National Treasure.' },
      { title: 'Created the Chusa style', body: 'Developed a distinctive calligraphy style drawing on ancient inscriptions.' },
      { year: 1816, title: 'Identified King Jinheung\'s stele', body: 'Recognized the Bukhansan monument as a 6th-century Silla boundary stele.' },
    ],
    trivia: [],
    sources: [wiki('Kim_Jeong-hui')],
  },
  // ── Imjin War ──
  {
    slug: 'yi-sun-sin',
    facts: [
      { label: 'Office', value: 'Naval Commander of the Three Provinces' },
      { label: 'Posthumous title', value: 'Chungmugong' },
      { label: 'Served', linkedSlug: 'seonjo-yi-yeon' },
      { label: 'Known for', value: 'Undefeated at sea during the Imjin War' },
    ],
    achievements: [
      { year: 1592, title: 'Battle of Hansan Island', body: 'Destroyed a Japanese fleet with the "crane wing" formation, one of the three great victories of the war.' },
      { year: 1597, title: 'Battle of Myeongnyang', body: 'With just 13 ships he defeated a Japanese fleet of more than 130 in the Uldolmok strait.' },
      { year: 1598, title: 'Battle of Noryang', body: 'Fell to a stray bullet in the war\'s final battle as the Japanese withdrew.' },
      { title: 'Deployed the turtle ship', body: 'Put the armored geobukseon into battle against the Japanese navy.' },
    ],
    quotes: [
      { year: 1597, title: 'Before the Battle of Myeongnyang (Nanjung Ilgi)', body: 'Those who seek to die shall live; those who seek to live shall die.' },
      { year: 1598, title: 'Last words at Noryang', body: 'The battle is at its height — do not announce my death.' },
    ],
    trivia: [
      { title: 'His war diary is world heritage', body: 'His Nanjung Ilgi was inscribed on UNESCO\'s Memory of the World Register in 2013.' },
    ],
    sources: [ANNALS, { kind: 'PRIMARY', title: 'Nanjung Ilgi (War Diary of Yi Sun-sin)', url: null, citation: 'National Treasure; UNESCO Memory of the World (2013)' }, wiki('Yi_Sun-sin')],
  },
  {
    slug: 'ryu-seong-ryong',
    facts: [
      { label: 'Pen name', value: 'Seoae' },
      { label: 'Office', value: 'Chief State Councillor during the Imjin War' },
      { label: 'Hometown', value: 'Hahoe Village, Andong' },
    ],
    achievements: [
      { title: 'Recommended Yi Sun-sin and Kwon Yul', body: 'Promoted the commanders who would win Joseon\'s most important victories.' },
      { title: 'Wrote the Jingbirok', body: 'His "Book of Corrections" reflects on the war so that such mistakes would not be repeated; it is a National Treasure.' },
    ],
    trivia: [
      { title: 'A World Heritage hometown', body: 'His family\'s Hahoe Village was listed as a UNESCO World Heritage Site in 2010.' },
    ],
    sources: [ANNALS, wiki('Ryu_Seong-ryong')],
  },
  {
    slug: 'gwak-jae-u',
    facts: [
      { label: 'Nickname', value: 'The Red-Robed General' },
      { label: 'Role', value: 'Righteous army leader' },
    ],
    achievements: [
      { year: 1592, title: 'Raised the first righteous army', body: 'Organized volunteers in Uiryeong within weeks of the Japanese invasion.' },
      { year: 1592, title: 'Defended Jeongamjin', body: 'Blocked Japanese forces from crossing the Nam River into Jeolla Province.' },
    ],
    trivia: [],
    sources: [wiki('Gwak_Jae-u')],
  },
  {
    slug: 'kim-si-min',
    facts: [
      { label: 'Office', value: 'Magistrate of Jinju' },
      { label: 'Known for', value: 'First Siege of Jinju' },
    ],
    achievements: [
      { year: 1592, title: 'First Siege of Jinju', body: 'Held Jinju Fortress with a few thousand men against a far larger Japanese army, but was mortally wounded.' },
    ],
    trivia: [
      { title: 'One of three great victories', body: 'The defense of Jinju is counted with Hansan Island and Haengju among the three great victories of the Imjin War.' },
    ],
    sources: [wiki('Kim_Si-min')],
  },
  // ── Independence movement ──
  {
    slug: 'ahn-jung-geun',
    facts: [
      { label: 'Known for', value: 'Assassination of Itō Hirobumi' },
      { label: 'Executed', value: 'Lüshun Prison, 26 March 1910' },
    ],
    achievements: [
      { year: 1909, title: 'Shot Itō Hirobumi at Harbin', body: 'On 26 October 1909 he assassinated the former Japanese Resident-General of Korea at Harbin Station.' },
      { year: 1910, title: 'On Peace in East Asia', body: 'Began writing a treatise on regional peace in prison; it was left unfinished at his execution.' },
    ],
    quotes: [
      { title: 'Calligraphy written in prison', body: 'If I do not read for even a single day, thorns grow in my mouth.' },
    ],
    trivia: [
      { title: 'His remains were never found', body: 'He asked to be buried in Korea after independence, but his remains have never been located.' },
    ],
    sources: [wiki('An_Jung-geun')],
  },
  {
    slug: 'kim-gu',
    facts: [
      { label: 'Pen name', value: 'Baekbeom' },
      { label: 'Office', value: 'Head of the Korean Provisional Government' },
      { label: 'Autobiography', value: 'Baekbeom Ilji' },
    ],
    achievements: [
      { year: 1931, title: 'Founded the Korean Patriotic Organization', body: 'Organized the group behind the operations of Yi Bong-chang and Yun Bong-gil.' },
      { title: 'Led the Provisional Government', body: 'Kept the government-in-exile going through the war years in China.' },
      { year: 1949, title: 'Assassinated in Seoul', body: 'He was shot at his home, Gyeonggyojang, on 26 June 1949.' },
    ],
    quotes: [
      { title: '"My Wish" (Baekbeom Ilji)', body: 'If God asked me what my wish is, I would answer without hesitation: the independence of my country.' },
    ],
    trivia: [],
    sources: [wiki('Kim_Ku')],
  },
  {
    slug: 'yu-gwan-sun',
    facts: [
      { label: 'Known for', value: 'March 1st Movement' },
      { label: 'School', value: 'Ewha Haktang' },
      { label: 'Died', value: 'Seodaemun Prison, 1920, aged 17' },
    ],
    achievements: [
      { year: 1919, title: 'Led the Aunae Market demonstration', body: 'Organized an independence rally at Aunae Market near her hometown on 1 April 1919.' },
    ],
    trivia: [
      { title: 'Highest national honor', body: 'In 2019 her posthumous award was raised to the highest grade of the Order of Merit for National Foundation.' },
    ],
    sources: [wiki('Yu_Gwan-sun')],
  },
  {
    slug: 'yun-bong-gil',
    facts: [
      { label: 'Known for', value: 'Hongkou Park bombing, Shanghai' },
      { label: 'Organization', value: 'Korean Patriotic Organization' },
    ],
    achievements: [
      { year: 1932, title: 'Hongkou Park bombing', body: 'On 29 April 1932 he threw a bomb at a Japanese ceremony in Shanghai, killing and wounding senior officials.' },
      { year: 1932, title: 'Executed in Kanazawa', body: 'He was executed by the Japanese army in December 1932 at the age of 24.' },
    ],
    trivia: [
      { title: 'Praise from China', body: 'Chiang Kai-shek is often quoted as saying a single Korean youth did what a million Chinese soldiers could not.' },
    ],
    sources: [wiki('Yun_Bong-gil')],
  },
];

/** Expand into rows for person_facts / person_highlights / person_sources */
export function buildNotableRows(figure) {
  return {
    facts: figure.facts,
    highlights: [
      ...figure.achievements.map((h) => ({ kind: 'ACHIEVEMENT', ...h })),
      ...(figure.quotes ?? []).map((h) => ({ kind: 'QUOTE', ...h })),
      ...(figure.trivia ?? []).map((h) => ({ kind: 'TRIVIA', ...h })),
    ],
    sources: figure.sources,
  };
}
