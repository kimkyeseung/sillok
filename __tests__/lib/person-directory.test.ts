import { describe, it, expect } from 'vitest';
import {
  HUBS,
  HUB_MIN_FIGURES,
  findHub,
  groupByInitial,
  hubCounts,
  hubDescription,
  hubFigures,
  hubPath,
  isHubIndexable,
  latestUpdate,
  lifespan,
  sortChronological,
  type DirectoryPerson,
} from '@/lib/person-directory';
import { BOARDS } from '@/lib/feed';
import { figureHubJsonLd } from '@/lib/jsonld';

const person = (over: Partial<DirectoryPerson> & { slug: string }): DirectoryPerson => ({
  id: over.slug,
  name_en: over.slug,
  name_ko: over.slug,
  name_hanja: null,
  birth_year: null,
  death_year: null,
  thumbnail: null,
  updated_at: null,
  eras: [],
  fields: [],
  ...over,
});

const sejong = person({ slug: 'sejong', name_en: 'Sejong the Great', birth_year: 1397, death_year: 1450, eras: ['joseon'], fields: ['king'], updated_at: '2026-09-25T00:00:00Z' });
const yi = person({ slug: 'yi-sun-sin', name_en: 'Yi Sun-sin', birth_year: 1545, death_year: 1598, eras: ['joseon'], fields: ['general'], updated_at: '2026-11-01T00:00:00Z' });
const wang = person({ slug: 'wang-geon', name_en: 'Taejo of Goryeo', birth_year: 877, death_year: 943, eras: ['goryeo'], fields: ['king'] });
const dangun = person({ slug: 'dangun', name_en: 'Dangun', eras: ['ancient'], fields: ['king'] });
const all = [yi, dangun, sejong, wang];

describe('hubs', () => {
  it('has an era hub for every board, with the same slug', () => {
    BOARDS.forEach((b) => expect(findHub('era', b.slug)).not.toBeNull());
  });

  it('has unique paths', () => {
    const paths = HUBS.map(hubPath);
    expect(new Set(paths).size).toBe(paths.length);
    expect(hubPath({ kind: 'field', slug: 'scholar' })).toBe('/persons/field/scholar');
  });

  it('does not resolve a slug under the wrong kind or an unknown slug', () => {
    expect(findHub('field', 'joseon')).toBeNull();
    expect(findHub('era', 'king')).toBeNull();
    expect(findHub('era', 'atlantis')).toBeNull();
  });
});

describe('hubFigures', () => {
  it('filters by era tag, oldest first', () => {
    expect(hubFigures(all, { kind: 'era', slug: 'joseon' }).map((p) => p.slug)).toEqual(['sejong', 'yi-sun-sin']);
  });

  it('filters by field tag across eras; undated figures last', () => {
    expect(hubFigures(all, { kind: 'field', slug: 'king' }).map((p) => p.slug)).toEqual(['wang-geon', 'sejong', 'dangun']);
  });

  it('counts figures per hub path', () => {
    const counts = hubCounts(all);
    expect(counts.get('/persons/era/joseon')).toBe(2);
    expect(counts.get('/persons/field/king')).toBe(3);
    expect(counts.get('/persons/era/modern')).toBe(0);
  });
});

describe('sortChronological', () => {
  it('falls back to the death year, then sorts ties by name', () => {
    const a = person({ slug: 'a', name_en: 'B', death_year: 100 });
    const b = person({ slug: 'b', name_en: 'A', birth_year: 100 });
    const c = person({ slug: 'c', name_en: 'C', birth_year: -37 });
    expect(sortChronological([a, b, c]).map((p) => p.slug)).toEqual(['c', 'b', 'a']);
  });
});

describe('isHubIndexable', () => {
  it('requires the minimum number of figures', () => {
    expect(isHubIndexable(HUB_MIN_FIGURES - 1)).toBe(false);
    expect(isHubIndexable(HUB_MIN_FIGURES)).toBe(true);
  });
});

describe('latestUpdate', () => {
  it('returns the newest updated_at, ignoring missing values', () => {
    expect(latestUpdate(all)).toBe('2026-11-01T00:00:00Z');
    expect(latestUpdate([dangun])).toBeNull();
    expect(latestUpdate([])).toBeNull();
  });
});

describe('groupByInitial', () => {
  it('groups by first letter in A–Z order with names sorted inside', () => {
    const groups = groupByInitial([...all, person({ slug: 'seo', name_en: 'Seo Hui' })]);
    expect(groups.map((g) => g.letter)).toEqual(['D', 'S', 'T', 'Y']);
    expect(groups[1].persons.map((p) => p.name_en)).toEqual(['Sejong the Great', 'Seo Hui']);
  });

  it('puts names that do not start with a letter under # at the end', () => {
    const groups = groupByInitial([person({ slug: 'x', name_en: '2NE1' }), sejong]);
    expect(groups.map((g) => g.letter)).toEqual(['S', '#']);
  });
});

describe('lifespan', () => {
  it('formats the known years', () => {
    expect(lifespan(sejong)).toBe('1397 – 1450');
    expect(lifespan({ birth_year: 1990, death_year: null })).toBe('b. 1990');
    expect(lifespan({ birth_year: null, death_year: 660 })).toBe('d. 660');
    expect(lifespan({ birth_year: -58, death_year: -19 })).toBe('58 BCE – 19 BCE');
    expect(lifespan(dangun)).toBe('');
  });
});

describe('hubDescription', () => {
  const hub = findHub('era', 'joseon')!;

  it('adds the count and the first names', () => {
    expect(hubDescription(hub, [sejong, yi])).toBe(`${hub.intro} 2 figures, including Sejong the Great, Yi Sun-sin.`);
  });

  it('says "and more" past three names', () => {
    expect(hubDescription(hub, [sejong, yi, wang, dangun])).toContain('4 figures, including Sejong the Great, Yi Sun-sin, Taejo of Goryeo and more.');
  });

  it('is just the intro for an empty hub', () => {
    expect(hubDescription(hub, [])).toBe(hub.intro);
  });
});

describe('figureHubJsonLd', () => {
  it('lists the figures as an ItemList on a CollectionPage', () => {
    const result = figureHubJsonLd({ name: 'Figures of the Joseon Dynasty', description: 'd', path: '/persons/era/joseon', figures: [sejong, yi] });
    expect(result['@type']).toBe('CollectionPage');
    expect(result.url).toBe('https://sillok.kr/persons/era/joseon');
    expect(result.mainEntity.numberOfItems).toBe(2);
    expect(result.mainEntity.itemListElement[1]).toEqual({
      '@type': 'ListItem',
      position: 2,
      url: 'https://sillok.kr/persons/yi-sun-sin',
      name: 'Yi Sun-sin',
    });
  });
});
