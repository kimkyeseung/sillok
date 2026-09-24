import { describe, it, expect } from 'vitest';
import { eventJsonLd, personBreadcrumbJsonLd, personJsonLd, breadcrumbJsonLd, communityPageJsonLd, discussionJsonLd } from '@/lib/jsonld';

describe('eventJsonLd', () => {
  it('should generate valid Article schema for historical events', () => {
    const result = eventJsonLd({
      title: 'Imjin War',
      slug: 'imjin-war',
      start_year: 1592,
      description: 'Japan invades Korea.',
    });

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Article');
    expect(result.headline).toBe('Imjin War');
    expect(result.temporalCoverage).toBe('1592');
    expect(result.url).toContain('/nodes/imjin-war');
    expect(result.description).toBe('Japan invades Korea.');
    expect(result.image).toContain('og-default.png');
    expect(result.publisher.name).toBe('Sillok');
  });

  it('should show year range when end_year differs', () => {
    const result = eventJsonLd({
      title: 'Imjin War',
      slug: 'imjin-war',
      start_year: 1592,
      end_year: 1598,
    });

    expect(result.temporalCoverage).toBe('1592–1598');
  });

  it('should include alternateName when title_ko is provided', () => {
    const result = eventJsonLd({
      title: 'Imjin War',
      title_ko: '임진왜란',
      slug: 'imjin-war',
    });

    expect(result.alternateName).toBe('임진왜란');
  });

  it('should omit alternateName when title_ko is not provided', () => {
    const result = eventJsonLd({
      title: 'Imjin War',
      slug: 'imjin-war',
    });

    expect(result).not.toHaveProperty('alternateName');
  });

  it('should include about when persons are provided', () => {
    const result = eventJsonLd({
      title: 'Imjin War',
      slug: 'imjin-war',
      persons: [
        { name_en: 'Yi Sun-sin', slug: 'yi-sun-sin' },
        { name_en: 'Toyotomi Hideyoshi', slug: 'toyotomi' },
      ],
    });

    expect(result.about).toHaveLength(2);
    expect(result.about![0].name).toBe('Yi Sun-sin');
    expect(result.about![0]['@type']).toBe('Person');
    expect(result.about![0].url).toContain('/persons/yi-sun-sin');
  });

  it('should omit about when persons is empty', () => {
    const result = eventJsonLd({
      title: 'Test',
      slug: 'test',
      persons: [],
    });

    expect(result).not.toHaveProperty('about');
  });

  it('should truncate description to 300 chars', () => {
    const longDesc = 'A'.repeat(500);
    const result = eventJsonLd({
      title: 'Test',
      slug: 'test',
      description: longDesc,
    });

    expect(result.description).toHaveLength(300);
  });
});

describe('personJsonLd', () => {
  it('should use summary as description (truncated to 300 chars)', () => {
    const result = personJsonLd({
      name_en: 'Sejong the Great',
      slug: 'sejong-daewang',
      summary: 'B'.repeat(500),
    });

    expect(result.description).toHaveLength(300);
  });

  it('should generate valid Person schema', () => {
    const result = personJsonLd({
      name_en: 'Sejong the Great',
      slug: 'sejong-daewang',
      birth_year: 1397,
      death_year: 1450,
    });

    expect(result['@type']).toBe('Person');
    expect(result.name).toBe('Sejong the Great');
    expect(result.birthDate).toBe('1397');
    expect(result.deathDate).toBe('1450');
    expect(result.url).toContain('/persons/sejong-daewang');
  });

  it('should include Korean and Hanja names as alternateName', () => {
    const result = personJsonLd({
      name_en: 'Sejong the Great',
      name_ko: '세종대왕',
      name_hanja: '世宗大王',
      slug: 'sejong-daewang',
    });

    expect(result.alternateName).toEqual(['세종대왕', '世宗大王']);
  });

  it('should omit optional fields when null', () => {
    const result = personJsonLd({
      name_en: 'Test',
      slug: 'test',
    });

    expect(result).not.toHaveProperty('alternateName');
    expect(result).not.toHaveProperty('image');
    expect(result).not.toHaveProperty('birthDate');
    expect(result).not.toHaveProperty('deathDate');
  });
});

describe('personJsonLd extras', () => {
  it('adds sameAs, birthPlace and family links', () => {
    const result = personJsonLd(
      { name_en: 'Sejong the Great', slug: 'sejong-daewang', birth_place: 'Hanseong-bu' },
      {
        sameAs: ['https://en.wikipedia.org/wiki/Sejong_the_Great'],
        parents: [{ name: 'Taejong of Joseon', slug: 'taejong-yi-bang-won' }],
        children: [{ name: 'Munjong of Joseon', slug: 'munjong-yi-hyang' }],
      }
    ) as Record<string, unknown>;

    expect(result.sameAs).toEqual(['https://en.wikipedia.org/wiki/Sejong_the_Great']);
    expect(result.birthPlace).toEqual({ '@type': 'Place', name: 'Hanseong-bu' });
    expect(result.parent).toEqual([
      { '@type': 'Person', name: 'Taejong of Joseon', url: 'https://sillok.kr/persons/taejong-yi-bang-won' },
    ]);
    expect(result.children).toHaveLength(1);
    expect(result).not.toHaveProperty('spouse');
  });
});

describe('personBreadcrumbJsonLd', () => {
  it('builds Home › Figures › Person › Tab', () => {
    const result = personBreadcrumbJsonLd(
      { name_en: 'Sejong the Great', slug: 'sejong-daewang' },
      { label: 'Legacy', segment: 'legacy' }
    );
    expect(result.itemListElement.map((i) => i.name)).toEqual(['Home', 'Figures', 'Sejong the Great', 'Legacy']);
    expect(result.itemListElement[3].item).toBe('https://sillok.kr/persons/sejong-daewang/legacy');
    expect(result.itemListElement[3].position).toBe(4);
  });

  it('stops at the person on the overview', () => {
    expect(personBreadcrumbJsonLd({ name_en: 'X', slug: 'x' }).itemListElement).toHaveLength(3);
  });
});

describe('discussionJsonLd', () => {
  const thread = {
    id: 't1',
    title: 'Was Sejong a linguist?',
    content: 'Discuss.',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    author: null,
    like_count: 3,
    reply_count: 3,
    figures: [{ name: 'Sejong the Great', slug: 'sejong-daewang' }],
  };
  const reply = (id: string, parent_id: string | null) => ({
    id, parent_id, content: id, created_at: '2026-09-02T00:00:00Z', like_count: 0, author: 'kim',
  });

  it('describes the post with author, stats and subject figures', () => {
    const ld = discussionJsonLd(thread);
    expect(ld['@type']).toBe('DiscussionForumPosting');
    expect(ld.url).toBe('https://sillok.kr/threads/t1');
    expect(ld.author).toEqual({ '@type': 'Person', name: 'Anonymous' });
    expect(ld).not.toHaveProperty('dateModified');
    expect(ld.about).toEqual([{ '@type': 'Person', name: 'Sejong the Great', url: 'https://sillok.kr/persons/sejong-daewang' }]);
    expect(ld).not.toHaveProperty('comment');
  });

  it('nests replies under their parents and lifts orphans to the post', () => {
    const ld = discussionJsonLd(thread, [reply('a', null), reply('a1', 'a'), reply('o', 'gone')]) as Record<string, any>;
    expect(ld.comment.map((c: any) => c.text)).toEqual(['a', 'o']);
    expect(ld.comment[0].comment[0].text).toBe('a1');
    expect(ld.comment[0].url).toBe('https://sillok.kr/threads/t1#reply-a');
  });
});

describe('community page JSON-LD', () => {
  it('lists the threads shown and builds breadcrumbs from paths', () => {
    const ld = communityPageJsonLd({ name: 'Joseon', description: 'd', path: '/b/joseon', threads: [{ id: 'x', title: 'X' }] });
    expect(ld.url).toBe('https://sillok.kr/b/joseon');
    expect(ld.mainEntity.itemListElement[0]).toEqual({ '@type': 'ListItem', position: 1, url: 'https://sillok.kr/threads/x', name: 'X' });
    const bc = breadcrumbJsonLd([{ name: 'Home', path: '' }, { name: 'Joseon', path: '/b/joseon' }]);
    expect(bc.itemListElement.map((i) => i.item)).toEqual(['https://sillok.kr', 'https://sillok.kr/b/joseon']);
  });
});
