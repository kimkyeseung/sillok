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

const body = `From Sui dynasty emperors who lost armies at the gates of Goguryeo to Cold War generals who redrew the map of the peninsula — 20 foreign figures who shaped Korean history are now on Sillok.

These are the outsiders who invaded, allied, colonized, liberated, divided, and documented Korea across 1,400 years. Some are heroes. Some are villains. All of them left marks that Koreans still live with today.

## Ancient: The Empires That Broke Against Goguryeo

- **Emperor Yang of Sui** (569-618) — Launched three invasions of Goguryeo with over a million troops. Lost so catastrophically at the Battle of Salsu that it helped topple his entire dynasty.
- **Emperor Taizong of Tang** (598-649) — China's greatest emperor personally led 100,000 troops against Goguryeo in 645. The defenders of Ansi Fortress held him off for 88 days. He reportedly wept at his failure.

Two of China's mightiest rulers threw everything they had at Goguryeo — and both walked away humiliated.

## Medieval: Mongol Domination and Ming Legitimacy

- **Kublai Khan** (1215-1294) — Subjugated Goryeo after 40 years of resistance, then used Korea as a launchpad for two failed invasions of Japan. Married his daughter to the Goryeo king, beginning a century of Mongol dominance over Korean politics.
- **Hongwu Emperor** (1328-1398) — Founded the Ming dynasty and gave the new Joseon dynasty its name. The tributary relationship he established defined Korean-Chinese relations for the next 500 years.

## Early Modern: Diplomats, Admirals, and the End of Isolation

- **Tokugawa Ieyasu** (1543-1616) — After the devastation of the Imjin War, he initiated the Joseon Tongsinsa diplomatic missions that kept peace between Korea and Japan for over 200 years.
- **So Yoshitoshi** (1568-1615) — The daimyo of Tsushima who reluctantly joined Hideyoshi's invasion of Korea, then spent the rest of his life repairing the damage. His island depended entirely on Korean trade.
- **Admiral Roze** (1812-1883) — Led a French punitive expedition against Joseon in 1866, attacking Ganghwa Island and looting the royal library. The stolen texts were only partially returned in 2011 — 145 years later.
- **Robert Shufeldt** (1822-1895) — Negotiated the 1882 Jemulpo Treaty, Korea's first treaty with a Western nation. With one signature, the "Hermit Kingdom" was open to the modern world.
- **Bishop Berneux** (1814-1866) — French bishop beheaded during the Byeongin Persecution. Now one of the 103 Korean Martyrs canonized by Pope John Paul II — a Catholic saint who died on Korean soil.

## Colonial Era: Occupiers, Witnesses, and Pioneers

### Those Who Ruled

- **Saito Makoto** (1858-1936) — Introduced "cultural rule" after the March 1st Movement, relaxing press restrictions just enough to look progressive while keeping colonial control firmly in place.
- **Minami Jiro** (1874-1955) — The governor-general who tried to erase Korean identity entirely: forced Japanese names, banned the Korean language in schools, mandated Shinto worship.

### Those Who Fought Back (From Outside)

- **Frederick McKenzie** (1869-1931) — Canadian journalist whose books *The Tragedy of Korea* and *Korea's Fight for Freedom* exposed Japanese atrocities to the Western world when no one else was paying attention.
- **Frank Schofield** (1889-1970) — Documented the March 1st Movement and the Jeamni massacre. Called the "34th national representative" of Korean independence. The only foreigner buried in the Korean National Cemetery.
- **Mary Scranton** (1832-1909) — Founded Ewha Hakdang in 1886 with one student. It became Ewha Womans University, now the largest women's university in the world.

## Korean War: The Generals Who Split a Nation

- **Douglas MacArthur** (1880-1964) — His Incheon Landing was one of the most audacious military operations in modern history. His push to expand the war into China got him fired by Truman.
- **Mao Zedong** (1893-1976) — Sent 300,000 troops into Korea in October 1950, ensuring the peninsula would stay divided. His own son was killed in the war.
- **Peng Dehuai** (1898-1974) — Commanded the Chinese forces that pushed the UN back from the Yalu River to below Seoul. The Battle of Chosin Reservoir remains one of the most studied engagements in military history.
- **Matthew Ridgway** (1895-1993) — Replaced MacArthur, revitalized a demoralized army, and recaptured Seoul. His methodical "meat grinder" strategy led to the armistice.
- **John Hodge** (1893-1963) — Military governor of southern Korea from 1945 to 1948. His decision to retain Japanese colonial administrators shaped — and haunted — the political foundations of South Korea.

## And One More

- **Francesca Donner** (1900-1992) — Austrian-born First Lady of South Korea. Met Syngman Rhee in Geneva in 1933 and devoted the rest of her life to Korea, staying even after his exile and death.

---

## By the Numbers

| Category | Count |
|----------|-------|
| Ancient (Sui/Tang) | 2 |
| Medieval (Mongol/Ming) | 2 |
| Early Modern (Joseon-era) | 5 |
| Colonial Era | 5 |
| Korean War | 5 |
| Other | 1 |
| **Total** | **20** |

Emperors: 4. Generals: 6. Missionaries & journalists: 4. Colonial governors: 2. One First Lady.

Spanning 1,400 years — from 569 AD to 1993 AD.

---

## What's Next

Every new figure comes with a full English biography and an opening discussion thread. Head to the [Figures](/persons) page to explore them all.

We're continuing to expand Sillok's global coverage — more figures from Japan, China, and the Western world who intersected with Korean history are on the way. If there's someone you think should be on Sillok, let us know.`;

async function main() {
  const { data, error } = await sb.from('articles').insert({
    slug: 'foreign-figures-who-shaped-korean-history',
    title: 'Foreign Figures Who Shaped Korean History Join Sillok',
    body,
    summary: "From Sui dynasty emperors who broke against Goguryeo to Cold War generals who split the peninsula — 20 foreign figures spanning 1,400 years of Korean history are now on Sillok.",
    tag: '기획',
    is_notice: false,
    is_published: true,
    author_id: 'e9517e9f-511d-4b0d-a8e9-ff22a3346758',
  }).select().single();

  if (error) {
    console.error('INSERT ERROR:', error.message);
  } else {
    console.log('Article published!');
    console.log('   Slug:', data.slug);
    console.log('   Title:', data.title);
    console.log('   URL: https://sillok.kr/articles/' + data.slug);
  }
}

main().catch(console.error);
