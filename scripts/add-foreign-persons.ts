/**
 * 한국사 관련 외국인 인물 20명 일괄 등록 스크립트
 * 실행: npx tsx scripts/add-foreign-persons.ts
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
  name_hanja?: string | null;
  name_en: string;
  birth_year: number;
  death_year?: number;
  birth_place?: string;
  summary: string;
  is_controversial?: boolean;
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

// Load JSON
const jsonPath = resolve(process.cwd(), 'foreign-figures-additional.json');
const jsonData = JSON.parse(readFileSync(jsonPath, 'utf-8'));

const persons: PersonInput[] = jsonData.persons.map((p: any) => {
  const timeline = generateTimeline(p);
  return {
    slug: p.slug,
    name_ko: p.name_ko,
    name_hanja: p.name_hanja || undefined,
    name_en: p.name_en,
    birth_year: p.birth_year,
    death_year: p.death_year,
    birth_place: p.birth_place,
    summary: p.summary,
    is_controversial: p.is_controversial ?? false,
    is_alive: p.is_alive,
    is_published: true,
    tag_names: p.tags,
    timeline,
  };
});

function generateTimeline(p: any): PersonInput['timeline'] {
  const timelines: Record<string, PersonInput['timeline']> = {
    'emperor-yang-of-sui': [
      { year: 569, title: 'Born in Chang\'an', sort_order: 0 },
      { year: 604, title: 'Ascended the Sui Throne', description: 'Became the second emperor of the Sui dynasty.', sort_order: 1 },
      { year: 612, title: 'First Invasion of Goguryeo', description: 'Mobilized over a million troops; catastrophically defeated at the Battle of Salsu by General Eulji Mundeok.', sort_order: 2 },
      { year: 613, title: 'Second Invasion of Goguryeo', description: 'Campaign aborted due to internal rebellion.', sort_order: 3 },
      { year: 614, title: 'Third Invasion of Goguryeo', description: 'Failed again, further weakening the Sui dynasty.', sort_order: 4 },
      { year: 618, title: 'Death', description: 'Assassinated by his own officials; Sui dynasty collapsed.', sort_order: 5 },
    ],
    'emperor-taizong-of-tang': [
      { year: 598, title: 'Born in Wugong', sort_order: 0 },
      { year: 626, title: 'Ascended the Tang Throne', description: 'Became emperor after the Xuanwu Gate Incident.', sort_order: 1 },
      { year: 645, title: 'Invasion of Goguryeo', description: 'Personally led 100,000 troops but was repelled at Ansi Fortress after an 88-day siege.', sort_order: 2 },
      { year: 647, title: 'Second Campaign Against Goguryeo', description: 'Sent naval forces; again failed to conquer.', sort_order: 3 },
      { year: 649, title: 'Death', description: 'Died without achieving his goal of conquering Goguryeo.', sort_order: 4 },
    ],
    'kublai-khan': [
      { year: 1215, title: 'Born in Mongolia', sort_order: 0 },
      { year: 1260, title: 'Became Great Khan', description: 'Claimed leadership of the Mongol Empire.', sort_order: 1 },
      { year: 1270, title: 'Subjugation of Goryeo', description: 'Goryeo submitted after nearly 40 years of resistance (1231-1270).', sort_order: 2 },
      { year: 1274, title: 'First Invasion of Japan via Korea', description: 'Used Korea as staging ground; fleet destroyed by typhoon.', sort_order: 3 },
      { year: 1281, title: 'Second Invasion of Japan via Korea', description: 'Another massive fleet launched from Korea; again destroyed by storms.', sort_order: 4 },
      { year: 1294, title: 'Death', description: 'Died in Khanbaliq (Beijing).', sort_order: 5 },
    ],
    'hongwu-emperor': [
      { year: 1328, title: 'Born in Haozhou', sort_order: 0 },
      { year: 1368, title: 'Founded the Ming Dynasty', description: 'Overthrew the Yuan dynasty and established the Ming.', sort_order: 1 },
      { year: 1392, title: 'Recognized Joseon Dynasty', description: 'Legitimized the new Korean dynasty founded by King Taejo.', sort_order: 2 },
      { year: 1393, title: 'Bestowed the Name Joseon', description: 'Chose the name Joseon (朝鮮) for the new Korean kingdom.', sort_order: 3 },
      { year: 1398, title: 'Death', description: 'Died in Nanjing.', sort_order: 4 },
    ],
    'tokugawa-ieyasu': [
      { year: 1543, title: 'Born in Mikawa Province', sort_order: 0 },
      { year: 1600, title: 'Battle of Sekigahara', description: 'Decisive victory establishing his dominance over Japan.', sort_order: 1 },
      { year: 1603, title: 'Founded the Tokugawa Shogunate', description: 'Became Shogun, beginning 260 years of Tokugawa rule.', sort_order: 2 },
      { year: 1607, title: 'First Joseon Tongsinsa', description: 'Initiated Korean diplomatic missions to Japan, restoring relations after the Imjin War.', sort_order: 3 },
      { year: 1616, title: 'Death', description: 'Died at Sunpu Castle.', sort_order: 4 },
    ],
    'so-yoshitoshi': [
      { year: 1568, title: 'Born in Tsushima', sort_order: 0 },
      { year: 1587, title: 'Became Daimyo of Tsushima', description: 'Inherited the domain that depended on Korea trade.', sort_order: 1 },
      { year: 1592, title: 'Imjin War Participation', description: 'Reluctantly joined Hideyoshi\'s invasion as vanguard force.', sort_order: 2 },
      { year: 1604, title: 'Diplomatic Restoration Efforts', description: 'Worked to restore Joseon-Japan relations after the war.', sort_order: 3 },
      { year: 1615, title: 'Death', description: 'Died in Tsushima.', sort_order: 4 },
    ],
    'admiral-roze': [
      { year: 1812, title: 'Born in Reunion Island, France', sort_order: 0 },
      { year: 1866, month: 10, title: 'French Expedition Against Joseon (Byeongin Yangyo)', description: 'Led punitive expedition in retaliation for execution of French missionaries; attacked Ganghwa Island.', sort_order: 1 },
      { year: 1866, month: 11, title: 'Looting of Oegyujanggak', description: 'French forces looted the royal library on Ganghwa Island before withdrawing.', sort_order: 2 },
      { year: 1883, title: 'Death', description: 'Died in France.', sort_order: 3 },
    ],
    'robert-shufeldt': [
      { year: 1822, title: 'Born in Red Hook, New York', sort_order: 0 },
      { year: 1867, title: 'Early Career in East Asia', description: 'Served in various naval postings in the Pacific.', sort_order: 1 },
      { year: 1882, title: 'Treaty of Jemulpo Signed', description: 'Negotiated Korea\'s first treaty with a Western nation, opening the Hermit Kingdom to the modern world.', sort_order: 2 },
      { year: 1895, title: 'Death', description: 'Died in Washington, D.C.', sort_order: 3 },
    ],
    'simeon-berneux': [
      { year: 1814, title: 'Born in Chateau-du-Loir, France', sort_order: 0 },
      { year: 1856, title: 'Appointed Vicar Apostolic of Korea', description: 'Became the fourth head of the Catholic mission in Korea.', sort_order: 1 },
      { year: 1866, month: 3, title: 'Martyrdom', description: 'Arrested and beheaded during the Byeongin Persecution; later canonized as one of the 103 Korean Martyrs.', sort_order: 2 },
    ],
    'frederick-mckenzie': [
      { year: 1869, title: 'Born in Quebec, Canada', sort_order: 0 },
      { year: 1906, title: 'Arrived in Korea as Journalist', description: 'Began reporting on Japanese encroachment on Korean sovereignty.', sort_order: 1 },
      { year: 1908, title: 'Published "The Tragedy of Korea"', description: 'Exposed Japanese colonization to the Western world.', sort_order: 2 },
      { year: 1919, title: 'Witnessed March 1st Movement', description: 'Documented the independence movement and Japanese suppression.', sort_order: 3 },
      { year: 1920, title: 'Published "Korea\'s Fight for Freedom"', description: 'Became a crucial text for the Korean independence movement.', sort_order: 4 },
      { year: 1931, title: 'Death', description: 'Died in Canada.', sort_order: 5 },
    ],
    'saito-makoto': [
      { year: 1858, title: 'Born in Mizusawa, Japan', sort_order: 0 },
      { year: 1919, title: 'Appointed Governor-General of Korea', description: 'Took office after the March 1st Movement forced a change in colonial policy.', sort_order: 1 },
      { year: 1920, title: 'Introduced Cultural Rule', description: 'Relaxed press restrictions and allowed limited Korean-language publications, though colonial control continued.', sort_order: 2 },
      { year: 1927, title: 'End of First Term', description: 'Left office; returned for a second term 1929-1931.', sort_order: 3 },
      { year: 1936, title: 'Death', description: 'Assassinated during the February 26 Incident in Tokyo.', sort_order: 4 },
    ],
    'minami-jiro': [
      { year: 1874, title: 'Born in Oita, Japan', sort_order: 0 },
      { year: 1936, title: 'Appointed Governor-General of Korea', description: 'Began the most aggressive assimilation period of colonial rule.', sort_order: 1 },
      { year: 1939, title: 'Enforced Soshi-kaimei', description: 'Forced Koreans to adopt Japanese names; banned Korean language in schools.', sort_order: 2 },
      { year: 1942, title: 'End of Tenure', description: 'Left office after implementing total wartime mobilization of Koreans.', sort_order: 3 },
      { year: 1955, title: 'Death', description: 'Died in Japan.', sort_order: 4 },
    ],
    'frank-schofield': [
      { year: 1889, title: 'Born in Rugby, England', sort_order: 0 },
      { year: 1916, title: 'Arrived in Korea', description: 'Came as a missionary and veterinary scientist.', sort_order: 1 },
      { year: 1919, title: 'Documented March 1st Movement', description: 'Photographed and reported on the movement and Japanese suppression, including the Jeamni massacre.', sort_order: 2 },
      { year: 1958, title: 'Returned to Korea', description: 'Invited by Korean government; spent remaining years in Korea.', sort_order: 3 },
      { year: 1970, title: 'Death', description: 'Died in Seoul; buried in the Korean National Cemetery as the only foreigner.', sort_order: 4 },
    ],
    'mary-scranton': [
      { year: 1832, title: 'Born in Belchertown, Massachusetts', sort_order: 0 },
      { year: 1885, title: 'Arrived in Korea', description: 'Came as a Methodist missionary with her son.', sort_order: 1 },
      { year: 1886, title: 'Founded Ewha Hakdang', description: 'Established the first modern educational institution for women in Korea, starting with one student.', sort_order: 2 },
      { year: 1909, title: 'Death', description: 'Died in Seoul after dedicating 23 years to Korean women\'s education.', sort_order: 3 },
    ],
    'douglas-macarthur': [
      { year: 1880, title: 'Born in Little Rock, Arkansas', sort_order: 0 },
      { year: 1945, title: 'Accepted Japan\'s Surrender', description: 'Oversaw the post-WWII occupation of Japan.', sort_order: 1 },
      { year: 1950, month: 9, title: 'Incheon Landing', description: 'Daring amphibious operation that turned the tide of the Korean War and liberated Seoul.', sort_order: 2 },
      { year: 1950, month: 11, title: 'Push to the Yalu River', description: 'Advanced to the Chinese border, triggering Chinese intervention.', sort_order: 3 },
      { year: 1951, title: 'Relieved of Command', description: 'Dismissed by President Truman for publicly advocating expansion of the war into China.', sort_order: 4 },
      { year: 1964, title: 'Death', description: 'Died in Washington, D.C.', sort_order: 5 },
    ],
    'mao-zedong': [
      { year: 1893, title: 'Born in Shaoshan, Hunan', sort_order: 0 },
      { year: 1949, title: 'Founded People\'s Republic of China', description: 'Proclaimed the PRC after Communist victory in the civil war.', sort_order: 1 },
      { year: 1950, month: 10, title: 'Chinese Intervention in Korean War', description: 'Sent 300,000 troops into Korea, dramatically changing the course of the conflict.', sort_order: 2 },
      { year: 1950, month: 11, title: 'Son Mao Anying Killed in Korea', description: 'His eldest son died in a UN bombing raid in Korea.', sort_order: 3 },
      { year: 1953, title: 'Korean War Armistice', description: 'The intervention ensured the division of Korea that persists today.', sort_order: 4 },
      { year: 1976, title: 'Death', description: 'Died in Beijing.', sort_order: 5 },
    ],
    'peng-dehuai': [
      { year: 1898, title: 'Born in Xiangtan, Hunan', sort_order: 0 },
      { year: 1950, month: 10, title: 'Commanded Chinese Forces in Korea', description: 'Led the People\'s Volunteer Army into the Korean War.', sort_order: 1 },
      { year: 1950, month: 11, title: 'Battle of Chosin Reservoir', description: 'Surrounded and devastated UN forces in one of the war\'s fiercest battles.', sort_order: 2 },
      { year: 1951, title: 'Recaptured Seoul', description: 'Chinese offensive pushed UN forces back below the 38th parallel.', sort_order: 3 },
      { year: 1953, title: 'Korean War Armistice Signed', description: 'Signed the armistice agreement on behalf of China.', sort_order: 4 },
      { year: 1974, title: 'Death', description: 'Died during the Cultural Revolution after years of persecution.', sort_order: 5 },
    ],
    'matthew-ridgway': [
      { year: 1895, title: 'Born in Fort Monroe, Virginia', sort_order: 0 },
      { year: 1950, month: 12, title: 'Took Command of Eighth Army', description: 'Replaced General Walker; revitalized the demoralized forces.', sort_order: 1 },
      { year: 1951, month: 3, title: 'Operation Ripper', description: 'Methodical counteroffensive that recaptured Seoul.', sort_order: 2 },
      { year: 1951, month: 4, title: 'Became Supreme UN Commander', description: 'Replaced MacArthur; stabilized the front with his "meat grinder" strategy.', sort_order: 3 },
      { year: 1993, title: 'Death', description: 'Died at age 98.', sort_order: 4 },
    ],
    'john-hodge': [
      { year: 1893, title: 'Born in Golconda, Illinois', sort_order: 0 },
      { year: 1945, month: 9, title: 'Became Military Governor of Southern Korea', description: 'Led USAMGIK (US Army Military Government in Korea) after Japan\'s surrender.', sort_order: 1 },
      { year: 1946, title: 'Controversial Administrative Decisions', description: 'Retained Japanese colonial administrators, sparking Korean outrage.', sort_order: 2 },
      { year: 1948, title: 'End of Military Government', description: 'USAMGIK dissolved as the Republic of Korea was established.', sort_order: 3 },
      { year: 1963, title: 'Death', description: 'Died in Washington, D.C.', sort_order: 4 },
    ],
    'francesca-donner': [
      { year: 1900, title: 'Born in Vienna, Austria', sort_order: 0 },
      { year: 1933, title: 'Met Syngman Rhee in Geneva', description: 'Met the future Korean president at a conference.', sort_order: 1 },
      { year: 1934, title: 'Married Syngman Rhee', description: 'Married in New York and devoted her life to Korea\'s cause.', sort_order: 2 },
      { year: 1948, title: 'Became First Lady of South Korea', description: 'Served as presidential spouse and closest advisor to Rhee.', sort_order: 3 },
      { year: 1960, title: 'Exile After April Revolution', description: 'Left Korea with Rhee after the student revolution.', sort_order: 4 },
      { year: 1992, title: 'Death', description: 'Died in Korea, where she had returned after Rhee\'s death.', sort_order: 5 },
    ],
  };

  return timelines[p.slug] || [
    { year: p.birth_year, title: `Born in ${p.birth_place || 'Unknown'}`, sort_order: 0 },
    ...(p.death_year ? [{ year: p.death_year, title: 'Death', sort_order: 1 }] : []),
  ];
}

// ── 실행 ──

async function main() {
  console.log(`\nAdding ${persons.length} foreign historical persons...\n`);

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
      console.log(`SKIP: ${input.name_en} (${input.slug}) — already exists`);
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
      console.log(`FAIL: ${input.name_en} — ${error.message}`);
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

    console.log(`OK: ${input.name_en} (${input.slug})`);
    success++;
  }

  console.log(`\n── Results ──`);
  console.log(`Created: ${success}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed:  ${failed}`);
  console.log(`Total:   ${persons.length}\n`);
}

main().catch(console.error);
