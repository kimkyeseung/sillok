import { readFileSync } from 'fs';
import { resolve } from 'path';

for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > -1 && !process.env[t.slice(0, i).trim()])
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const body = `Sillok just added 30 of the most influential figures in Korean cinema and K-drama history. Directors who won at Cannes, Venice, and Berlin. Actors who broke into Hollywood. And the stars who built the Korean Wave from a regional trend into a global cultural force.

## The Directors

Seven filmmakers who put Korean cinema on the world map:

- **Kim Ki-duk** (1960–2020) — Self-taught painter-turned-director. Golden Lion at Venice for Pieta.
- **Lee Chang-dong** — Novelist, then filmmaker, then Korea's Minister of Culture. Cannes Best Screenplay for Poetry.
- **Hong Sang-soo** — Over 30 films, most featuring soju and conversation. Two Silver Bears at Berlin.
- **Hwang Dong-hyuk** — Pitched Squid Game for 10 years before Netflix said yes. First Asian to win an Emmy for directing.
- **Na Hong-jin** — Only 3 films in 16 years. All three are considered masterpieces (The Chaser, The Yellow Sea, The Wailing).
- **Yeon Sang-ho** — From indie animation to Train to Busan, the zombie blockbuster that broke Korean box office records.

Park Chan-wook, Bong Joon-ho, and other directors were already on Sillok.

## The Actors

### Award Winners and Hollywood Crossovers

- **Youn Yuh-jung** — First Korean to win an Oscar for acting (Minari, 2021). Five decades of career.
- **Jeon Do-yeon** — First Korean to win Best Actress at Cannes (Secret Sunshine, 2007).
- **Choi Min-sik** — The man who ate live octopus for Oldboy and played Admiral Yi Sun-sin in Korea's highest-grossing film.
- **Kim Min-hee** — Silver Bear for Best Actress at Berlin. Became Hong Sang-soo's muse across a dozen films.
- **Lee Jung-jae** — Squid Game made him a global star. First Asian to win an Emmy for Lead Actor in a Drama.
- **Ma Dong-seok** — Grew up in Ohio, trained UFC fighters, then became Korea's biggest action star and joined Marvel's Eternals.
- **Bae Doona** — Trilingual actress who worked with the Wachowskis, Bong Joon-ho, and Park Chan-wook.

### Hallyu Icons

- **Song Hye-kyo** — From Autumn in My Heart (2000) to The Glory (2022), she's outlasted the entire Korean Wave era she helped create.
- **Lee Young-ae** — Daejanggeum was broadcast in 91 countries and essentially invented K-drama as a global export.
- **Lee Min-ho** — Boys Over Flowers was so popular in Peru it beat local telenovelas in prime-time ratings.
- **Gong Yoo** — Train to Busan and Goblin in the same year made him one of the most recognized Korean actors on Earth.
- **Park Seo-jun** — Itaewon Class, Marvel's The Marvels, and Concrete Utopia at Cannes — all within five years.
- **Bae Suzy** — The original K-pop to K-drama crossover. Architecture 101 proved idols could actually act.

### Rising Generation

- **Jung Ho-yeon** — Zero acting experience before Squid Game. Won a SAG Award with her literal first role.
- **Han So-hee** — Went from makjang drama support to Netflix's go-to Korean action star in two years.
- **Kim Tae-ri** — Debuted in Park Chan-wook's The Handmaiden at Cannes, then led the hit drama Twenty-Five Twenty-One.
- **Tang Wei** — Banned in China after Lust, Caution, moved to Korea, and starred in Park Chan-wook's Cannes-winning Decision to Leave.

### Box Office Kings

- **Song Kang-ho** — Already on Sillok. First Korean actor to win Best Actor at Cannes.
- **Lee Byung-hun** — Already on Sillok. Korea's biggest Hollywood crossover star.
- **Ha Jung-woo** — Combined filmography: over 100 million tickets sold in a country of 52 million.
- **Hwang Jung-min** — Four-time Blue Dragon Best Actor winner. Korea's most versatile leading man.
- **Kang Dong-won** — So good-looking that directors initially refused to cast him in serious roles. He proved them all wrong.
- **Yoo Hae-jin** — Korea's ultimate scene-stealer. Never the lead, always the one you remember.

## By the Numbers

| Category | Count |
|----------|-------|
| Directors | 7 (6 new + Park Chan-wook already on Sillok) |
| Male Actors | 11 (8 new + 3 already on Sillok) |
| Female Actors | 12 (all new) |
| **Total** | **30** |

Oscar winners: 1 (Youn Yuh-jung). Cannes winners: 4. Emmy winners: 2. Marvel actors: 2. Combined box office: billions.

---

## What's Next

Every new figure comes with a full English biography, career timeline, and an opening discussion thread. Head to the [Figures](/persons) page to explore them all.

We're continuing to expand Sillok's coverage of modern Korean culture — musicians, athletes, and more contemporary figures are coming soon. If there's someone you think should be on Sillok, hit the "Request a Figure" button on any person page.`;

async function main() {
  const { data, error } = await sb.from('articles').insert({
    slug: '30-icons-of-korean-cinema-join-sillok',
    title: '30 Icons of Korean Cinema and K-Drama Join Sillok',
    body,
    summary: "From Oscar-winner Youn Yuh-jung to Squid Game creator Hwang Dong-hyuk — 30 directors and actors who shaped Korean film and drama are now on Sillok.",
    tag: '공지',
    is_notice: true,
    is_published: true,
    author_id: 'e9517e9f-511d-4b0d-a8e9-ff22a3346758',
  }).select().single();

  if (error) {
    console.error('❌ INSERT ERROR:', error.message);
  } else {
    console.log('✅ Article published!');
    console.log('   Slug:', data.slug);
    console.log('   Title:', data.title);
    console.log('   URL: https://sillok.kr/articles/' + data.slug);
  }
}

main().catch(console.error);
