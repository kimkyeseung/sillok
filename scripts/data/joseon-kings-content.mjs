/**
 * AI-drafted editorial content for the 27 Joseon monarchs (pilot).
 * Seeded with is_ai_generated = true and shown with an "AI draft" label
 * until an admin reviews each item.
 *
 * Kept to well-established facts (reign, tomb, consorts, landmark events).
 * No invented quotations — only Sejong's widely published Hunminjeongeum preface.
 */

const ANNALS_URL = 'https://sillok.history.go.kr/search/inspectionList.do';
const wiki = (page) => `https://en.wikipedia.org/wiki/${page}`;

// Order = succession order; predecessor/successor are derived from it
export const JOSEON_KINGS = [
  {
    slug: 'taejo-yi-seong-gye',
    reign: '1392–1398',
    personalName: 'Yi Seong-gye',
    consorts: 'Queen Sinui (posthumous), Queen Sindeok',
    tomb: 'Geonwolleung, Guri (Donggureung)',
    annals: 'Taejo Sillok (Annals of King Taejo)',
    wiki: 'Taejo_of_Joseon',
    achievements: [
      { year: 1392, title: 'Founded the Joseon dynasty', body: 'After turning his army back at Wihwa Island in 1388, he took control of the Goryeo court and was enthroned as the first king of Joseon in 1392.' },
      { year: 1394, title: 'Moved the capital to Hanyang', body: 'Relocated the capital to Hanyang (present-day Seoul) and began building Gyeongbokgung Palace, completed in 1395.' },
      { title: 'Made Neo-Confucianism the state ideology', body: 'With Jeong Do-jeon he laid out a Confucian framework for government that shaped Joseon for five centuries.' },
    ],
    trivia: [
      { title: 'The origin of "Hamheung chasa"', body: 'After the Strife of the Princes he withdrew to Hamheung. Stories say envoys sent to bring him back never returned — the Korean idiom "Hamheung chasa" now means an errand from which no word comes back.' },
    ],
  },
  {
    slug: 'jeongjong-yi-bang-gwa',
    reign: '1398–1400',
    personalName: 'Yi Bang-gwa',
    consorts: 'Queen Jeongan',
    tomb: 'Hureung, Kaesong',
    annals: 'Jeongjong Sillok (Annals of King Jeongjong)',
    wiki: 'Jeongjong_of_Joseon',
    achievements: [
      { year: 1399, title: 'Returned the capital to Gaegyeong', body: 'Moved the court back to the former Goryeo capital after the bloodshed of the First Strife of the Princes.' },
      { year: 1400, title: 'Abolished the princes\' private armies', body: 'Private soldiers held by royal princes were disbanded and absorbed into the state military, at the urging of Yi Bang-won.' },
      { year: 1400, title: 'Abdicated to his brother', body: 'After the Second Strife of the Princes he named Yi Bang-won heir and stepped down after about two years on the throne.' },
    ],
    trivia: [
      { title: 'A temple name 262 years late', body: 'For more than two and a half centuries after his death in 1419 he was known only as King Gongjeong, until King Sukjong granted him the temple name Jeongjong in 1681.' },
    ],
  },
  {
    slug: 'taejong-yi-bang-won',
    reign: '1400–1418',
    personalName: 'Yi Bang-won',
    consorts: 'Queen Wongyeong',
    tomb: 'Heolleung, Seocho-gu, Seoul',
    annals: 'Taejong Sillok (Annals of King Taejong)',
    wiki: 'Taejong_of_Joseon',
    achievements: [
      { year: 1413, title: 'Introduced the hopae identity tag', body: 'Required adult men to carry a hopae (identification tag), strengthening the state\'s grip on population, taxation and labor.' },
      { year: 1413, title: 'Organized the eight provinces', body: 'Reorganized local administration into the eight provinces that defined Korea\'s regions for centuries.' },
      { title: 'Centralized royal power', body: 'Curbed the power of meritorious officials and royal in-laws, leaving a stable throne for his son Sejong.' },
    ],
    trivia: [
      { title: 'Retired but still in charge', body: 'He abdicated to Sejong in 1418 but kept control of military affairs until his death in 1422.' },
    ],
  },
  {
    slug: 'sejong-daewang',
    reign: '1418–1450',
    personalName: 'Yi Do',
    consorts: 'Queen Soheon',
    tomb: 'Yeongneung, Yeoju',
    annals: 'Sejong Sillok (Annals of King Sejong)',
    wiki: 'Sejong_the_Great',
    extraSources: [
      { kind: 'PRIMARY', title: 'Sejong Sillok — English translation', url: 'https://sillok.history.go.kr/eslk/' },
    ],
    achievements: [
      { year: 1443, title: 'Created Hunminjeongeum (Hangul)', body: 'Devised a phonetic alphabet so ordinary people could read and write; it was promulgated in 1446 with the Hunminjeongeum Haerye explanatory text.' },
      { year: 1420, title: 'Expanded the Hall of Worthies (Jiphyeonjeon)', body: 'Turned the Jiphyeonjeon into a royal research institute whose scholars produced works on language, law, agriculture and history.' },
      { year: 1441, title: 'Sponsored science and timekeeping', body: 'Supported inventors such as Jang Yeong-sil, producing the Jagyeongnu water clock (1434) and the cheugugi rain gauge (1441).' },
      { title: 'Secured the northern frontier', body: 'Established the Four Counties and Six Garrisons along the Amnok and Duman rivers, shaping Korea\'s northern border.' },
    ],
    quotes: [
      { year: 1446, title: 'Preface to Hunminjeongeum', body: 'The speech of our country differs from that of China and does not match its written characters… Out of pity, I have newly made twenty-eight letters, wishing only that everyone may learn them easily and use them conveniently every day.' },
    ],
    trivia: [
      { title: 'On the 10,000-won note', body: 'His portrait appears on the South Korean 10,000-won banknote, and his statue stands in Gwanghwamun Square in Seoul.' },
      { title: 'Hangul Day', body: 'October 9 is celebrated as Hangul Day in South Korea, marking the promulgation of Hunminjeongeum.' },
    ],
  },
  {
    slug: 'munjong-yi-hyang',
    reign: '1450–1452',
    personalName: 'Yi Hyang',
    consorts: 'Queen Hyeondeok (posthumous)',
    tomb: 'Hyeolleung, Guri (Donggureung)',
    annals: 'Munjong Sillok (Annals of King Munjong)',
    wiki: 'Munjong_of_Joseon',
    achievements: [
      { year: 1441, title: 'Helped develop the rain gauge', body: 'As crown prince he took part in the development of the cheugugi, used to measure rainfall across the country.' },
      { title: 'Governed as regent for Sejong', body: 'Handled state affairs during the last years of his ailing father\'s reign.' },
      { year: 1451, title: 'Completion of Goryeosa', body: 'The official history of the Goryeo dynasty was completed during his reign.' },
    ],
    trivia: [
      { title: 'A reign of barely two years', body: 'He died in 1452 at the age of 38, leaving his 11-year-old son Danjong on the throne.' },
    ],
  },
  {
    slug: 'danjong-yi-hong-wi',
    reign: '1452–1455',
    personalName: 'Yi Hong-wi',
    consorts: 'Queen Jeongsun',
    tomb: 'Jangneung, Yeongwol',
    annals: 'Danjong Sillok (Annals of King Danjong)',
    wiki: 'Danjong_of_Joseon',
    achievements: [
      { year: 1452, title: 'Became king as a child', body: 'Took the throne at 11 after the early death of his father Munjong, with senior ministers governing in his name.' },
      { year: 1453, title: 'Gyeyu Jeongnan coup', body: 'His uncle Grand Prince Suyang killed the leading ministers and seized real power.' },
      { year: 1455, title: 'Forced to abdicate', body: 'Handed the throne to Suyang (King Sejo) and was later exiled to Cheongnyeongpo in Yeongwol, where he died in 1457.' },
    ],
    trivia: [
      { title: 'Restored after 241 years', body: 'Demoted to the rank of prince after his death, he was restored as a king with the temple name Danjong only in 1698.' },
    ],
  },
  {
    slug: 'sejo-yi-yu',
    reign: '1455–1468',
    personalName: 'Yi Yu',
    consorts: 'Queen Jeonghui',
    tomb: 'Gwangneung, Namyangju',
    annals: 'Sejo Sillok (Annals of King Sejo)',
    wiki: 'Sejo_of_Joseon',
    achievements: [
      { year: 1455, title: 'Seized the throne from his nephew', body: 'After the 1453 coup he forced Danjong to abdicate and became king.' },
      { year: 1456, title: 'Crushed the plot to restore Danjong', body: 'Executed the scholars later honored as the Six Martyred Ministers and abolished the Jiphyeonjeon.' },
      { title: 'Began the Gyeongguk Daejeon', body: 'Started compiling the Grand Code for State Administration, the legal foundation of Joseon completed under Seongjong.' },
    ],
    trivia: [],
  },
  {
    slug: 'yejong-yi-hwang',
    reign: '1468–1469',
    personalName: 'Yi Hwang',
    consorts: 'Queen Jangsun, Queen Ansun',
    tomb: 'Changneung, Goyang (Seooreung)',
    annals: 'Yejong Sillok (Annals of King Yejong)',
    wiki: 'Yejong_of_Joseon',
    achievements: [
      { year: 1468, title: 'The Nam I treason case', body: 'The young general Nam I was accused of treason and executed early in the reign.' },
      { title: 'Continued codifying the law', body: 'Work on the Gyeongguk Daejeon continued during his short reign.' },
    ],
    trivia: [
      { title: 'About a year on the throne', body: 'He died in 1469, roughly fourteen months after his accession.' },
    ],
  },
  {
    slug: 'seongjong-yi-hyeol',
    reign: '1469–1494',
    personalName: 'Yi Hyeol',
    consorts: 'Queen Gonghye, Deposed Queen Yun, Queen Jeonghyeon',
    tomb: 'Seolleung, Gangnam-gu, Seoul',
    annals: 'Seongjong Sillok (Annals of King Seongjong)',
    wiki: 'Seongjong_of_Joseon',
    achievements: [
      { year: 1485, title: 'Promulgated the Gyeongguk Daejeon', body: 'Completed the Grand Code for State Administration, the backbone of Joseon law.' },
      { title: 'Brought Sarim scholars into government', body: 'Promoted Neo-Confucian scholars from the provinces to balance the powerful meritorious officials.' },
      { year: 1493, title: 'Compiled major reference works', body: 'His court produced the Dongguk Tonggam history and the Akhak Gwebeom treatise on court music.' },
    ],
    trivia: [
      { title: 'A Seoul neighborhood named after his tomb', body: 'Seolleung in Gangnam — and its subway station — take their name from his royal tomb.' },
    ],
  },
  {
    slug: 'yeonsangun-yi-yung',
    reign: '1494–1506',
    personalName: 'Yi Yung',
    consorts: 'Deposed Queen Shin',
    tomb: 'Tomb of Yeonsangun, Dobong-gu, Seoul',
    annals: 'Yeonsangun Ilgi (Records of Yeonsangun)',
    wiki: 'Yeonsangun_of_Joseon',
    achievements: [
      { year: 1498, title: 'First Literati Purge (Muo Sahwa)', body: 'Purged Sarim scholars over a historical record critical of Sejo.' },
      { year: 1504, title: 'Second Literati Purge (Gapja Sahwa)', body: 'Executed officials connected to the death of his mother, Deposed Queen Yun.' },
      { year: 1506, title: 'Deposed in the Jungjong Coup', body: 'Removed from the throne by officials and exiled to Ganghwa Island, where he died the same year.' },
    ],
    trivia: [
      { title: 'A king without a temple name', body: 'As a deposed ruler he is remembered only as a prince ("-gun"), and the records of his reign are called a diary (ilgi) rather than annals.' },
    ],
  },
  {
    slug: 'jungjong-yi-yeok',
    reign: '1506–1544',
    personalName: 'Yi Yeok',
    consorts: 'Queen Dangyeong, Queen Janggyeong, Queen Munjeong',
    tomb: 'Jeongneung, Gangnam-gu, Seoul',
    annals: 'Jungjong Sillok (Annals of King Jungjong)',
    wiki: 'Jungjong_of_Joseon',
    achievements: [
      { year: 1506, title: 'Enthroned by coup', body: 'Placed on the throne by the officials who overthrew his half-brother Yeonsangun.' },
      { year: 1519, title: 'Jo Gwang-jo\'s reforms and their collapse', body: 'Backed the radical Confucian reforms of Jo Gwang-jo, then turned on him in the Gimyo Literati Purge.' },
      { year: 1510, title: 'Riot of the Three Ports', body: 'Japanese residents of the three southern trading ports rose in revolt and were suppressed.' },
    ],
    trivia: [
      { title: 'The seven-day queen', body: 'His first queen, Dangyeong, was deposed after only seven days because her family had been close to Yeonsangun.' },
    ],
  },
  {
    slug: 'injong-yi-ho',
    reign: '1544–1545',
    personalName: 'Yi Ho',
    consorts: 'Queen Inseong',
    tomb: 'Hyoreung, Goyang (Seosamneung)',
    annals: 'Injong Sillok (Annals of King Injong)',
    wiki: 'Injong_of_Joseon',
    achievements: [
      { title: 'Remembered for filial devotion', body: 'Long-serving crown prince noted in the records for his devotion to his parents and scholarly character.' },
    ],
    trivia: [
      { title: 'The shortest reign in Joseon history', body: 'He died about eight months after taking the throne.' },
    ],
  },
  {
    slug: 'myeongjong-yi-hwan',
    reign: '1545–1567',
    personalName: 'Yi Hwan',
    consorts: 'Queen Insun',
    tomb: 'Gangneung, Nowon-gu, Seoul',
    annals: 'Myeongjong Sillok (Annals of King Myeongjong)',
    wiki: 'Myeongjong_of_Joseon',
    achievements: [
      { year: 1545, title: 'Regency of Queen Munjeong', body: 'Became king at 11 while his mother, Queen Dowager Munjeong, ruled as regent; the Eulsa Purge followed the same year.' },
      { year: 1555, title: 'Eulmyo Japanese raid', body: 'Japanese pirates raided the southwest coast, prompting new military institutions.' },
      { year: 1559, title: 'Im Kkeok-jeong\'s uprising', body: 'The outlaw Im Kkeok-jeong led a rebellion in Hwanghae Province until his capture in 1562.' },
    ],
    trivia: [
      { title: 'A bandit turned folk hero', body: 'Im Kkeok-jeong, active during this reign, later became a Robin Hood–like figure in Korean fiction.' },
    ],
  },
  {
    slug: 'seonjo-yi-yeon',
    reign: '1567–1608',
    personalName: 'Yi Yeon',
    consorts: 'Queen Uiin, Queen Inmok',
    tomb: 'Mongneung, Guri (Donggureung)',
    annals: 'Seonjo Sillok (Annals of King Seonjo)',
    wiki: 'Seonjo_of_Joseon',
    achievements: [
      { year: 1592, title: 'The Imjin War', body: 'Japan invaded in 1592; the court fled north to Uiju while the navy under Yi Sun-sin and righteous armies resisted until 1598.' },
      { year: 1575, title: 'The Easterner–Westerner split', body: 'Officials divided into the Easterner and Westerner factions, beginning centuries of factional politics.' },
      { title: 'Patron of eminent scholars', body: 'His court included Yi Hwang and Yi I, two of Korea\'s most influential Confucian thinkers.' },
    ],
    trivia: [
      { title: 'The first king from a collateral line', body: 'A grandson of Jungjong through a royal concubine, he was the first Joseon king not descended from a queen.' },
    ],
  },
  {
    slug: 'gwanghaegun-yi-hon',
    reign: '1608–1623',
    personalName: 'Yi Hon',
    consorts: 'Deposed Queen Yu',
    tomb: 'Tomb of Gwanghaegun, Namyangju',
    annals: 'Gwanghaegun Ilgi (Records of Gwanghaegun)',
    wiki: 'Gwanghaegun_of_Joseon',
    achievements: [
      { year: 1608, title: 'Launched the Daedong tax reform', body: 'Introduced the Daedongbeop in Gyeonggi Province, replacing tribute goods with a tax paid in rice.' },
      { year: 1613, title: 'Dongui Bogam published', body: 'Heo Jun\'s landmark medical encyclopedia was published during his reign.' },
      { title: 'Balanced diplomacy', body: 'Tried to steer between the declining Ming and the rising Later Jin rather than side fully with either.' },
    ],
    trivia: [
      { title: 'Deposed and exiled to Jeju', body: 'Overthrown in the 1623 Injo Coup, he lived in exile and died on Jeju Island in 1641.' },
    ],
  },
  {
    slug: 'injo-yi-jong',
    reign: '1623–1649',
    personalName: 'Yi Jong',
    consorts: 'Queen Inryeol, Queen Jangryeol',
    tomb: 'Jangneung, Paju',
    annals: 'Injo Sillok (Annals of King Injo)',
    wiki: 'Injo_of_Joseon',
    achievements: [
      { year: 1623, title: 'Came to power in the Injo Coup', body: 'Westerner officials deposed Gwanghaegun and enthroned him.' },
      { year: 1627, title: 'First Manchu invasion', body: 'The Later Jin invaded and forced Joseon into a "brotherly" relationship.' },
      { year: 1637, title: 'Surrender at Samjeondo', body: 'After the Qing invasion of 1636 he surrendered at Samjeondo, and his sons were taken to Shenyang as hostages.' },
    ],
    trivia: [
      { title: 'A national humiliation', body: 'His kowtow to the Qing emperor at Samjeondo became one of the most painful memories in Korean history.' },
    ],
  },
  {
    slug: 'hyojong-yi-ho',
    reign: '1649–1659',
    personalName: 'Yi Ho',
    consorts: 'Queen Inseon',
    tomb: 'Yeongneung, Yeoju',
    annals: 'Hyojong Sillok (Annals of King Hyojong)',
    wiki: 'Hyojong_of_Joseon',
    achievements: [
      { title: 'Planned the Northern Expedition', body: 'Built up the army with the aim of striking back at the Qing, a plan that ended with his death.' },
      { year: 1654, title: 'Campaigns against Russia', body: 'Joseon musketeers were sent to help the Qing fight Russian forces on the Amur River in 1654 and 1658.' },
      { year: 1653, title: 'Hendrick Hamel\'s shipwreck', body: 'Dutch sailors wrecked on Jeju; Hamel\'s later account introduced Korea to Europe.' },
    ],
    trivia: [
      { title: 'Eight years as a hostage', body: 'As Grand Prince Bongnim he was held in Shenyang by the Qing from 1637 to 1645.' },
    ],
  },
  {
    slug: 'hyeonjong-yi-yeon',
    reign: '1659–1674',
    personalName: 'Yi Yeon',
    consorts: 'Queen Myeongseong',
    tomb: 'Sungneung, Guri (Donggureung)',
    annals: 'Hyeonjong Sillok (Annals of King Hyeonjong)',
    wiki: 'Hyeonjong_of_Joseon',
    achievements: [
      { year: 1659, title: 'The Rites Controversies (Yesong)', body: 'Factions fought bitterly — in 1659 and again in 1674 — over how long the queen dowager should wear mourning.' },
      { year: 1670, title: 'The Gyeongsin Great Famine', body: 'A devastating famine struck in 1670–1671, one of the worst disasters of the dynasty.' },
    ],
    trivia: [
      { title: 'Born abroad', body: 'He was born in Shenyang in 1641 while his father was a hostage of the Qing — the only Joseon king born outside Korea.' },
    ],
  },
  {
    slug: 'sukjong-yi-sun',
    reign: '1674–1720',
    personalName: 'Yi Sun',
    consorts: 'Queen Ingyeong, Queen Inhyeon, Queen Inwon (and Jang Hui-bin, queen 1690–1694)',
    tomb: 'Myeongneung, Goyang (Seooreung)',
    annals: 'Sukjong Sillok (Annals of King Sukjong)',
    wiki: 'Sukjong_of_Joseon',
    achievements: [
      { title: 'Ruled through factional reversals', body: 'Repeatedly swapped the ruling faction (hwanguk) to keep officials in check.' },
      { year: 1678, title: 'Sangpyeong Tongbo coinage', body: 'Minted the Sangpyeong Tongbo coin, which came into wide circulation.' },
      { year: 1712, title: 'Baekdusan boundary stele', body: 'A stele marking the Joseon–Qing border was erected near Mount Baekdu.' },
    ],
    trivia: [
      { title: 'A 46-year reign', body: 'His reign is the second longest in Joseon history, after his son Yeongjo\'s.' },
    ],
  },
  {
    slug: 'gyeongjong-yi-yun',
    reign: '1720–1724',
    personalName: 'Yi Yun',
    consorts: 'Queen Danui (posthumous), Queen Seonui',
    tomb: 'Uireung, Seongbuk-gu, Seoul',
    annals: 'Gyeongjong Sillok (Annals of King Gyeongjong)',
    wiki: 'Gyeongjong_of_Joseon',
    achievements: [
      { year: 1721, title: 'The Sinim Purge', body: 'A power struggle over the succession ended with the Noron faction purged in 1721–1722.' },
      { year: 1721, title: 'Named his brother heir', body: 'Having no son, he designated his half-brother Prince Yeoning (the future Yeongjo) as crown prince.' },
    ],
    trivia: [
      { title: 'Son of Jang Hui-bin', body: 'He was the son of Sukjong and the famous royal consort Jang Hui-bin.' },
    ],
  },
  {
    slug: 'yeongjo-yi-geum',
    reign: '1724–1776',
    personalName: 'Yi Geum',
    consorts: 'Queen Jeongseong, Queen Jeongsun',
    tomb: 'Wolleung, Guri (Donggureung)',
    annals: 'Yeongjo Sillok (Annals of King Yeongjo)',
    wiki: 'Yeongjo_of_Joseon',
    achievements: [
      { title: 'The Tangpyeong policy', body: 'Appointed officials from rival factions in balance to reduce factional strife.' },
      { year: 1750, title: 'Gyunyeokbeop tax reform', body: 'Cut the military cloth tax paid by commoners in half.' },
      { year: 1760, title: 'Dredged the Cheonggyecheon', body: 'Organized a large-scale dredging of Seoul\'s central stream to prevent flooding.' },
    ],
    trivia: [
      { title: 'The longest reign and longest life', body: 'He ruled for 52 years and lived to 82 — both records among Joseon kings.' },
      { title: 'The death of Crown Prince Sado', body: 'In 1762 he had his own son, Crown Prince Sado, locked in a rice chest, where he died after eight days.' },
    ],
  },
  {
    slug: 'jeongjo-yi-san',
    reign: '1776–1800',
    personalName: 'Yi San',
    consorts: 'Queen Hyoui',
    tomb: 'Geolleung, Hwaseong',
    annals: 'Jeongjo Sillok (Annals of King Jeongjo)',
    wiki: 'Jeongjo_of_Joseon',
    achievements: [
      { year: 1776, title: 'Founded the Kyujanggak', body: 'Established the royal library and research institute, recruiting talented scholars regardless of faction or birth.' },
      { year: 1796, title: 'Built Hwaseong Fortress', body: 'Constructed the fortress city of Suwon between 1794 and 1796 using new engineering techniques.' },
      { year: 1791, title: 'Opened up commerce (Sinhae Tonggong)', body: 'Abolished the monopoly rights of licensed Seoul merchants, except for six major guilds.' },
    ],
    trivia: [
      { title: 'A World Heritage fortress', body: 'Hwaseong Fortress was designated a UNESCO World Heritage Site in 1997.' },
    ],
  },
  {
    slug: 'sunjo-yi-gong',
    reign: '1800–1834',
    personalName: 'Yi Gong',
    consorts: 'Queen Sunwon',
    tomb: 'Illeung, Seocho-gu, Seoul',
    annals: 'Sunjo Sillok (Annals of King Sunjo)',
    wiki: 'Sunjo_of_Joseon',
    achievements: [
      { year: 1801, title: 'Freed government slaves', body: 'Around 66,000 slaves attached to central government offices were emancipated in 1801.' },
      { year: 1801, title: 'The Sinyu Persecution', body: 'A harsh crackdown on Catholics took place early in his reign.' },
      { year: 1811, title: 'Hong Gyeong-rae\'s Rebellion', body: 'A major uprising broke out in Pyeongan Province in 1811–1812.' },
    ],
    trivia: [
      { title: 'The age of in-law government', body: 'His reign began the domination of court politics by the Andong Kim clan, the family of his queen.' },
    ],
  },
  {
    slug: 'heonjong-yi-hwan',
    reign: '1834–1849',
    personalName: 'Yi Hwan',
    consorts: 'Queen Hyohyeon, Queen Hyojeong',
    tomb: 'Gyeongneung, Guri (Donggureung)',
    annals: 'Heonjong Sillok (Annals of King Heonjong)',
    wiki: 'Heonjong_of_Joseon',
    achievements: [
      { year: 1839, title: 'The Gihae Persecution', body: 'Catholics, including French missionaries, were executed in 1839.' },
      { year: 1847, title: 'Built Nakseonjae', body: 'Constructed the Nakseonjae quarters in Changdeokgung Palace.' },
    ],
    trivia: [
      { title: 'The youngest king of Joseon', body: 'He took the throne at the age of seven, succeeding his grandfather Sunjo.' },
    ],
  },
  {
    slug: 'cheoljong-yi-byeon',
    reign: '1849–1863',
    personalName: 'Yi Byeon',
    consorts: 'Queen Cheorin',
    tomb: 'Yereung, Goyang (Seosamneung)',
    annals: 'Cheoljong Sillok (Annals of King Cheoljong)',
    wiki: 'Cheoljong_of_Joseon',
    achievements: [
      { year: 1860, title: 'Rise of Donghak', body: 'Choe Je-u founded the Donghak (Eastern Learning) religion during his reign.' },
      { year: 1862, title: 'The Imsul Peasant Uprisings', body: 'Peasants across the south rose up against corrupt taxation, beginning in Jinju.' },
    ],
    trivia: [
      { title: '"The Ganghwa bachelor"', body: 'Living as a farmer in exile on Ganghwa Island, he was unexpectedly chosen as king — earning the nickname Ganghwa Doryeong.' },
    ],
  },
  {
    slug: 'gojong-yi-myeong-bok',
    reign: '1863–1907 (King 1863–1897, Emperor 1897–1907)',
    personalName: 'Yi Myeong-bok',
    consorts: 'Empress Myeongseong',
    tomb: 'Hongneung, Namyangju',
    annals: 'Gojong Sillok (Annals of Emperor Gojong)',
    wiki: 'Gojong_of_Korea',
    achievements: [
      { year: 1876, title: 'Treaty of Ganghwa', body: 'Signed the unequal treaty that opened Korea\'s ports to Japan.' },
      { year: 1897, title: 'Proclaimed the Korean Empire', body: 'Declared himself emperor and launched the Gwangmu modernization reforms.' },
      { year: 1907, title: 'The Hague Secret Emissaries', body: 'Sent envoys to the Hague Peace Conference to protest Japan\'s protectorate; Japan forced him to abdicate.' },
    ],
    trivia: [
      { title: 'A funeral that sparked a movement', body: 'His death in January 1919 helped ignite the March 1st Independence Movement.' },
    ],
  },
  {
    slug: 'sunjong-yi-cheok',
    reign: '1907–1910',
    personalName: 'Yi Cheok',
    consorts: 'Empress Sunmyeong (posthumous), Empress Sunjeong',
    tomb: 'Yureung, Namyangju',
    annals: 'Sunjong Sillok (Annals of Emperor Sunjong)',
    wiki: 'Sunjong_of_Korea',
    achievements: [
      { year: 1907, title: 'Disbandment of the Korean army', body: 'Under Japanese pressure the Korean Empire\'s army was dissolved shortly after his accession.' },
      { year: 1910, title: 'End of the Korean Empire', body: 'Japan annexed Korea in August 1910, ending more than 500 years of Joseon rule.' },
    ],
    trivia: [
      { title: 'The June 10th Movement', body: 'His funeral in 1926 became the occasion for the June 10th independence demonstrations.' },
    ],
  },
];

const ORDINAL = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/** Expand into rows for person_facts / person_highlights / person_sources */
export function buildRows(king, index) {
  const prev = JOSEON_KINGS[index - 1];
  const next = JOSEON_KINGS[index + 1];
  const facts = [
    { label: 'Reign', value: king.reign },
    { label: 'Monarch', value: `${ORDINAL(index + 1)} ruler of Joseon` },
    { label: 'Personal name', value: king.personalName },
    { label: 'Consort', value: king.consorts },
    { label: 'Tomb', value: king.tomb },
    ...(prev ? [{ label: 'Predecessor', linkedSlug: prev.slug }] : []),
    ...(next ? [{ label: 'Successor', linkedSlug: next.slug }] : []),
  ];
  const highlights = [
    ...king.achievements.map((h) => ({ kind: 'ACHIEVEMENT', ...h })),
    ...(king.quotes ?? []).map((h) => ({ kind: 'QUOTE', ...h })),
    ...(king.trivia ?? []).map((h) => ({ kind: 'TRIVIA', ...h })),
  ];
  const sources = [
    { kind: 'PRIMARY', title: king.annals, url: ANNALS_URL, citation: 'Veritable Records of the Joseon Dynasty, National Institute of Korean History' },
    ...(king.extraSources ?? []),
    { kind: 'ENCYCLOPEDIA', title: `Wikipedia — ${king.wiki.replace(/_/g, ' ')}`, url: wiki(king.wiki) },
  ];
  return { facts, highlights, sources };
}
