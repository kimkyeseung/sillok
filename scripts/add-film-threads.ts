/**
 * 영화·드라마 인물 스레드 일괄 생성 스크립트
 * 실행: npx tsx scripts/add-film-threads.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  if (!process.env[trimmed.slice(0, eqIdx).trim()])
    process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ThreadSeed {
  slug: string;
  title: string;
  content: string;
}

const threads: ThreadSeed[] = [
  // ── 감독 ──
  {
    slug: 'kim-ki-duk',
    title: 'Kim Ki-duk never went to film school and taught himself everything from painting in Paris',
    content: `Before becoming one of Korea's most controversial directors, Kim Ki-duk was a factory worker who dropped out of school at 17. He drifted to Paris in his late twenties to study painting — not film — and only discovered cinema almost by accident.\n\nHe returned to Korea and wrote two screenplays that won government funding, launching a career that produced over 20 films in 20 years. His style was so minimalist that some of his films had barely any dialogue at all. Spring, Summer, Fall, Winter... and Spring used a floating Buddhist temple as its only set.\n\nThe Venice Golden Lion for Pieta in 2012 made him the first Korean director to win the top prize at a major European festival. What's the most striking self-taught artist-to-filmmaker transition you know of?`,
  },
  {
    slug: 'lee-chang-dong',
    title: 'Lee Chang-dong was a published novelist before he ever touched a camera — and then became a government minister',
    content: `Lee Chang-dong had already established himself as a respected literary author before making his first film at age 43. His novels explored working-class Korean life with a precision that translated directly into his filmmaking.\n\nBut here's the wild part: between making Oasis (2002) and Secret Sunshine (2007), he served as South Korea's actual Minister of Culture and Tourism. Imagine a Sundance darling getting appointed Secretary of Culture.\n\nBurning (2018) scored the highest-ever Screen rating at Cannes at the time — 3.8 out of 4 — yet somehow didn't win the Palme d'Or. It remains one of the great Cannes snubs. Has any other director had a career path this unusual?`,
  },
  {
    slug: 'hong-sang-soo',
    title: 'Hong Sang-soo has made over 30 films and most of them are about people drinking soju and talking',
    content: `Hong Sang-soo is the most prolific art-house director in Korea — sometimes releasing two or three films a year. His secret? Minimal crew, no elaborate sets, and scripts he writes the morning of each shoot.\n\nAlmost every film features the same elements: an awkward encounter, a restaurant or café, soju being poured, and a conversation that circles back on itself. Critics either love the repetition as a meditation on human patterns or dismiss it as the same movie on repeat.\n\nDespite (or because of) this, Berlin keeps awarding him — Silver Bear Grand Jury Prize in 2020, Grand Jury Prize in 2022. He might be the only director who can win at a major festival with a film that cost less than a nice car.`,
  },
  {
    slug: 'hwang-dong-hyuk',
    title: 'Hwang Dong-hyuk pitched Squid Game for 10 years before Netflix said yes — and he was nearly broke',
    content: `Hwang Dong-hyuk wrote the first draft of Squid Game in 2008. Every Korean studio turned it down. "Too violent," "too unrealistic," "who would watch this?" He shelved the script and spent a decade making other films.\n\nBy the time Netflix finally picked it up, he had sold his laptop and was in significant personal debt. The show then became the most-watched Netflix series in history with 1.65 billion viewing hours, making him the first Asian to win an Emmy for directing.\n\nHis earlier film Silenced (2011) was so powerful it actually changed Korean law — the National Assembly amended the sexual violence statute after public outcry from the film. Not many directors can say their movie literally changed legislation.`,
  },
  {
    slug: 'na-hong-jin',
    title: 'Na Hong-jin made only 3 films in 16 years and every single one is a masterpiece',
    content: `Most directors build a filmography of 10-20 films. Na Hong-jin has made exactly three since 2008: The Chaser, The Yellow Sea, and The Wailing. All three are considered among the best Korean thrillers ever made.\n\nThe Chaser was based on a real Korean serial killer case and was so tense that audiences reportedly couldn't eat during screenings. The Wailing blended supernatural horror with a murder mystery set in a rural village, leaving audiences debating its ending for years.\n\nHe's been reportedly working on his fourth film for nearly a decade. When your batting average is 3 for 3, the pressure for #4 must be unbearable. What's the longest you'd wait for a director's next film?`,
  },
  {
    slug: 'yeon-sang-ho',
    title: 'Yeon Sang-ho made animated films about societal cruelty so dark that producers said "just do it live action" — and he made Train to Busan',
    content: `Before Train to Busan made him famous, Yeon Sang-ho was an independent animator making deeply unsettling films about bullying, class violence, and social decay. The King of Pigs and Seoul Station were so thematically intense that they attracted film festival attention but minimal commercial interest.\n\nWhen he pitched a zombie movie, producers essentially told him to go mainstream. He took his class commentary, wrapped it in a zombie survival thriller set on a train, and created the first Korean film to break 10 million admissions on opening weekend.\n\nHe then created Hellbound for Netflix, which hit #1 globally on its release day. The man went from making $50,000 indie animations to commanding Netflix's global charts.`,
  },

  // ── 남자배우 ──
  {
    slug: 'choi-min-sik',
    title: 'Choi Min-sik actually ate four live octopuses for the famous Oldboy scene and he\'s Buddhist',
    content: `The corridor fight scene in Oldboy gets all the attention, but the live octopus eating scene might be the most committed piece of acting in Korean cinema. Choi Min-sik, a practicing Buddhist, ate four live octopuses across multiple takes — praying before each one.\n\nHe's known for disappearing so completely into roles that directors have called him "dangerous to work with" — not because he's difficult, but because his intensity forces everyone else to elevate their game.\n\nIn 2014 he played Admiral Yi Sun-sin in The Admiral: Roaring Currents, which became the highest-grossing Korean film of all time with 17.6 million admissions. That's roughly one-third of South Korea's entire population watching a single movie.`,
  },
  {
    slug: 'ha-jung-woo',
    title: 'Ha Jung-woo\'s combined filmography has sold over 100 million tickets in a country of 52 million people',
    content: `To put Ha Jung-woo's box office power in perspective: South Korea has about 52 million people. His films have collectively sold over 100 million tickets. That means, statistically, every Korean has watched roughly two of his movies.\n\nHe works at a relentless pace — sometimes starring in 3-4 films a year across wildly different genres. From serial killer thrillers (The Chaser) to period erotica (The Handmaiden) to fantasy blockbusters (Along with the Gods), he seems incapable of saying no to a good script.\n\nHe's also the son of actor Kim Yong-gun, making him one of Korea's rare second-generation film stars. Unlike most nepo babies though, nobody questions whether he earned his spot.`,
  },
  {
    slug: 'hwang-jung-min',
    title: 'Hwang Jung-min has won Best Actor at the Blue Dragon Awards four times and nobody in Korea thinks that\'s enough',
    content: `Four Blue Dragon Best Actor awards would make anyone else a legend. For Hwang Jung-min, Korean audiences just shrug and say "of course." His range is genuinely unmatched — he can be a terrifying gangster in New World, a heartbreaking father in Ode to My Father, and a goofy cab driver in A Taxi Driver, all within a few years.\n\nOde to My Father (2014) is essentially Korea's Forrest Gump — one man's life spanning modern Korean history from the Korean War to present day. It drew 14 million viewers and had entire theaters crying.\n\nThe most impressive thing might be his chemistry with literally everyone. Put him next to Song Kang-ho? Magic. Next to Lee Jung-jae? Magic. Next to a complete newcomer? Still magic.`,
  },
  {
    slug: 'ma-dong-seok',
    title: 'Ma Dong-seok grew up in Ohio, became a personal trainer for UFC fighters, and then accidentally became Korea\'s biggest action star',
    content: `Before he was punching his way through Korean cinema, Ma Dong-seok (Don Lee) grew up in Columbus, Ohio and worked as a personal trainer — including training actual MMA fighters. He didn't start acting until his mid-thirties.\n\nHis breakout came in Train to Busan (2016) where he played a protective husband who fights zombies with his bare fists. The role was so perfectly cast that audiences forgot he was acting.\n\nThe Roundup franchise then turned him into a one-man box office machine — the series has collectively drawn over 30 million viewers in Korea. Marvel noticed and cast him as Gilgamesh in Eternals. He might be the only actor whose real fighting credentials make his movie fights look toned down.`,
  },
  {
    slug: 'gong-yoo',
    title: 'Gong Yoo almost quit acting before Coffee Prince saved his career — then Train to Busan and Goblin made him a global icon',
    content: `In his early career, Gong Yoo struggled to land meaningful roles and seriously considered quitting the industry entirely. Then Coffee Prince (2007) happened — a gender-bending romantic comedy that became a phenomenon across Asia.\n\nAfter mandatory military service, he returned to star in two back-to-back cultural events in 2016: Train to Busan (the zombie blockbuster) and Goblin (one of the highest-rated K-dramas in cable history). The combination made him one of the most recognized Korean actors on the planet.\n\nHis brief cameo in Squid Game — the mysterious recruiter on the subway — is maybe 5 minutes of screen time, yet it became one of the most discussed scenes of the series. That's star power you can't manufacture.`,
  },
  {
    slug: 'kang-dong-won',
    title: 'Kang Dong-won was so good-looking that directors refused to cast him in serious roles for years',
    content: `This sounds like a joke, but it's a real problem Kang Dong-won faced early in his career. Directors assumed his model-tier visuals meant he couldn't act, so he was stuck in pretty-boy roles. He spent years deliberately choosing darker, grittier films to prove them wrong.\n\nIt worked. By the time he appeared in 1987: When the Day Comes (about Korea's democratization movement), critics had completely revised their assessment. His role in Broker alongside Song Kang-ho at Cannes cemented his position as a top-tier dramatic actor.\n\nHe's also known for being intensely private in an industry obsessed with celebrity — rarely doing variety shows or social media. In Korea, that restraint actually increased his mystique rather than hurting his career.`,
  },
  {
    slug: 'yoo-hae-jin',
    title: 'Yoo Hae-jin is proof that you don\'t need to be the lead to be the most loved person in every movie',
    content: `Korean audiences have a term for actors like Yoo Hae-jin: "scene stealer." Except he doesn't just steal scenes — he steals entire movies. Directors cast him knowing that he'll make every frame he's in more interesting.\n\nHis films have collectively drawn well over 100 million viewers, but he's rarely the #1 billed star. He shows up in megahits like Veteran, A Taxi Driver, and Confidential Assignment as the best friend, the sidekick, the comic relief — and audiences leave the theater talking about him.\n\nIn a film industry obsessed with leading-man visuals, he built a career on pure charm and comedic timing. He's the Korean Paul Giamatti, and that's the highest compliment.`,
  },

  // ── 여자배우 ──
  {
    slug: 'youn-yuh-jung',
    title: 'Youn Yuh-jung\'s Oscar acceptance speech was so funny that the Academy audience gave her a second standing ovation',
    content: `When Youn Yuh-jung won Best Supporting Actress for Minari in 2021, she walked to the podium and said "I don't believe in competition — how can I win over Glenn Close?" The room erupted. She then "forgot" where she put her speech and thanked "all the people in Tulsa, Oklahoma" where the film was partially shot.\n\nShe was 73 years old, had been acting for 50 years, and was the first Korean to ever win an Oscar for acting. But she treated it like she'd just won a raffle at a church fundraiser.\n\nHer career started in 1971 with the provocative Woman of Fire, and she spent decades being Korea's sharpest, most no-nonsense actress. The fact that global recognition took this long says more about Hollywood than about her talent.`,
  },
  {
    slug: 'jeon-do-yeon',
    title: 'Jeon Do-yeon won Best Actress at Cannes in 2007 and Korea celebrated like they\'d won the World Cup',
    content: `When Jeon Do-yeon won the Prix d'interprétation féminine at Cannes for Secret Sunshine, it was the first time any Korean actor had won a major acting award at the festival. Korean media broadcast the ceremony live, and it became front-page news for days.\n\nHer performance — as a mother who moves to her dead husband's hometown and unravels after a devastating loss — required her to portray religious ecstasy, grief, and madness, sometimes in the same scene. Director Lee Chang-dong reportedly did 50+ takes for some scenes.\n\nShe then surprised everyone in 2023 by doing a full-on action film (Kill Boksoon) for Netflix, proving she could kick ass as convincingly as she could cry. Range is an understatement.`,
  },
  {
    slug: 'lee-young-ae',
    title: 'Lee Young-ae\'s Daejanggeum was watched by over 90% of the Korean population and then conquered 91 countries',
    content: `Daejanggeum (Jewel in the Palace) didn't just break Korean TV ratings — it essentially created the Korean Wave as a global cultural export. The 2003 historical drama about a female royal physician was broadcast in 91 countries, from Iran to Zimbabwe to Uzbekistan.\n\nIn the Middle East, the show was so popular that Korean tourists in Turkey and Iran reported strangers recognizing them as "from Janggeum's country." The Korean government literally used the show as a soft power tool.\n\nLee Young-ae then stepped away from the spotlight for nearly a decade to raise her twins, returning only for select projects like Park Chan-wook's Sympathy for Lady Vengeance. In an industry that demands constant visibility, her ability to disappear and return at will is a flex in itself.`,
  },
  {
    slug: 'kim-min-hee',
    title: 'Kim Min-hee went from mainstream Korean star to Berlin Silver Bear winner by doing the opposite of what the industry expected',
    content: `Kim Min-hee was a perfectly successful mainstream Korean actress — hit dramas, cosmetics endorsements, magazine covers. Then she began working exclusively with auteur director Hong Sang-soo, appearing in over a dozen of his minimalist, conversation-driven films.\n\nThe Korean public largely turned on her due to their personal relationship, but international critics were paying attention to the work. In 2017, she won the Silver Bear for Best Actress at Berlin for On the Beach at Night Alone — a film directly referencing her own public controversy.\n\nShe essentially chose artistic credibility over commercial viability, and the gamble paid off at the highest level. Few actors anywhere have made that trade so decisively.`,
  },
  {
    slug: 'jung-ho-yeon',
    title: 'Jung Ho-yeon had zero acting experience before Squid Game and won a SAG Award with her literal first role',
    content: `When Jung Ho-yeon was cast as Kang Sae-byeok in Squid Game, she was a fashion model with exactly zero acting credits. Not "a few small roles" — literally none. Her audition tape impressed Hwang Dong-hyuk enough to take the gamble.\n\nShe then won the Screen Actors Guild Award for Outstanding Female Actor in a Drama Series, beating out established Hollywood actresses. Her Instagram followers went from 400,000 to over 23 million within weeks of the show's release.\n\nTime named her one of the 100 Most Influential People of 2022. She went from walking runways to the global A-list in the span of a single Netflix season. Has any actor in history had a more dramatic debut-to-stardom trajectory?`,
  },
  {
    slug: 'bae-doona',
    title: 'Bae Doona speaks fluent English, Japanese, and Korean and has worked with the Wachowskis, Bong Joon-ho, and Park Chan-wook',
    content: `Most Korean actors who "go Hollywood" do one or two English-language films and come back. Bae Doona built a genuinely trilingual, tri-continental career — seamlessly moving between Korean blockbusters, Hollywood sci-fi, Japanese dramas, and European art films.\n\nHer filmography reads like a film studies curriculum: Sympathy for Mr. Vengeance (Park Chan-wook), The Host (Bong Joon-ho), Cloud Atlas and Sense8 (the Wachowskis), and Kingdom (Netflix). She's worked with more world-class directors than most actors dream of meeting.\n\nThe Wachowskis were so impressed by her in Cloud Atlas that they wrote a main character specifically for her in Sense8. When the directors of The Matrix create a role just for you, you've made it.`,
  },
  {
    slug: 'song-hye-kyo',
    title: 'Song Hye-kyo helped create the Korean Wave in 2000 and is somehow still at the top 25 years later',
    content: `When Autumn in My Heart aired in 2000, it triggered something unprecedented — massive fanbases for Korean dramas across East and Southeast Asia, the Middle East, and beyond. Song Hye-kyo was 19 years old and became the face of an entire cultural movement.\n\nMost early Hallyu stars faded as the industry evolved. Song Hye-kyo didn't. Descendants of the Sun (2016) was a pan-Asian mega-hit, and The Glory (2022) on Netflix proved she could anchor a dark revenge thriller. She adapted to every era of Korean entertainment.\n\n25 years of sustained A-list status in an industry that churns through stars ruthlessly is genuinely rare. She's not just a Hallyu pioneer — she's the rare pioneer who outlasted the movement she helped create.`,
  },
  {
    slug: 'han-so-hee',
    title: 'Han So-hee went from a supporting role in a makjang drama to Netflix\'s go-to Korean action star in two years',
    content: `In 2020, Han So-hee played "the other woman" in The World of the Married — Korea's highest-rated cable drama at the time. It was a classic K-drama supporting role. Then she did something unexpected: instead of chasing more romance roles, she went full action.\n\nMy Name (2021) had her doing actual martial arts sequences with minimal stunt doubles. The Glory (2022) showcased her dramatic range. Netflix noticed the global appeal and she became one of the platform's most visible Korean faces.\n\nHer career strategy — pivoting from commercial K-drama to genre work — mirrors what actors like Jeon Do-yeon did a generation earlier, but compressed into streaming-era speed. She essentially speedran the "respected actress" arc.`,
  },
  {
    slug: 'tang-wei',
    title: 'Tang Wei was banned in China after Lust, Caution, moved to Korea, married a Korean director, and won Cannes',
    content: `After starring in Ang Lee's Lust, Caution (2007), Tang Wei was essentially blacklisted from Chinese entertainment due to the film's explicit content. Rather than wait it out, she learned Korean, moved to South Korea, and rebuilt her career from scratch.\n\nShe married Korean director Kim Tae-yong, and her Korean-language skills improved to the point where Park Chan-wook cast her as the female lead in Decision to Leave (2022). The film won Best Director at Cannes, and her performance — delivered primarily in Korean — was praised as extraordinary.\n\nHer life story reads like a movie itself: banned from one country's film industry, she crossed a sea and conquered another. How many actors have pulled off a career reinvention this dramatic?`,
  },
  {
    slug: 'kim-tae-ri',
    title: 'Kim Tae-ri\'s first film role was opposite Kim Min-hee in a Park Chan-wook movie shown at Cannes — most actors wait decades for that',
    content: `Imagine your very first film being The Handmaiden (2016) — a Park Chan-wook period thriller that screened at Cannes and became a global art-house sensation. That was Kim Tae-ri's debut, and she was cast from an open audition of thousands.\n\nShe then showed range by leading the gentle, nostalgic Little Forest (2018) and the coming-of-age drama Twenty-Five Twenty-One (2022), which became a massive streaming hit. She can do intensity and warmth equally well.\n\nThe Korean industry tends to typecast debut sensations into similar roles. Kim Tae-ri has deliberately avoided that trap, choosing wildly different projects each time. At this rate, she's building the kind of filmography that only gets more interesting with time.`,
  },
  {
    slug: 'bae-suzy',
    title: 'Bae Suzy is the original K-pop to K-drama crossover and Architecture 101 is the reason every idol tries acting now',
    content: `Before Suzy, K-pop idols doing acting was considered a joke — a vanity project that rarely produced good results. Architecture 101 (2012) changed that perception overnight. Her portrayal of a shy college student was so naturalistic that critics had to admit an idol could actually act.\n\nThe film became a surprise hit, and "Suzy's bangs" became a nationwide trend. She followed up with a string of successful dramas (While You Were Sleeping, Vagabond) and became the go-to example whenever a K-pop company wanted to justify debuting their idols as actors.\n\nThe entire current ecosystem of idol-actors — IU, Cha Eun-woo, the growing list — traces its legitimacy back to Suzy proving it was possible. She didn't just cross over; she built the bridge everyone else walks on.`,
  },
  {
    slug: 'park-seo-jun',
    title: 'Park Seo-jun went from K-drama heartthrob to Marvel in 5 years and somehow made both audiences happy',
    content: `Park Seo-jun's rise is a case study in strategic career management. What's Wrong with Secretary Kim (2018) made him a rom-com star. Itaewon Class (2020) proved he could anchor a more serious, socially conscious drama. Both became massive international streaming hits.\n\nThen Marvel called for The Marvels (2023), and the same year he starred in Concrete Utopia — a Korean disaster film that screened at Cannes. He managed to satisfy both the K-drama fanbase and the serious film crowd simultaneously.\n\nIn a Korean industry where actors are often stuck in either "drama pretty boy" or "film actor" lanes, he's one of the few who's comfortably driving in both. The Marvel stamp just made it global.`,
  },
  {
    slug: 'lee-min-ho',
    title: 'Lee Min-ho\'s Boys Over Flowers was so popular in Peru that a local TV channel aired it during prime time and it beat all domestic shows',
    content: `The global reach of Boys Over Flowers (2009) is genuinely difficult to overstate. It wasn't just popular in Asia — it was a phenomenon in Latin America, the Middle East, and Africa. In Peru, it aired during prime time and consistently beat locally produced telenovelas in ratings.\n\nLee Min-ho became one of the first Korean actors whose fame transcended the "Asian market" ceiling. His social media following crosses linguistic and continental boundaries in a way that was essentially impossible before the streaming era.\n\nThe Heirs, Legend of the Blue Sea, and The King: Eternal Monarch kept the momentum going, each one extending his reach further. He's not just a Korean star — he might be the most globally recognized Korean actor among non-cinephile audiences worldwide.`,
  },
];

async function main() {
  // Get admin user
  const { data: admin } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'ADMIN')
    .limit(1)
    .single();

  if (!admin) {
    console.error('❌ No admin user found');
    return;
  }
  console.log(`\n🎬 Creating threads for ${threads.length} persons (author: ${admin.id})\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const thread of threads) {
    // Get person_id by slug
    const { data: person } = await supabase
      .from('persons')
      .select('id, name_en')
      .eq('slug', thread.slug)
      .single();

    if (!person) {
      console.log(`❌ FAIL: ${thread.slug} — person not found`);
      failed++;
      continue;
    }

    // Check if person already has a thread
    const { data: existing } = await supabase
      .from('threads')
      .select('id')
      .eq('person_id', person.id)
      .eq('is_deleted', false)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⏭️  SKIP: ${person.name_en} — already has thread`);
      skipped++;
      continue;
    }

    // Create thread
    const { error } = await supabase.from('threads').insert({
      person_id: person.id,
      author_id: admin.id,
      title: thread.title,
      content: thread.content,
    });

    if (error) {
      console.log(`❌ FAIL: ${person.name_en} — ${error.message}`);
      failed++;
      continue;
    }

    console.log(`✅ OK: ${person.name_en}`);
    success++;
  }

  console.log(`\n── Results ──`);
  console.log(`✅ Created: ${success}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`Total:     ${threads.length}\n`);
}

main().catch(console.error);
