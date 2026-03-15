/**
 * Batch English Translation Script
 * Inserts person_translations and person_timeline_translations for all persons.
 * Run: node batch/translate-to-english.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load env
const envPath = path.resolve(__dirname, '../apps/web/.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.+)/);
  if (match) env[match[1].trim()] = match[2].trim().split('#')[0].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ═══════════════════════════════════════════════════════════════
// Person Translations (summary_en, birth_place_en)
// ═══════════════════════════════════════════════════════════════
const personTranslations = {
  // === JOSEON DYNASTY ===
  '668727b4-99fe-4615-b70f-f528da95bfa2': { // 태조 (조선)
    summary: 'Founder and first king of the Joseon dynasty. He seized power through the Wihwado Retreat, overthrowing Goryeo, and established a new dynasty based on Confucian principles of benevolent governance.',
    birth_place: 'Hwaryeong-bu',
  },
  'dfcdc656-9dab-4b25-8f12-2915949fdfa9': { // 정종 (조선)
    summary: 'Second king of the Joseon dynasty. He ascended to the throne after the First Strife of Princes and abdicated to his younger brother Taejong after a short reign.',
    birth_place: 'Hamheung',
  },
  '57828400-e11a-44f0-a886-2261ecc747e2': { // 태종 (조선)
    summary: 'Third king of the Joseon dynasty. He consolidated royal authority through powerful centralization policies, implementing the Six Ministries direct-report system and the household identification tag law.',
    birth_place: 'Hamheung',
  },
  '84246e6d-9917-4f83-83a4-56f4bf3918fc': { // 세종대왕
    summary: 'Fourth king of the Joseon dynasty. He created Hunminjeongeum (the Korean alphabet) and led the golden age of Joseon across all fields including science, culture, and national defense.',
    birth_place: 'Hanseong-bu',
  },
  '327f3685-7081-4d6f-a11f-91fad4b5a6ba': { // 문종 (조선)
    summary: 'Fifth king of the Joseon dynasty. As the eldest son of Sejong, he served as Crown Prince for many years, reorganizing academic and defense systems, but died after only two years on the throne.',
    birth_place: 'Hanseong-bu',
  },
  '90f3b6a8-39b1-4b79-9b15-2251a00144ef': { // 단종
    summary: 'Sixth king of the Joseon dynasty. He ascended to the throne at a young age but was deposed by his uncle Grand Prince Suyang and met his death in exile, making him a tragic monarch.',
    birth_place: 'Hanseong-bu',
  },
  'c179e136-d60c-4d1d-9e7f-2c41fac88c24': { // 세조
    summary: 'Seventh king of the Joseon dynasty. He seized power from his nephew Danjong through the Gyeyu Coup and strengthened the centralized system, initiating the compilation of the Gyeongguk Daejeon.',
    birth_place: 'Hanseong-bu',
  },
  '8575f3f2-8b0a-41fd-b190-bf1937b210ee': { // 예종 (조선)
    summary: 'Eighth king of the Joseon dynasty. He succeeded Sejo but died after only 14 months on the throne. The purge of General Nam Yi occurred during his reign.',
    birth_place: 'Hanseong-bu',
  },
  '64f9d968-c7bc-4150-83f8-679546e7a62a': { // 성종 (조선)
    summary: 'Ninth king of the Joseon dynasty. He completed the Gyeongguk Daejeon, establishing the governance code of the nation, and appointed Sarim scholars to check the Hungu faction.',
    birth_place: 'Hanseong-bu',
  },
  '8f8305b6-8555-48cb-8df7-4faa09ea68fe': { // 연산군
    summary: 'Tenth king of the Joseon dynasty. He carried out the Muo and Gapja Literati Purges, executing many scholars, and was deposed through the Jungjong Restoration due to his tyranny.',
    birth_place: 'Hanseong-bu',
  },
  '1d33830e-76a9-4257-8183-4486e2a2c01f': { // 중종
    summary: 'Eleventh king of the Joseon dynasty. He ascended through a coup to correct the tyranny of Yeonsangun, but experienced conflicts between the Hungu and Sarim factions, including the failure of Jo Gwangjo\'s reforms (Gimyo Literati Purge).',
    birth_place: 'Hanseong-bu',
  },
  '0ae56aca-f376-4574-b2a3-1b5e7db89811': { // 인종 (조선)
    summary: 'Twelfth king of the Joseon dynasty. Known for his extreme filial piety and gentle nature, he passed away from illness after only 9 months on the throne, making him the shortest-reigning king in Joseon history.',
    birth_place: 'Hanseong-bu',
  },
  'ce7d835a-9e7b-4458-9094-de282dca92db': { // 명종 (조선)
    summary: 'Thirteenth king of the Joseon dynasty. He ascended at a young age under the regency of his mother Queen Munjeong, during which the Eulsa Literati Purge and Im Kkeokjeong\'s Rebellion occurred.',
    birth_place: 'Hanseong-bu',
  },
  'f37f9dcd-6d15-46b6-aba4-df88f1c07275': { // 선조
    summary: 'Fourteenth king of the Joseon dynasty. He was the first king from a collateral line, and during his reign, the Japanese Invasions of 1592 (Imjin War) brought a national crisis.',
    birth_place: 'Hanseong-bu',
  },
  'cf54b944-b823-49cc-99f7-bb0366ab2652': { // 광해군
    summary: 'Fifteenth king of the Joseon dynasty. He carried out postwar reconstruction and pragmatic neutral diplomacy, but was deposed through Injo\'s Restoration and remains titled as "gun" (prince).',
    birth_place: 'Hanseong-bu',
  },
  '0ad90b2b-f4ec-4828-ac78-89b4e08ad436': { // 인조
    summary: 'Sixteenth king of the Joseon dynasty. He ascended through a coup but suffered the Manchu Invasions of 1627 and 1636, culminating in the humiliating surrender at Samjeondo to the Qing dynasty.',
    birth_place: 'Haeju',
  },
  '215539c6-a915-4c0e-84c6-a980b33c91be': { // 효종
    summary: 'Seventeenth king of the Joseon dynasty. He endured captivity in Qing China after the Manchu invasion, and upon ascending the throne, pursued the "Northern Expedition" plan to attack the Qing.',
    birth_place: 'Gyeonghuigung Palace',
  },
  '11871bed-cfb8-4a90-bbe5-8e54ca51b3a9': { // 현종 (조선)
    summary: 'Eighteenth king of the Joseon dynasty. He was the only Joseon king born in a foreign country (Qing China, Shenyang), and during his reign, the Yesong Controversy over ritual mourning intensified.',
    birth_place: 'Shenyang, Qing China',
  },
  'f5e70201-5444-461d-b1cb-8bfa49329671': { // 숙종
    summary: 'Nineteenth king of the Joseon dynasty. He maximized royal authority through hwanguk politics (mass purges and faction changes), and advanced the economy through nationwide implementation of the Daedong Law and issuance of Sangpyeong Tongbo coins.',
    birth_place: 'Gyeonghuigung Palace',
  },
  'd95ba04d-086d-497d-9dd8-e55944c4b48f': { // 경종 (조선)
    summary: 'Twentieth king of the Joseon dynasty. Son of Sukjong and Royal Concubine Jang (Jang Hui-bin), he was physically weak and passed away after only 4 years on the throne.',
    birth_place: 'Changgyeonggung Palace',
  },
  '0f20a9e2-d065-4c76-9894-64300bb960fb': { // 영조
    summary: 'Twenty-first king of the Joseon dynasty. He suppressed factional strife through the Tangpyeong policy and stabilized the lives of commoners through the Gyunyeok Law, holding the longest reign in Joseon history.',
    birth_place: 'Changdeokgung Palace',
  },
  '319d5985-ec1a-44fd-8d07-bdbcee70d1ae': { // 정조
    summary: 'Twenty-second king of the Joseon dynasty. He established the Gyujanggak royal library to promote scholarship and built Hwaseong Fortress, leading the late Joseon renaissance.',
    birth_place: 'Changgyeonggung Palace',
  },
  'cae70a63-8099-4e35-acd7-6b629f75e2c4': { // 순조
    summary: 'Twenty-third king of the Joseon dynasty. He succeeded Jeongjo at a young age, but in-law clans such as the Andong Kim family seized power, beginning the era of "sedo politics" (consort clan rule).',
    birth_place: 'Changgyeonggung Palace',
  },
  'eaf22018-5ff9-45c3-9536-ee77c13b5aee': { // 헌종 (조선)
    summary: 'Twenty-fourth king of the Joseon dynasty. He ascended at age 8 and governed under the shadow of consort clan politics, during which the Catholic Persecution of 1839 (Gihae Persecution) occurred.',
    birth_place: 'Changgyeonggung Palace',
  },
  '7b73d51e-1b34-4369-a9ed-11b0a91353ab': { // 철종
    summary: 'Twenty-fifth king of the Joseon dynasty. He was suddenly elevated to kingship from farming life on Ganghwa Island, earning the nickname "Ganghwa Boy," and had virtually no real power due to consort clan politics.',
    birth_place: 'Hanseong-bu',
  },
  '2edf73ca-4078-46dd-85a0-a85a0326e8fb': { // 고종
    summary: 'Twenty-sixth king of Joseon and first emperor of the Korean Empire. He attempted modernization during a turbulent period but suffered the loss of national sovereignty to Japanese imperialism.',
    birth_place: 'Hanseong-bu',
  },
  'a2b5aea3-0fee-402c-9648-44316c73f0c0': { // 순종 (대한제국)
    summary: 'Last emperor of the Korean Empire. He lost national sovereignty under Japanese coercion, and his death in 1926 became the catalyst for the June 10th Independence Movement.',
    birth_place: 'Changdeokgung Palace',
  },

  // === GORYEO DYNASTY ===
  '29ec8856-ba6d-4f09-bd58-bc4ce65b7c16': { // 태조 왕건
    summary: 'Founder and first king of the Goryeo dynasty. He unified the Later Three Kingdoms, embraced Balhae refugees to achieve national reunification, and left the Ten Injunctions (Hunyo Sipjo) as governance guidelines for future kings.',
    birth_place: 'Songak',
  },
  '81b31f73-b02a-412c-b54a-230403c7b5d3': { // 혜종
    summary: 'Second king of Goryeo. The eldest son of Taejo, born to Queen Janghwa of the Oh clan. He had a short reign amid power struggles.',
    birth_place: 'Naju',
  },
  '501432ae-bfb8-462f-a43a-28f91ee2f05f': { // 정종 (고려)
    summary: 'Third king of Goryeo. He attempted to move the capital to Seogyeong (Pyongyang) and organized the Gwangun army to prepare for Khitan invasion, strengthening royal authority and national defense.',
    birth_place: 'Gaegyeong',
  },
  '80262fc2-7bda-4823-aaf3-cf1fe63ecb90': { // 광종
    summary: 'Fourth king of Goryeo. A reformist monarch who established centralized absolute royal authority by implementing the Slave Review Act and the civil service examination system to suppress powerful local clans.',
    birth_place: 'Gaegyeong',
  },
  '3abbd9ef-51b6-4880-a12f-ed24e8724e6d': { // 경종 (고려)
    summary: 'Fifth king of Goryeo. He first established the Jeonsi-gwa land distribution system, laying the foundation for Goryeo\'s land tenure system.',
    birth_place: 'Gaegyeong',
  },
  'b34bf240-8a08-435d-9d96-d37763bb3ca9': { // 성종 (고려)
    summary: 'Sixth king of Goryeo. He accepted Choe Seungro\'s Twenty-Eight Points of Reform, established Confucian political ideology, and reorganized the central government with the Two Departments and Six Ministries system and the provincial system of Twelve Districts.',
    birth_place: 'Gaegyeong',
  },
  '0fcc2a67-949d-4f65-b42f-b10e78ed8b40': { // 목종
    summary: 'Seventh king of Goryeo. He reformed the Jeonsi-gwa land system and promoted learning, but was deposed and killed in a coup by General Gang Jo.',
    birth_place: null,
  },
  '6c89c3d9-09bb-4942-bc49-6c692e9e76bb': { // 현종 (고려)
    summary: 'Eighth king of Goryeo. He repelled the Khitan invasions and established the provincial system of Five Provinces and Two Border Regions. He also began carving the First Tripitaka Koreana to overcome the national crisis through Buddhist faith.',
    birth_place: null,
  },
  'b666526d-6fe1-449c-97fc-64638316c3c5': { // 덕종
    summary: 'Ninth king of Goryeo. Son of Hyeonjong, he maintained a hardline stance against the Khitan and initiated construction of the Cheolli Jangseong (Thousand-Li Wall).',
    birth_place: null,
  },
  '9a112d63-38d0-424f-8920-e93c396bb3e4': { // 정종 (고려 10대)
    summary: 'Tenth king of Goryeo. He completed the Cheolli Jangseong (Thousand-Li Wall), strengthened national defense, and enacted the law of maternal slavery determination.',
    birth_place: null,
  },
  'a4e438d4-8e1c-41ee-8559-809d01da9007': { // 문종 (고려)
    summary: 'Eleventh king of Goryeo. He led the golden age of Goryeo, implementing the reformed Jeonsi-gwa system and simultaneously developing national defense and culture.',
    birth_place: null,
  },
  'b2f426e9-fb97-4691-8b92-e3445a39eebb': { // 순종 (고려)
    summary: 'Twelfth king of Goryeo. Eldest son of Munjong, he passed away merely 3 months after ascending to the throne.',
    birth_place: null,
  },
  '95ba488e-0d9b-400d-89db-4c9000a1d2a2': { // 선종 (고려)
    summary: 'Thirteenth king of Goryeo. He actively engaged in diplomacy with Song, Khitan, and Japan, stabilizing international relations, and compiled the Tripitaka.',
    birth_place: null,
  },
  '662cc061-f2ee-40a2-be78-b71ad3fa8888': { // 헌종 (고려)
    summary: 'Fourteenth king of Goryeo. He ascended to the throne at age 11 but was sickly and abdicated in favor of his uncle Sukjong.',
    birth_place: null,
  },
  '8d13ca9a-33ea-498f-836f-00fae73fbaf1': { // 숙종 (고려)
    summary: 'Fifteenth king of Goryeo. He established the Coin Minting Office (Jujeon Dogam) to mint currency and created the Byeolmuban special military unit to prepare for the Jurchen expedition.',
    birth_place: null,
  },
  '308eba87-7e6f-49ad-ba05-31ab07bce530': { // 예종 (고려)
    summary: 'Sixteenth king of Goryeo. He sent General Yun Gwan to conquer the Jurchen and build the Nine Northeastern Fortresses. He also established seven specialized academies within the National Academy and created welfare institutions.',
    birth_place: null,
  },
  '2af0ad66-8dd3-418e-8919-9922d5706c59': { // 인종 (고려)
    summary: 'Seventeenth king of Goryeo. He experienced internal turmoil including Yi Ja-gyeom\'s Rebellion and Myocheong\'s capital relocation movement, and commissioned Kim Bu-sik to compile the Samguk Sagi.',
    birth_place: null,
  },
  'fe2058a3-5a84-4a2f-bdcb-093becb90cb3': { // 의종
    summary: 'Eighteenth king of Goryeo. He indulged in pleasure and arts but was deposed in the Military Officers\' Coup of 1170 and was later killed by Yi Ui-bang\'s faction.',
    birth_place: null,
  },
  '07712093-a9e9-481b-bf8f-08f3647318a2': { // 명종 (고려)
    summary: 'Nineteenth king of Goryeo. He was installed as a puppet king during the military dictatorship era and lived without real power before being deposed by Choe Chungheon.',
    birth_place: null,
  },
  '1bce1797-7e31-4bbc-bd68-10476dab79b5': { // 신종
    summary: 'Twentieth king of Goryeo. He was enthroned by Choe Chungheon, and during his reign, Manjeok\'s Rebellion, a movement for social class liberation, took place.',
    birth_place: null,
  },
  '8085ac52-b241-4076-b1fd-a2a17e5e1eae': { // 희종
    summary: 'Twenty-first king of Goryeo. He attempted to assassinate Choe Chungheon but failed and was exiled to Ganghwa Island and deposed.',
    birth_place: null,
  },
  '3b73766a-850d-4fda-a34d-9b538d04f33f': { // 강종
    summary: 'Twenty-second king of Goryeo. Son of the deposed King Myeongjong, he was enthroned by Choe Chungheon after a long exile but passed away after only 2 years on the throne.',
    birth_place: null,
  },
  '104dad7a-86e6-4cfd-8b79-5bd03f5eacbf': { // 고종 (고려)
    summary: 'Twenty-third king of Goryeo. He endured Mongol invasions throughout his reign, relocated the capital to Ganghwa Island to resist, and oversaw the carving of the Tripitaka Koreana (Palman Daejanggyeong).',
    birth_place: null,
  },
  'e9878f0e-188d-4645-b7b7-3bf2b6c7ddfc': { // 원종
    summary: 'Twenty-fourth king of Goryeo. He ended the military dictatorship and returned the capital to Gaegyeong, but his reign marked the beginning of full-scale Mongol (Yuan) interference.',
    birth_place: null,
  },
  'a4291ef4-e183-4554-91f4-dfb24fa3a7ac': { // 충렬왕
    summary: 'Twenty-fifth king of Goryeo. As a son-in-law of the Yuan dynasty, royal titles and government systems were downgraded, and he was mobilized for expeditions against Japan.',
    birth_place: null,
  },
  'fb860c08-1540-400c-8a22-ece3797076a3': { // 충선왕
    summary: 'Twenty-sixth king of Goryeo. He governed while traveling between the Yuan dynasty and Goryeo, and established the Mangyeondang academy in Beijing to promote scholarly exchange.',
    birth_place: null,
  },
  'b52e96c8-22d0-47de-af56-6d5f8b1fde5a': { // 충숙왕
    summary: 'Twenty-seventh king of Goryeo. He suffered under Yuan dynasty pressure and obstruction from the Simyang Prince faction throughout his reign.',
    birth_place: null,
  },
  '8d237dea-a580-4195-829f-a7d4781a4961': { // 충혜왕
    summary: 'Twenty-eighth king of Goryeo. He was exiled by Yuan envoys due to his debauchery and misdeeds, and died while being transported to his place of exile.',
    birth_place: null,
  },
  'cb6e0e45-4e7f-4a95-aa5d-7db1251f4e25': { // 충목왕
    summary: 'Twenty-ninth king of Goryeo. He ascended at age 8 and attempted political reform but passed away at a young age.',
    birth_place: null,
  },
  '6ab3b5ba-774d-4c36-96dd-b3efc4cfdb2a': { // 충정왕
    summary: 'Thirtieth king of Goryeo. His reign was marked by instability from both in-law family tyranny and Japanese pirate raids, and he was deposed by his uncle King Gongmin.',
    birth_place: null,
  },
  'a2666b1e-0b5c-46d2-9aea-d2999f908b52': { // 공민왕
    summary: 'Thirty-first king of Goryeo. He pursued anti-Yuan independence policies to break free from Yuan domination, appointed Sin Don, and established the Jeonmin Byeonjeong Dogam to carry out major reforms reclaiming land and slaves from powerful families.',
    birth_place: null,
  },
  '224535f4-ed86-40b2-9f15-4cde9b9bf7d2': { // 우왕
    summary: 'Thirty-second king of Goryeo. He ascended as the son of King Gongmin but was deposed after Yi Seong-gye\'s Wihwado Retreat, and was later embroiled in the controversy of being Sin Don\'s son.',
    birth_place: null,
  },
  'b32847d0-3e43-44ff-b3ef-7a04cdcf39c1': { // 창왕
    summary: 'Thirty-third king of Goryeo. Son of King U, he ascended at age 9 but was deposed after only one year under the pretext of "removing the false and installing the true."',
    birth_place: null,
  },
  'b409e873-4fbe-4e49-9bca-d1e2e65b584f': { // 공양왕
    summary: 'Last king of Goryeo. Installed by Yi Seong-gye\'s faction, he implemented the Gwajeon Law for land reform, but was ultimately deposed with the founding of Joseon, marking the end of the Goryeo dynasty.',
    birth_place: null,
  },
};

// ═══════════════════════════════════════════════════════════════
// Timeline Translations (keyed by timeline_id)
// ═══════════════════════════════════════════════════════════════
const timelineTranslations = {
  // --- 태조 (조선) ---
  '1f645a1c-ad7e-4f48-b8c4-47a0eea38646': { title: 'Birth', description: 'Born as the son of Yi Ja-chun in the Ssangseong Chonggwanbu region of Goryeo' },
  '51968823-cfbe-47d3-8659-d6d44bf36d2c': { title: 'Wihwado Retreat', description: 'Led the Liaodong expedition army but turned back to seize political power' },
  '1c27c85e-eeb8-46b6-bc4d-03b689633bf1': { title: 'Founding of Joseon', description: 'Received abdication from Gongyang, the last king of Goryeo, and ascended the throne' },
  '740acdcc-366a-4d95-8371-7288976f3937': { title: 'Capital relocation to Hanyang', description: 'Moved the capital from Gaegyeong to Hanyang' },
  '69b1b957-c107-4909-b2fd-c23e15f64997': { title: 'Death', description: 'Passed away at Changdeokgung Gwangyeonru Pavilion' },

  // --- 정종 (조선) ---
  '8906058c-09ce-47ec-b6ff-a16300b10f46': { title: 'Birth', description: 'Born as the second son of Taejo' },
  'a9b0f803-3c89-419a-91be-19bb20f620b8': { title: 'Enthronement', description: 'Appointed Crown Prince and enthroned after the First Strife of Princes' },
  '7fa4565c-0cf2-4c85-938a-a6adb67eaf69': { title: 'Abdication', description: 'Abdicated in favor of his younger brother Bang-won and retired as Grand King' },
  '20920d41-32dc-4dd8-b331-b7907855af8b': { title: 'Death', description: 'Passed away at Indeokgung Palace' },

  // --- 태종 ---
  '1d163bc2-19f2-4c51-89a4-be6fe2915f0a': { title: 'Birth', description: 'Born as the fifth son of Taejo' },
  'd1be8a9f-6a64-4e2e-aedb-8fa7cff06a4f': { title: 'First Strife of Princes', description: 'Eliminated Jeong Do-jeon and others to seize political power' },
  '250db6c4-0b14-4429-8ae1-6f42e02921a8': { title: 'Enthronement', description: 'Received abdication from Jeongjong and ascended the throne' },
  'eeeb3644-b39d-4fdf-a3cf-be155c0286b4': { title: 'Implementation of the Hopae Law', description: 'Nationwide implementation of the identification tag system for population census and tax collection' },
  'aef60ca6-4c35-4f1a-9486-edd25871f486': { title: 'Abdication', description: 'Abdicated in favor of his third son, Grand Prince Chungnyeong (Sejong)' },
  '911ebe13-c99d-4af0-872d-fae80cb49e4d': { title: 'Death', description: 'Passed away at Yeonhwabang Yeonhuigung' },

  // --- 세종대왕 ---
  '4aee5baa-a33e-495e-abc4-a7576161bfa6': { title: 'Birth', description: 'Born as the third son of King Taejong' },
  'c6b1d80e-11b6-431c-909b-0047479758e9': { title: 'Enthronement', description: 'Ascended as the fourth king of Joseon' },
  'e2ca2aed-a86a-49d1-82f7-014f2fb0583b': { title: 'Creation of Hunminjeongeum', description: 'Created a new writing system for the common people' },
  'bb9c8e27-d40c-4a50-b919-0bfafe67f27c': { title: 'Promulgation of Hunminjeongeum', description: 'Published the Hunminjeongeum Haerye (explanatory text)' },
  'e874e4df-7435-4f69-a4f4-cf4b4ae117f7': { title: 'Death', description: 'Buried at Yeongneung Royal Tomb' },

  // --- 문종 (조선) ---
  '5005724d-43f7-489b-b343-71712b3d1fc7': { title: 'Birth', description: 'Born as the eldest son of Sejong' },
  '4595f18d-39bb-4d63-bb50-40bd481b13a5': { title: 'Investiture as Crown Prince', description: 'Appointed Crown Prince at the age of 8' },
  'a5e941dc-a2e8-49ad-bd1f-2c2f9c4689e1': { title: 'Enthronement', description: 'Succeeded Sejong to the throne' },
  '276c6ec0-0c35-4516-898a-e07934a8550f': { title: 'Completion of Goryeosa', description: 'Completed the compilation of the History of the Goryeo Dynasty' },
  '6913c10c-33be-4569-819e-476a6dcdfe93': { title: 'Death', description: 'Passed away at Gyeongbokgung Gangnyeongjeon' },

  // --- 단종 ---
  '8f15471b-6476-422d-a584-be282465d231': { title: 'Birth', description: 'Born as the only son of Munjong' },
  'e1752e9e-749c-4aa4-a8ee-439c32916e89': { title: 'Enthronement', description: 'Ascended the throne at the age of 12' },
  '281487c5-926f-459e-87e2-75610d0afb91': { title: 'Gyeyu Coup', description: 'Grand Prince Suyang eliminated Kim Jong-seo and others to seize power' },
  '8b51553b-6454-4c56-a562-4204956e2a9b': { title: 'Abdication as Grand King', description: 'Ceded the throne to Grand Prince Suyang and was elevated to Grand King' },
  'e67aa660-0d96-4b6c-ad5e-9c66ff754424': { title: 'Death', description: 'Died by poison in exile at Yeongwol' },

  // --- 세조 ---
  '98b64d77-731a-4368-a34e-15d786cf6f9d': { title: 'Birth', description: 'Born as the second son of Sejong, titled Grand Prince Suyang' },
  '87459268-e2e8-4f90-8909-03009983c854': { title: 'Gyeyu Coup', description: 'Killed Kim Jong-seo and others to seize real power' },
  '291fbb9d-528a-481b-9b5a-d41f991903b6': { title: 'Enthronement', description: 'Received abdication from Danjong and ascended the throne' },
  'fc9defcf-702a-4d83-9aaf-c6b69a808507': { title: 'Implementation of Jikjeon Law', description: 'Land system granting tax collection rights only to incumbent officials' },
  'd1e493e6-474e-4809-8cdf-9a4d59c25614': { title: 'Death', description: 'Passed away at Suganggung Palace' },

  // --- 예종 (조선) ---
  'ac4501cd-3b83-4cc5-9a58-19a8b548c89e': { title: 'Birth', description: 'Born as the second son of Sejo' },
  'fd7b03e5-0309-4550-afa2-74ca31513386': { title: 'Enthronement', description: 'Ascended after the death of Sejo' },
  '40b5ce73-c8f6-4b0a-b783-01bd358cb135': { title: 'Death', description: 'Passed away after only 14 months on the throne' },

  // --- 성종 (조선) ---
  '68cfa25c-c769-4586-8764-1f4d725cdc09': { title: 'Birth', description: 'Born as the second son of Crown Prince Uigyeong (posthumously titled King Deokjong)' },
  'a4a9a54c-0e66-4f42-9305-1de3b50f26a8': { title: 'Enthronement', description: 'Succeeded Yejong to the throne at age 13' },
  'f6fc557f-7ea5-4113-a849-a0c615f153f6': { title: 'Promulgation of Gyeongguk Daejeon', description: 'Completed and promulgated the fundamental legal code of Joseon' },
  'd31d1a47-eca6-4821-b9f6-85e97c90ce51': { title: 'Completion of Akhak Gwebeom', description: 'Compiled the treatise on music theory, Akhak Gwebeom' },
  '26170989-c74e-4929-aea3-a3c81291539e': { title: 'Death', description: 'Passed away at Changdeokgung Daejojeon' },

  // --- 연산군 ---
  '25585fd5-d611-4f76-8d37-3617c1349407': { title: 'Birth', description: 'Born as the son of Seongjong and Deposed Queen Yun' },
  '53f53d8d-34a2-4910-8d07-1be521fd469b': { title: 'Enthronement', description: 'Succeeded Seongjong to the throne' },
  '15c45cf8-5190-42a1-a84a-f9bed69adc73': { title: 'Muo Literati Purge (1498)', description: 'Purged Sarim scholars over Kim Jong-jik\'s Eulogy for King Yiji' },
  'aa161237-94cf-47cb-aadd-6d37a21d866d': { title: 'Gapja Literati Purge (1504)', description: 'Purged those involved in the death of his birth mother, Deposed Queen Yun' },
  '448699c5-3a25-418f-ade0-c4b9cd5d8ae9': { title: 'Deposition', description: 'Deposed by the Jungjong Restoration and exiled to Ganghwa Island' },

  // --- 중종 ---
  '5f3602a8-756f-4efa-b57d-eee5fe42d0b1': { title: 'Birth', description: 'Born as the second son of Seongjong (Grand Prince Jinseong)' },
  '9292d2fc-fd00-41dd-835e-c79fc61db33e': { title: 'Jungjong Restoration and Enthronement', description: 'Enthroned after Park Won-jong and others deposed Yeonsangun' },
  '03ab9fb2-a16b-4b15-89d4-b686d9718e07': { title: 'Gimyo Literati Purge (1519)', description: 'Purged radical Sarim reformers including Jo Gwang-jo' },
  'd98fb1f4-5e78-42cd-8269-15b7ebeab1d5': { title: 'Death', description: 'Passed away at Changgyeonggung Hwangyeongjeon' },

  // --- 인종 (조선) ---
  'c66235a3-3d2c-4235-bff6-288455b1c60b': { title: 'Birth', description: 'Born as the son of Jungjong and Queen Janggyeong' },
  '4eed1ba0-0f41-4514-9ad3-260494ccc053': { title: 'Enthronement', description: 'Succeeded Jungjong to the throne' },
  '388aa211-5a8b-4d8e-883e-9c7a5b73c76e': { title: 'Death', description: 'Passed away at Gyeongbokgung Daejojeon' },

  // --- 명종 (조선) ---
  '2f2b0c22-d49c-494c-b5d0-99f526d15d1c': { title: 'Birth', description: 'Born as the son of Jungjong and Queen Munjeong' },
  '560c92ee-032f-457e-a934-614ce8c0c25d': { title: 'Enthronement', description: 'Succeeded Injong at the age of 12' },
  'c8932110-192a-4506-99b7-f4ecc44cc297': { title: 'Eulsa Literati Purge (1545)', description: 'Purged the Greater Yun faction including Yun Im' },
  'a6335568-74aa-4229-91af-2d2555e47854': { title: 'Im Kkeokjeong\'s Rebellion (1559)', description: 'Im Kkeokjeong\'s band rose in rebellion across the Hwanghae Province' },
  '2f0030f0-e1f0-4f58-963d-1623d1beaf62': { title: 'Death', description: 'Passed away at Gyeongbokgung Yangsindang' },

  // --- 선조 ---
  'a73dd8be-f404-4161-9011-a09823fe3179': { title: 'Birth', description: 'Born as the grandson of Jungjong and son of Grand Internal Prince Deokheung' },
  'ca0b1214-35d0-47cd-bc44-9c8646161f00': { title: 'Enthronement', description: 'Succeeded Myeongjong to the throne' },
  '50e202aa-7a19-4edc-aee0-638abab5a386': { title: 'Outbreak of the Imjin War (1592)', description: 'War began with the Japanese invasion' },
  'df5f24fa-beb6-4ebe-bffe-67ec6165519d': { title: 'Death', description: 'Passed away at Gyeongungung (Deoksugung) Palace' },

  // --- 광해군 ---
  'b886ca9c-c470-42e3-9f5f-b996fbcce350': { title: 'Birth', description: 'Born as the second son of Seonjo' },
  'c3c3fa38-b3be-4bf9-9bb0-bfe4ebf46f89': { title: 'Investiture as Crown Prince', description: 'Appointed Crown Prince during the Imjin War and led the secondary court' },
  '8abb0e46-2ff1-410d-84d2-7c82457b79ee': { title: 'Enthronement', description: 'Succeeded Seonjo to the throne' },
  'dfa2f62c-53c2-4255-8879-edc2e9063d42': { title: 'Implementation of the Daedong Law', description: 'Reformed the tribute system by implementing the Daedong Law in Gyeonggi Province' },
  'e98dcc56-ef1c-46a9-aaa4-fffb4f3cd713': { title: 'Injo Restoration and Deposition', description: 'Deposed by the Westerner faction and exiled to Ganghwa Island' },
  '710c8e71-1009-4d14-a076-a57ff2d81d53': { title: 'Death', description: 'Died in exile on Jeju Island' },

  // --- 인조 ---
  'c1056a46-da5e-4818-9815-12937472fd72': { title: 'Birth', description: 'Born as the eldest son of Prince Jeongwon (later King Wonjo)' },
  'bda110df-725d-4424-81c9-2cea30095022': { title: 'Injo Restoration and Enthronement', description: 'Deposed Gwanghaegun and ascended the throne' },
  '17870387-f2ee-4daf-ab2b-b695cd27736d': { title: 'Manchu Invasion of 1636 (Byeongja Horan)', description: 'Fled to Namhansanseong Fortress due to the Qing invasion' },
  'b8a7c72c-a92c-41ec-a99c-25f9c911984f': { title: 'Surrender at Samjeondo', description: 'Performed the ritual of surrender to the Qing Emperor Taizong' },
  '9c9a653e-e373-49df-b959-c2e4701025d0': { title: 'Death', description: 'Passed away at Changdeokgung Daejojeon' },

  // --- 효종 ---
  'e56f8830-308f-41ef-a42b-b597776674f6': { title: 'Birth', description: 'Born as the second son of Injo (Grand Prince Bongrim)' },
  'c1a43d2e-0d35-4ea0-9139-937dcedd1b2f': { title: 'Captivity in Qing China', description: 'Taken as hostage to Shenyang after the defeat in the Manchu Invasion' },
  'b67f26aa-128e-4772-a504-0eacafbbe09f': { title: 'Enthronement', description: 'Succeeded Injo to the throne' },
  '06de861d-fc7a-43ba-a55f-81b025fabd08': { title: 'Death', description: 'Passed away at Changdeokgung Daejojeon' },

  // --- 현종 (조선) ---
  '8fda0726-eb70-4673-b8aa-e7f3046cb3cf': { title: 'Birth', description: 'Born at the hostage quarters in Shenyang where Hyojong was held captive' },
  '1afebc3d-8dfd-4fb5-a030-554a0ea3053d': { title: 'Enthronement', description: 'Succeeded Hyojong to the throne' },
  '8bbebeb0-f0a8-4d29-8426-d1808a1470ce': { title: 'Gihae Yesong Controversy (1659)', description: 'Debate over the mourning period for Dowager Queen Jawi during Hyojong\'s funeral' },
  '2d055cf0-6138-47bd-9cc2-cf3952b384c3': { title: 'Death', description: 'Passed away at Changdeokgung Jaesugak' },

  // --- 숙종 (조선) ---
  '5d333865-0976-482f-a059-65e18dfff8c8': { title: 'Birth', description: 'Born as the only son of Hyeonjong' },
  'cf4d9af0-26b7-43a5-9787-b68ed8b1af68': { title: 'Enthronement', description: 'Ascended to the throne at the age of 14' },
  '03ee8d0f-fc63-4b6d-928b-f9c668e96773': { title: 'Gyeongsin Hwanguk (1680)', description: 'The Westerners expelled the Southerners and seized power' },
  '4f0ec6bb-104e-4d61-8b91-00ae69cb6a0e': { title: 'Baekdusan Boundary Stele (1712)', description: 'Established the border with the Qing dynasty' },
  '62e2abd4-fdaf-4f0d-8bd6-e9c4cbbe88b4': { title: 'Death', description: 'Passed away at Gyeonghuigung Yungbokjeon' },

  // --- 경종 (조선) ---
  '420c0180-ad0e-47db-8b28-3adffd4e8d11': { title: 'Birth', description: 'Born as the son of Sukjong and Royal Concubine Jang (Jang Hui-bin)' },
  '030a2fd3-074e-4ce1-922b-d6c188552d9c': { title: 'Enthronement', description: 'Succeeded Sukjong to the throne' },
  '0a63c312-9670-4564-95ae-7aff302b4188': { title: 'Death', description: 'Passed away at Changgyeonggung Hwanchwi Pavilion' },

  // --- 영조 ---
  'daaf1fa2-eb83-443b-9fcd-cd406e181aa2': { title: 'Birth', description: 'Born as the son of Sukjong and Royal Concubine Choe (Sukbin)' },
  '65915fb9-4b62-4969-8d89-7af5656c2ae5': { title: 'Enthronement', description: 'Succeeded Gyeongjong to the throne' },
  'ca97e3b9-0603-405a-8cbb-288e3769b7ff': { title: 'Implementation of the Gyunyeok Law (1750)', description: 'Promulgated a law reducing the military service burden' },
  '449b13f8-366d-4f0b-b2cb-ef4c6dfb7b36': { title: 'Imo Incident (1762)', description: 'Locked his son Crown Prince Sado in a rice chest, causing his death' },
  '228f9684-503a-4cfe-b197-ed22d1f3df62': { title: 'Death', description: 'Passed away at Gyeonghuigung Jipgyeongdang' },

  // --- 정조 ---
  '9ab748a1-1a37-4744-820a-aab7d403ea2d': { title: 'Birth', description: 'Born as the son of Crown Prince Sado and Lady Hyegyeong' },
  '75c4940a-9e92-48f0-b134-80a03582b8ca': { title: 'Enthronement', description: 'Succeeded Yeongjo to the throne' },
  'd2e927b6-727d-4b93-a591-b98759631ea5': { title: 'Establishment of Gyujanggak (1776)', description: 'Founded the royal library and academic research institution' },
  '51e70668-f27a-480b-91fc-0c60dc0d2224': { title: 'Completion of Suwon Hwaseong (1796)', description: 'Built a new fortress city serving as both a new town and military stronghold' },
  '41fac570-624c-4603-b8e8-961d772ea7b8': { title: 'Death', description: 'Passed away at Changgyeonggung Yeongchunheon' },

  // --- 순조 (조선) ---
  '3524cd0c-1cfb-4ec9-87ad-79f1ca75d92d': { title: 'Birth', description: 'Born as the son of Jeongjo' },
  '3f753104-50be-40f9-81be-1cf6b762feea': { title: 'Enthronement', description: 'Ascended to the throne at the age of 11' },
  '7e4d34fe-76cd-44e1-b24f-77110799cf49': { title: 'Hong Gyeong-rae\'s Rebellion (1811)', description: 'A large-scale peasant uprising erupted in the Pyeongan Province' },
  '5bc1bfcd-0217-45be-b40b-1b7fdfc58115': { title: 'Death', description: 'Passed away at Gyeonghuigung Hoesangjeon' },

  // --- 헌종 (조선) ---
  '2d201c1c-6a1f-4813-b485-8368b81a60c0': { title: 'Birth', description: 'Born as the son of Crown Prince Hyomyeong (posthumously titled King Ikjong)' },
  '31d51e47-8add-4ec1-93dd-05ff91a80bed': { title: 'Enthronement', description: 'Ascended to the throne at the age of 8' },
  '975f7940-cd7c-442b-805c-9307af7cc2a2': { title: 'Gihae Catholic Persecution (1839)', description: 'Persecution of Catholic believers' },
  '6e2386a4-6321-4e58-9fde-0c35f81b9e03': { title: 'Death', description: 'Passed away at Changdeokgung Junghuidang' },

  // --- 철종 ---
  'be054a13-57a7-47ce-baf2-fbb1d66b3ed4': { title: 'Birth', description: 'Born as the son of Grand Internal Prince Jeongye' },
  '2b985018-bba8-4833-880c-fdb201a15db2': { title: 'Enthronement', description: 'Succeeded Heonjong to the throne' },
  '858fabc4-2256-411a-9a39-0a6794856175': { title: 'Imsul Peasant Uprising (1862)', description: 'Nationwide peasant revolts erupted due to corruption in the Three Administrations' },
  'e2196302-03f4-4acf-98f4-49f7b51d67fb': { title: 'Death', description: 'Passed away at Changdeokgung Daejojeon' },

  // --- 고종 (대한제국) ---
  '1c49041b-cabf-4858-bfe8-55faa41389ef': { title: 'Birth', description: 'Born as the second son of the Heungseon Daewongun' },
  '35302250-9683-46c8-8ade-669fa9a1ab58': { title: 'Enthronement', description: 'Succeeded Cheoljong to the throne' },
  '4fdd3317-0b36-4ad2-9c92-c619214e7cf1': { title: 'Proclamation of the Korean Empire (1897)', description: 'Proclaimed himself Emperor and changed the national name to the Korean Empire (Daehan Jeguk)' },
  '73f8a2bf-cb54-4c5c-bf5c-d40d3c24c3ce': { title: 'Forced abdication (1907)', description: 'Forced to abdicate by Japan following the Hague Secret Emissary Affair' },
  '64382768-d829-4df4-bffe-6a4db945a521': { title: 'Death', description: 'Passed away at Deoksugung Hamnyeongjeon (trigger for the March 1st Movement)' },

  // --- 순종 (대한제국) ---
  'cc869e60-44f1-4716-bf33-c464ba4eb5a5': { title: 'Birth', description: 'Born as the son of Gojong and Empress Myeongseong' },
  '20d8a377-6153-48cc-848f-5deac05e7d9f': { title: 'Enthronement', description: 'Ascended as Emperor after the abdication of Gojong' },
  'dfa75a3f-8607-4780-8446-d080beb2192c': { title: 'Japan-Korea Annexation (1910)', description: 'Lost national sovereignty through the Japan-Korea Annexation Treaty' },
  'ffaf50ec-604c-49a0-bc88-c3545024230b': { title: 'Death', description: 'Passed away at Changdeokgung Daejojeon' },

  // ═══ GORYEO DYNASTY ═══

  // --- 태조 왕건 ---
  '26058c82-3fc5-436f-8eed-788fa928dd98': { title: 'Birth', description: 'Born as the son of Wang Yung, a local clan leader of Songak' },
  '8f89592e-57a7-458c-bbc0-d26c44eeb523': { title: 'Founding of Goryeo', description: 'Overthrew Gung Ye and founded Goryeo, ascending the throne' },
  '167ff5ce-343a-4c9e-aa6f-20cfdf2c2773': { title: 'Silla\'s Surrender', description: 'Received the surrender of King Gyeongsun of Silla' },
  '8444e362-9626-41cf-b5b6-bddf4b474f34': { title: 'Unification of the Later Three Kingdoms', description: 'Destroyed Later Baekje and achieved reunification of the Korean peninsula' },
  '4047d20c-c78f-4081-83d7-9777203dbae7': { title: 'Death', description: 'Left the Ten Injunctions (Hunyo Sipjo) and passed away' },

  // --- 혜종 ---
  '177d2cc7-47bb-4003-b1d1-f976407b52cc': { title: 'Birth', description: 'Born in Naju as the son of Taejo and Queen Janghwa' },
  '680193c0-ae58-4fd9-87b0-5c5ad6cb974e': { title: 'Investiture as Crown Prince', description: 'Appointed as the first Crown Prince of Goryeo' },
  '09962447-a829-46a6-be3d-e2c6dcd2a0d6': { title: 'Enthronement', description: 'Succeeded Taejo to the throne' },
  'd9ccf7a1-1368-4c58-b6fe-292403cdd7c0': { title: 'Death', description: 'Passed away from illness after only 2 years on the throne' },

  // --- 정종 (고려) ---
  '6943ea02-28fc-45ca-9809-f4d5fc0bb75d': { title: 'Birth', description: 'Born as the son of Taejo and Queen Sinmyeong Sunseong' },
  'cb6d6f4d-0a7c-4a92-87a1-ed99a76e3f13': { title: 'Enthronement', description: 'Succeeded Hyejong to the throne' },
  '472f823a-dd34-4aa7-9467-345b71c4b854': { title: 'Organization of the Gwangun Army', description: 'Established a special force of 300,000 troops to defend against Khitan invasion' },
  '1db5991e-e985-4e3a-9351-bd7ac12b897d': { title: 'Death', description: 'Abdicated in favor of his younger brother So (Gwangjong) and passed away' },

  // --- 광종 ---
  '7dfc3677-1c7b-44f6-8f92-2c413d4898cd': { title: 'Birth', description: 'Born as the fourth son of Taejo' },
  '9cd274d9-9373-438a-8141-68dc3fe0daee': { title: 'Enthronement', description: 'Received abdication from Jeongjong and ascended the throne' },
  '811b04d8-eed2-4390-9dcd-6b44d08beb81': { title: 'Slave Review Act (956)', description: 'Liberated slaves who formed the economic and military base of powerful clans' },
  'd9bb8d4e-02a4-49c8-ad16-c88a2ccd07ca': { title: 'Civil Service Examination (958)', description: 'Began selecting officials with Confucian qualifications on Ssanggi\'s recommendation' },
  'a8a0cf63-8c0f-4e2f-9b31-e5b43843e29c': { title: 'Death', description: 'Passed away after establishing strong royal authority' },

  // --- 경종 (고려) ---
  '0e457b2b-1eff-4613-9c1c-cde9ef3aab3c': { title: 'Birth', description: 'Born as the son of Gwangjong and Queen Daemok' },
  '6b4c27bc-f7a5-43eb-a254-2c07b1885446': { title: 'Enthronement', description: 'Succeeded Gwangjong to the throne' },
  'cc6c158d-3b08-4a55-8bc9-7ab930800128': { title: 'Establishment of the Sijeongjeon-sigwa System (976)', description: 'Land distribution system based on rank and personal character' },
  '941b00af-41b5-4401-94c5-227fa33faa73': { title: 'Death', description: 'Abdicated in favor of his cousin (Seongjong) and passed away' },

  // --- 성종 (고려) ---
  'd7173e79-2952-4524-a955-56062b1abb72': { title: 'Birth', description: 'Born as the son of Taejong Wang Uk' },
  '25b98baa-e0ef-4c3c-ae0e-d0a5f8f95943': { title: 'Enthronement', description: 'Succeeded Gyeongjong to the throne' },
  '77ec1035-25f2-4e49-ae9e-c910c8ee3b16': { title: 'Acceptance of the 28 Points of Reform (982)', description: 'Adopted Choe Seungro\'s proposals to establish Confucian governance' },
  '4b7905c9-501b-436b-8aa6-edf618b10ded': { title: 'First Khitan Invasion (993)', description: 'Seo Hui\'s diplomatic negotiations secured the Six Garrison Settlements east of the Yalu' },
  '65de4b8e-5753-4842-9dfa-9ab916b40071': { title: 'Death', description: 'Passed away after establishing the national foundation' },

  // --- 목종 ---
  '16e7bdc5-819b-427b-b4b5-4c9c4cb3335d': { title: 'Birth', description: 'Born as the only son of Gyeongjong' },
  '35504482-be05-4808-afec-4bd5e3b78f57': { title: 'Enthronement', description: 'Succeeded Seongjong to the throne' },
  '64cd6e56-7539-49b6-8b51-e59bebb7b214': { title: 'Gang Jo\'s Coup and Deposition', description: 'Deposed by Gang Jo, the Commander of the Northwestern Border' },
  '5b9642d1-80e7-4ff5-b2d2-83fc7006d3c1': { title: 'Death', description: 'Killed while being transported to Jeokseong County' },

  // --- 현종 (고려) ---
  'f9e15bf1-6f1b-4846-817c-c916efbcbb90': { title: 'Birth', description: 'Born as the son of Anjong Wang Uk and Queen Hyosuk' },
  '996638a9-e1a4-40c8-84f4-1e3b0415d62e': { title: 'Enthronement', description: 'Enthroned with Gang Jo\'s support' },
  '614aae17-41f9-4bbe-a486-cb79e7680500': { title: 'Battle of Gwiju (1018)', description: 'General Gang Gam-chan decisively defeated the third Khitan invasion force' },
  'ad7c8d8d-6c60-4eb6-ae96-5d6be68bde01': { title: 'Death', description: 'Passed away after laying the foundation for Goryeo\'s golden age' },

  // --- 덕종 ---
  '5a1a6a5d-d4f2-4b27-bce5-143f03fae825': { title: 'Birth', description: 'Born as the son of Hyeonjong and Queen Wonseong' },
  'a06c2dc7-c8f9-4029-9141-c0970dd11b63': { title: 'Enthronement', description: 'Succeeded Hyeonjong to the throne' },
  '8c05d189-38d9-43d6-ad58-cee594b7bd39': { title: 'Beginning of Cheolli Jangseong Construction (1033)', description: 'Commenced building fortifications for northern border defense' },
  'f3cf35b0-824c-4155-8295-da4dfb793d7d': { title: 'Death', description: 'Passed away after only 3 years on the throne' },

  // --- 정종 (고려 10대) ---
  '6b8e6399-1ccb-4e21-9e2b-c8892207439e': { title: 'Birth', description: 'Born as the second son of Hyeonjong' },
  '69b8a3c7-940a-4fb1-a2c5-19cc23cadf7a': { title: 'Enthronement', description: 'Succeeded his brother Deokjong to the throne' },
  '77a16479-fe15-416a-ae7b-243ac501b279': { title: 'Completion of the Cheolli Jangseong (1044)', description: 'Completed the Thousand-Li Wall stretching from the Yalu River mouth to Doryeonpo' },
  '1ec0218e-9106-45ef-b6a3-bab5069d9b0f': { title: 'Death', description: 'Abdicated in favor of his brother (Munjong) and passed away' },

  // --- 문종 (고려) ---
  'c9e08ce7-b7ab-4a12-8e68-0f5997f51869': { title: 'Birth', description: 'Born as the third son of Hyeonjong' },
  'a29b18b3-a23a-416b-9638-d833121be58a': { title: 'Enthronement', description: 'Succeeded Jeongjong to the throne' },
  'a624c1ec-1b98-424f-bfcc-e51b836cc026': { title: 'Gyeongjeong Jeonsi-gwa System (1076)', description: 'Final reform of the land distribution system' },
  'f203f80f-3aa5-4a3c-8938-e243dc3d38d9': { title: 'Death', description: 'Passed away after presiding over an era of peace in Goryeo' },

  // --- 순종 (고려) ---
  'cbb43cec-44e3-430a-b153-8db436e3a498': { title: 'Birth', description: 'Born as the son of Munjong and Queen Inye' },
  '38194e06-cd91-43a1-a20b-c333e69a184e': { title: 'Enthronement', description: 'Ascended after the death of Munjong' },
  '2d859db6-121c-427d-a73c-b0ac62e15486': { title: 'Death', description: 'Passed away after only 3 months on the throne' },

  // --- 선종 (고려) ---
  'd0e8d8ff-b838-45a5-8530-9c17d603482a': { title: 'Birth', description: 'Born as the second son of Munjong' },
  '3ff84164-cbda-4443-952e-ba89f512c9a8': { title: 'Enthronement', description: 'Succeeded his brother Sunjong to the throne' },
  '2177e182-dbc6-416b-a4b6-dc255487e145': { title: 'Death', description: 'Passed away at Sarimwon' },

  // --- 헌종 (고려) ---
  '255568f4-842d-484e-ae65-9892a366459a': { title: 'Birth', description: 'Born as the eldest son of Seonjong' },
  '02856935-43f3-470d-87a9-b930d5984cb3': { title: 'Enthronement', description: 'Succeeded Seonjong to the throne at age 11' },
  '78584307-97a0-4081-b114-4aed4e804f91': { title: 'Abdication', description: 'Abdicated in favor of his uncle Wang Hui (Sukjong)' },
  '960d5600-9e8c-4868-b0c4-6a758eb6bdfb': { title: 'Death', description: 'Passed away at the age of 14' },

  // --- 숙종 (고려) ---
  '295685ee-5552-49b6-9cc3-aa6b1b3f7430': { title: 'Birth', description: 'Born as the third son of Munjong' },
  '231b10ff-7aa3-4bad-bb13-ca3e2ed65a9b': { title: 'Enthronement', description: 'Received abdication from Heonjong and ascended the throne' },
  '2a5802a7-e316-4ad2-b17c-28d8ecd54643': { title: 'Minting of Haedong Tongbo (1102)', description: 'Issued metal currency to stimulate monetary economy' },
  'ada1b271-999d-4209-9d60-63bf3c5273f6': { title: 'Creation of Byeolmuban (1104)', description: 'Organized a special military corps on Yun Gwan\'s recommendation for the Jurchen expedition' },
  '9ba7f703-944d-4e75-a6b7-d27fc887a89c': { title: 'Death', description: 'Passed away in his carriage while returning from Seogyeong' },

  // --- 예종 (고려) ---
  '07a34f0d-f1ff-4121-8a37-9888651441a6': { title: 'Birth', description: 'Born as the son of Sukjong and Queen Myeongui' },
  '05c3ca12-254e-4573-948b-89c525502c70': { title: 'Enthronement', description: 'Succeeded Sukjong to the throne' },
  '565e202b-c235-44be-a331-65f3cef0efbf': { title: 'Establishment of the Nine Northeastern Fortresses (1107)', description: 'General Yun Gwan conquered the Jurchen and built fortresses' },
  '844eb1cf-c871-47c8-906e-ab0769fbd8b3': { title: 'Establishment of Seven Academies (1109)', description: 'Strengthened education by establishing specialized courses within the National Academy' },
  '9e13bdf9-8734-4ef1-adc0-eca562be9b83': { title: 'Death', description: 'Passed away at the Anhwasa Detached Palace' },

  // --- 인종 (고려) ---
  '4a128b1c-a92b-4318-9ef6-5ca9eaa02e27': { title: 'Birth', description: 'Born as the eldest son of Yejong' },
  '8af72029-77ee-40de-8311-052c20f5f431': { title: 'Enthronement', description: 'Ascended to the throne at the age of 14' },
  '9a5e8875-b837-4100-8e39-118c746fd967': { title: 'Yi Ja-gyeom\'s Rebellion (1126)', description: 'The in-law Yi Ja-gyeom staged a rebellion, burning down the palace' },
  'd0dd4a28-034c-473f-8a3e-c465a3c7c8ef': { title: 'Myocheong\'s Rebellion (1135)', description: 'Seogyeong forces revolted but were suppressed by Kim Bu-sik' },
  '78a7ceeb-f2b5-4211-ae50-f8d465e53d6b': { title: 'Completion of the Samguk Sagi (1145)', description: 'Compiled the oldest extant historical text, the Samguk Sagi' },
  '59283deb-ce77-4a0b-8798-9c62263213b4': { title: 'Death', description: 'Passed away at Bohwajeon' },

  // --- 의종 ---
  '03e055b1-f430-4168-83e1-3fb49b6b766b': { title: 'Birth', description: 'Born as the son of Injong and Queen Gongye' },
  '2e981b8b-41c0-4e5f-8de7-fb89577e7d3b': { title: 'Enthronement', description: 'Succeeded Injong to the throne' },
  '84da3db7-20fb-4d8b-9cbb-fd55b78d74ab': { title: 'Military Officers\' Coup (1170)', description: 'Deposed at Bohyeonwon when Jeong Jung-bu and others staged a coup' },
  'e3a5575e-a432-41ee-b01d-2096f85afbba': { title: 'Death', description: 'Killed by Yi Ui-min after the failure of the restoration movement' },

  // --- 명종 (고려) ---
  'bee27dc4-2b3d-4b0c-b65d-7911ec203fca': { title: 'Birth', description: 'Born as the third son of Injong' },
  '3fd9aa95-9eb7-4a2e-bb45-b759cffd43a0': { title: 'Enthronement', description: 'Installed by the military officers' },
  'a4f1da3a-a7b0-440f-a12b-6b8e132162f4': { title: 'Deposition', description: 'Deposed by Choe Chungheon and exiled to Ganghwa Island' },
  'c14054a0-5bec-4abd-8c6e-ad70fe353b54': { title: 'Death', description: 'Passed away at Jiraksa Temple in Gaegyeong' },

  // --- 신종 ---
  '7a142667-5bf8-4a2e-967b-ef01746b1070': { title: 'Birth', description: 'Born as the fifth son of Injong' },
  'ecff25bb-8815-4679-9661-4ba27a11280f': { title: 'Enthronement', description: 'Installed by Choe Chungheon' },
  '7872f909-91a7-4a20-9c78-09812dd655a7': { title: 'Manjeok\'s Rebellion (1198)', description: 'Manjeok, a slave of Choe Chungheon, plotted for social class liberation' },
  '482dfb9f-aba1-4c98-8ef6-5896c9dc8ad2': { title: 'Death', description: 'Abdicated in favor of his son (Huijong) and passed away' },

  // --- 희종 ---
  '3c28ef0d-f385-41fb-b08b-53227940951e': { title: 'Birth', description: 'Born as the son of Sinjong' },
  '124f5920-9102-4601-862e-acbe4b72058d': { title: 'Enthronement', description: 'Succeeded Sinjong to the throne' },
  '39728a7d-e184-477a-b986-c272d86d1689': { title: 'Failed assassination attempt on Choe Chungheon (1211)', description: 'Attempted to kill Choe Chungheon but was discovered and deposed' },
  '8e3b6a00-f45a-4dd5-9226-79e031f73d86': { title: 'Death', description: 'Passed away at Beobwangsa Temple' },

  // --- 강종 ---
  'f1b6d76e-7654-46bd-a621-628c0467cec5': { title: 'Birth', description: 'Born as the son of Myeongjong' },
  'cf0447b3-f787-4606-8b1b-f55677d01ec8': { title: 'Exile', description: 'Exiled to Ganghwa Island together with his father' },
  'ef03a283-734c-40f9-b274-c479542cac45': { title: 'Enthronement', description: 'Installed by Choe Chungheon after the deposition of Huijong' },
  '14d2706f-9a2b-4a36-9854-d37842963dd1': { title: 'Death', description: 'Passed away after only 2 years on the throne' },

  // --- 고종 (고려) ---
  'b191014e-c55b-487f-91bf-3ab83effa63b': { title: 'Birth', description: 'Born as the son of Gangjong' },
  '6255a7e6-a83f-4fbc-836f-5d063d767892': { title: 'Enthronement', description: 'Succeeded Gangjong to the throne' },
  '11e17928-210b-4270-98b5-db91f741b290': { title: 'Beginning of the Mongol Invasions (1231)', description: 'First Mongol invasion occurred' },
  '407043cf-d046-4d58-b6c0-026d5e3c8bb9': { title: 'Capital relocation to Ganghwa (1232)', description: 'Moved the capital to Ganghwa Island for anti-Mongol resistance' },
  'd4f0a9de-b09c-4273-8200-cebc668a91ea': { title: 'Completion of the Tripitaka Koreana (1251)', description: 'Completed the Tripitaka Koreana to overcome national crisis through Buddhist faith' },
  'f5ded67c-8ed7-41ea-a411-46f05502dcbe': { title: 'Death', description: 'Passed away at the temporary palace in Ganghwa' },

  // --- 원종 ---
  '61bd79dd-daf1-4b32-8446-4059396d363a': { title: 'Birth', description: 'Born as the son of Gojong' },
  '75855aac-86db-4a0e-9c07-aea362c1a038': { title: 'Enthronement', description: 'Returned from Mongolia and ascended the throne' },
  '1de36e3a-d8a6-4a11-ae73-f19979f4d38c': { title: 'Return to Gaegyeong (1270)', description: 'Ended life on Ganghwa Island and returned to the capital' },
  '84889024-b649-49d1-ad08-2d2d1154f845': { title: 'Sambyeolcho Rebellion (1270)', description: 'Bae Jung-son and others rebelled against the return to the capital' },
  '92d706f2-369b-4ac5-862d-af56c11cfa70': { title: 'Death', description: 'Passed away after arranging the marriage of Chungnyeol and the Mongol princess' },

  // --- 충렬왕 ---
  '0c544cf1-7eee-4190-a0e0-146052f54e92': { title: 'Birth', description: 'Born as the son of Wonjong' },
  'a1c0b78a-9a8c-4c75-8be1-5070b32df1a2': { title: 'Enthronement', description: 'Succeeded Wonjong to the throne' },
  '76151646-acd5-4638-90d3-bbe9c7d6e8d4': { title: 'First Expedition against Japan (1274)', description: 'Joint attack on Japan with the Yuan dynasty' },
  'a04f9c60-cda7-45ca-87d8-417975f9207c': { title: 'Second Expedition against Japan (1281)', description: 'Second joint attack on Japan with Mongol-Goryeo allied forces' },
  'bab311f1-a006-4b0c-a877-7208127a4f46': { title: 'Death', description: 'Passed away during the period of Yuan dynasty interference' },

  // --- 충선왕 ---
  '63121477-ca21-4075-882a-9e9d6ff5d288': { title: 'Birth', description: 'Born as the son of Chungnyeol and Princess Jeguk Daejang of the Yuan' },
  '86fdbd60-fea7-4d3f-87fd-b4bcc9061e36': { title: 'First Enthronement (1298)', description: 'Enthroned through Chungnyeol\'s abdication but soon deposed' },
  '2ce892ec-256b-4daf-a6c9-8d2fedd420b1': { title: 'Second Enthronement (1308)', description: 'Reinstated after the death of Chungnyeol' },
  '7486535f-1a1b-49cd-b52d-9023c898471a': { title: 'Establishment of Mangyeondang (1314)', description: 'Founded an academic research institution in Beijing' },
  'd498b062-ab21-4c7e-a6ca-2478d3a20a33': { title: 'Death', description: 'Died in the Yuan dynasty' },

  // --- 충숙왕 ---
  '777064d0-02b7-4699-a88e-1fd8924becb7': { title: 'Birth', description: 'Born as the second son of Chungseon' },
  '03493410-286a-406a-88a8-d49769281e31': { title: 'Enthronement', description: 'Received abdication from Chungseon and ascended the throne' },
  '6971ab84-4cc4-4b02-8d67-2380ee94a884': { title: 'Death', description: 'Passed away from illness' },

  // --- 충혜왕 ---
  '5195fb53-1f83-418b-8803-f400e81d36b6': { title: 'Birth', description: 'Born as the eldest son of Chungsuk' },
  '42c43ad7-92ff-4f88-a795-2fe64b84d4e8': { title: 'First Enthronement (1330)', description: 'Succeeded Chungsuk to the throne' },
  'a6802f52-a949-4eaf-9e45-ceedf795bde8': { title: 'Deposition', description: 'Arrested by Yuan envoys due to his misdeeds' },
  '8c47f4a6-1bda-458e-bf9b-54a2f2a19e24': { title: 'Death', description: 'Died while being transported to his place of exile in Gayang' },

  // --- 충목왕 ---
  'bd144315-4a1d-4910-9f4a-01348cb61e65': { title: 'Birth', description: 'Born as the son of Chunghye' },
  'e8cdb09f-abba-4b5f-a1a7-224b365136d4': { title: 'Enthronement', description: 'Succeeded Chunghye to the throne' },
  '493be076-6c8a-49d5-a301-8a62bc8fe8e0': { title: 'Death', description: 'Passed away after only 4 years on the throne' },

  // --- 충정왕 ---
  'd98f0787-75d1-4297-81e2-a52336ee4862': { title: 'Birth', description: 'Born as an illegitimate son of Chunghye' },
  'f86c4ad5-0bfa-44ec-918a-fe265772bd5c': { title: 'Enthronement', description: 'Succeeded Chungmok to the throne' },
  'b8cec427-bb6a-4101-a9ef-28f47983767b': { title: 'Deposition', description: 'Deposed and exiled to Ganghwa Island when Gongmin ascended' },
  '4092986c-7eec-4d78-b6e8-19acb547e683': { title: 'Death', description: 'Poisoned at his place of exile' },

  // --- 공민왕 ---
  '86868f68-09dd-4aa6-b3ff-fd2a1a442bc3': { title: 'Birth', description: 'Born as the son of Chungsuk' },
  '41dd5798-38e2-47ce-8e89-cef19c1354ed': { title: 'Enthronement', description: 'Ousted Chungjeong and ascended the throne' },
  '34286bb9-0c9c-4fed-af1a-820a1085207d': { title: 'Anti-Yuan Reforms (1356)', description: 'Purged pro-Yuan forces including Gi Cheol and recaptured the Ssangseong Chonggwanbu' },
  '14423aea-0c66-4fa4-84e3-1eaef0b3b214': { title: 'Establishment of the Jeonmin Byeonjeong Dogam (1366)', description: 'Restored land and slaves seized by powerful families through Sin Don' },
  '62019407-5158-490d-84b9-a6e4224ebb05': { title: 'Death', description: 'Assassinated by Choe Man-saeng and others from the Jajeui guard' },

  // --- 우왕 ---
  '6049538c-b5af-4a86-9153-60501ab987b0': { title: 'Birth', description: 'Born to King Gongmin and a woman named Banya' },
  '20ef0891-74a4-4978-b1fe-4c647eb2e809': { title: 'Enthronement', description: 'Enthroned by Yi In-im after the death of Gongmin' },
  '31843683-b747-43c7-8def-35fbdb6f30c0': { title: 'Liaodong Expedition Plan (1388)', description: 'Ordered the Liaodong campaign against the Ming dynasty together with Choe Yeong' },
  'd86a4630-bcaa-44ee-8066-9e366f51670f': { title: 'Deposition', description: 'Driven out by Yi Seong-gye who retreated from Wihwado' },
  '3a69fea2-fee8-4525-a8b9-0df44d325917': { title: 'Death', description: 'Killed in exile at Gangneung' },

  // --- 창왕 ---
  '16b0e683-8041-4bb5-97ec-d8bd1e34e544': { title: 'Birth', description: 'Born as the son of King U' },
  '844978d7-4244-4536-8cb8-5cc1965762cf': { title: 'Enthronement', description: 'Installed by Yi Seong-gye after the deposition of King U' },
  '3b1d0e63-bebc-4912-bcff-1179b14fe0b9': { title: 'Deposition and Death', description: 'Exiled to Ganghwa Island and executed together with his father King U' },

  // --- 공양왕 ---
  '4f867f86-715a-4c83-b7a4-15d9b22b08bf': { title: 'Birth', description: 'Born as the son of Jeongwon Buwongun Wang Gyun, 7th-generation descendant of Sinjong' },
  '5104f73c-f3e9-48b7-b0b3-64eccdb3f19a': { title: 'Enthronement', description: 'Installed by Yi Seong-gye\'s faction after the deposition of Chang' },
  '119cfc9b-ffad-4f6f-9565-2fa01d11b9cd': { title: 'Gwajeon Law (1391)', description: 'Land reform to establish the economic foundation for the new scholar-official class' },
  'c6f12fa6-28e5-4758-92d3-b30a3c5729e8': { title: 'Deposition', description: 'Abdicated to Yi Seong-gye, ending the Goryeo dynasty' },
  '207ff951-991e-4b83-b229-4d5f3b1f8581': { title: 'Death', description: 'Killed at his place of exile in Samcheok' },
};

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log('Starting English translation batch...\n');

  // 1. Insert person_translations
  const personRows = Object.entries(personTranslations)
    .filter(([, v]) => v.summary || v.birth_place)
    .map(([personId, v]) => ({
      person_id: personId,
      locale: 'en',
      summary: v.summary || null,
      birth_place: v.birth_place || null,
      is_ai_translated: false,
    }));

  console.log(`Inserting ${personRows.length} person translations...`);

  // Batch in groups of 20
  for (let i = 0; i < personRows.length; i += 20) {
    const batch = personRows.slice(i, i + 20);
    const { error } = await supabase
      .from('person_translations')
      .upsert(batch, { onConflict: 'person_id,locale' });
    if (error) {
      console.error(`Error at person batch ${i}:`, error.message);
    } else {
      console.log(`  person batch ${i}-${i + batch.length} OK`);
    }
  }

  // 2. Insert person_timeline_translations
  const timelineRows = Object.entries(timelineTranslations).map(([timelineId, v]) => ({
    timeline_id: timelineId,
    locale: 'en',
    title: v.title,
    description: v.description,
    is_ai_translated: false,
  }));

  console.log(`\nInserting ${timelineRows.length} timeline translations...`);

  for (let i = 0; i < timelineRows.length; i += 20) {
    const batch = timelineRows.slice(i, i + 20);
    const { error } = await supabase
      .from('person_timeline_translations')
      .upsert(batch, { onConflict: 'timeline_id,locale' });
    if (error) {
      console.error(`Error at timeline batch ${i}:`, error.message);
    } else {
      console.log(`  timeline batch ${i}-${i + batch.length} OK`);
    }
  }

  // 3. Verify counts
  const { count: ptCount } = await supabase
    .from('person_translations')
    .select('*', { count: 'exact', head: true })
    .eq('locale', 'en');

  const { count: ttCount } = await supabase
    .from('person_timeline_translations')
    .select('*', { count: 'exact', head: true })
    .eq('locale', 'en');

  console.log(`\n=== Done ===`);
  console.log(`person_translations (en): ${ptCount}`);
  console.log(`person_timeline_translations (en): ${ttCount}`);
}

main().catch(console.error);
