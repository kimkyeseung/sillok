/**
 * Figure directory: era / field hub pages (/persons/era/joseon, /persons/field/scholar)
 * and the A–Z index on /persons. Pure logic — the loader is person-directory-data.ts.
 *
 * Hubs give every figure a crawlable path from /persons (the grid there only shows
 * the newest few) and a landing page per era and field.
 */

export type HubKind = 'era' | 'field';

export interface Hub {
  kind: HubKind;
  /** tags.name_en and the URL segment */
  slug: string;
  /** Short label for chips and breadcrumbs */
  label: string;
  /** Page heading and title */
  heading: string;
  /** One sentence shown under the heading and used as the meta description stem */
  intro: string;
}

export interface DirectoryPerson {
  id: string;
  slug: string;
  name_en: string;
  name_ko: string;
  name_hanja: string | null;
  birth_year: number | null;
  death_year: number | null;
  thumbnail: string | null;
  updated_at: string | null;
  /** tags.name_en by type */
  eras: string[];
  fields: string[];
}

/** Below this a hub is a thin page: noindex and left out of the sitemap */
export const HUB_MIN_FIGURES = 5;

export const ERA_HUBS: Hub[] = [
  {
    kind: 'era',
    slug: 'ancient',
    label: 'Ancient Korea',
    heading: 'Figures of Ancient Korea',
    intro: 'Founders and rulers of Gojoseon and the early states, before the Three Kingdoms.',
  },
  {
    kind: 'era',
    slug: 'three-kingdoms',
    label: 'Three Kingdoms',
    heading: 'Figures of the Three Kingdoms',
    intro: 'Kings, generals and monks of Goguryeo, Baekje, Silla and Gaya (57 BCE – 668 CE).',
  },
  {
    kind: 'era',
    slug: 'unified-silla',
    label: 'Unified Silla',
    heading: 'Figures of Unified Silla',
    intro: 'People of Unified Silla and Balhae, the North–South States period (668 – 935).',
  },
  {
    kind: 'era',
    slug: 'goryeo',
    label: 'Goryeo',
    heading: 'Figures of the Goryeo Dynasty',
    intro: 'Kings, generals, monks and officials of the Goryeo dynasty (918 – 1392).',
  },
  {
    kind: 'era',
    slug: 'joseon',
    label: 'Joseon',
    heading: 'Figures of the Joseon Dynasty',
    intro: 'Kings, queens, scholars, generals and artists of the Joseon dynasty (1392 – 1897).',
  },
  {
    kind: 'era',
    slug: 'modern',
    label: 'Modern Korea',
    heading: 'Figures of Modern Korea',
    intro: 'People who shaped Korea from the Korean Empire to today (1897 – present).',
  },
];

export const FIELD_HUBS: Hub[] = [
  {
    kind: 'field',
    slug: 'king',
    label: 'Royalty',
    heading: 'Korean Kings, Queens and Royalty',
    intro: 'Monarchs, queens, consorts, princes and princesses across the Korean dynasties.',
  },
  {
    kind: 'field',
    slug: 'general',
    label: 'Generals',
    heading: 'Korean Generals and Military Leaders',
    intro: 'Commanders and admirals who fought the wars of Korean history.',
  },
  {
    kind: 'field',
    slug: 'scholar',
    label: 'Scholars',
    heading: 'Korean Scholars and Thinkers',
    intro: 'Confucian scholars, scientists, inventors and writers of Korea.',
  },
  {
    kind: 'field',
    slug: 'artist',
    label: 'Artists',
    heading: 'Korean Artists',
    intro: 'Painters, calligraphers, poets and musicians of Korea.',
  },
  {
    kind: 'field',
    slug: 'politician',
    label: 'Politicians',
    heading: 'Korean Politicians and Officials',
    intro: 'Ministers, reformers and political leaders of Korea, past and present.',
  },
  {
    kind: 'field',
    slug: 'independence-activist',
    label: 'Independence Activists',
    heading: 'Korean Independence Activists',
    intro: 'People who resisted colonial rule and fought for Korean independence.',
  },
  {
    kind: 'field',
    slug: 'religious',
    label: 'Religious Leaders',
    heading: 'Korean Religious Leaders',
    intro: 'Buddhist monks, priests and founders of religious movements in Korea.',
  },
  {
    kind: 'field',
    slug: 'entertainer',
    label: 'Culture & Entertainment',
    heading: 'Korean Culture and Entertainment Figures',
    intro: 'Actors, musicians, directors and other figures of Korean popular culture.',
  },
  {
    kind: 'field',
    slug: 'entrepreneur',
    label: 'Entrepreneurs',
    heading: 'Korean Entrepreneurs',
    intro: 'Founders and business leaders of Korea.',
  },
];

export const HUBS: Hub[] = [...ERA_HUBS, ...FIELD_HUBS];

export const hubPath = (hub: Pick<Hub, 'kind' | 'slug'>) => `/persons/${hub.kind}/${hub.slug}`;

export const findHub = (kind: HubKind, slug: string) =>
  HUBS.find((h) => h.kind === kind && h.slug === slug) ?? null;

const inHub = (person: DirectoryPerson, hub: Pick<Hub, 'kind' | 'slug'>) =>
  (hub.kind === 'era' ? person.eras : person.fields).includes(hub.slug);

/** Oldest first; figures without a birth year go last, then by name */
export function sortChronological<T extends Pick<DirectoryPerson, 'birth_year' | 'death_year' | 'name_en'>>(
  persons: T[]
): T[] {
  const year = (p: T) => p.birth_year ?? p.death_year ?? Number.POSITIVE_INFINITY;
  return [...persons].sort((a, b) => year(a) - year(b) || a.name_en.localeCompare(b.name_en));
}

export function hubFigures(persons: DirectoryPerson[], hub: Pick<Hub, 'kind' | 'slug'>): DirectoryPerson[] {
  return sortChronological(persons.filter((p) => inHub(p, hub)));
}

/** Figure count per hub path */
export function hubCounts(persons: DirectoryPerson[]): Map<string, number> {
  return new Map(HUBS.map((hub) => [hubPath(hub), persons.filter((p) => inHub(p, hub)).length]));
}

export const isHubIndexable = (count: number) => count >= HUB_MIN_FIGURES;

/** Newest updated_at among the figures (sitemap lastmod); null when unknown */
export function latestUpdate(persons: Pick<DirectoryPerson, 'updated_at'>[]): string | null {
  return persons.reduce<string | null>(
    (latest, p) => (p.updated_at && (!latest || p.updated_at > latest) ? p.updated_at : latest),
    null
  );
}

/** A–Z index: figures grouped by the first letter of their English name ('#' for the rest) */
export function groupByInitial<T extends Pick<DirectoryPerson, 'name_en'>>(
  persons: T[]
): { letter: string; persons: T[] }[] {
  const groups = new Map<string, T[]>();
  [...persons]
    .sort((a, b) => a.name_en.localeCompare(b.name_en))
    .forEach((p) => {
      const first = p.name_en.trim().charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(first) ? first : '#';
      groups.set(letter, [...(groups.get(letter) ?? []), p]);
    });
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
    .map(([letter, list]) => ({ letter, persons: list }));
}

/** "1397 – 1450", "b. 1990", "d. 1450" or '' */
export function lifespan(p: Pick<DirectoryPerson, 'birth_year' | 'death_year'>): string {
  const year = (y: number) => (y < 0 ? `${-y} BCE` : String(y));
  if (p.birth_year != null && p.death_year != null) return `${year(p.birth_year)} – ${year(p.death_year)}`;
  if (p.birth_year != null) return `b. ${year(p.birth_year)}`;
  if (p.death_year != null) return `d. ${year(p.death_year)}`;
  return '';
}

/** Meta description: the intro plus how many figures and a few names */
export function hubDescription(hub: Hub, figures: Pick<DirectoryPerson, 'name_en'>[]): string {
  if (figures.length === 0) return hub.intro;
  const names = figures.slice(0, 3).map((p) => p.name_en);
  const more = figures.length > names.length ? ' and more' : '';
  return `${hub.intro} ${figures.length} ${figures.length === 1 ? 'figure' : 'figures'}, including ${names.join(', ')}${more}.`;
}
