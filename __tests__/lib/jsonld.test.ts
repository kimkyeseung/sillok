import { describe, it, expect } from 'vitest';
import { eventJsonLd, personBreadcrumbJsonLd, personJsonLd, breadcrumbJsonLd, communityPageJsonLd, discussionJsonLd, historicalDate, personSameAs, dynastyListJsonLd } from '@/lib/jsonld';

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

describe('discussionJsonLd image caption', () => {
  it('uses an ImageObject when the image has a description', () => {
    const ld = discussionJsonLd({
      id: 't1', title: 'T', content: 'C', created_at: '2026-09-29T00:00:00Z', author: 'a',
      like_count: 0, reply_count: 0, image: 'https://x/meme.png', imageCaption: 'line 1\nline 2',
    }) as Record<string, any>;
    expect(ld.image).toEqual({ '@type': 'ImageObject', contentUrl: 'https://x/meme.png', url: 'https://x/meme.png', caption: 'line 1\nline 2' });
  });

  it('keeps a plain image URL without a caption', () => {
    const ld = discussionJsonLd({
      id: 't1', title: 'T', content: 'C', created_at: '2026-09-29T00:00:00Z', author: 'a',
      like_count: 0, reply_count: 0, image: 'https://x/p.jpg',
    }) as Record<string, any>;
    expect(ld.image).toBe('https://x/p.jpg');
  });
});

describe('personJsonLd — entity details', () => {
  it('uses full dates, job title, deduped sameAs and the page as main entity', () => {
    const result = personJsonLd(
      {
        name_en: 'Sejong the Great',
        slug: 'sejong-daewang',
        birth_year: 1397,
        birth_date: '05-15',
        death_year: 1450,
        updated_at: '2026-09-01T00:00:00Z',
      },
      {
        jobTitle: ['4th King of Joseon'],
        sameAs: ['https://www.wikidata.org/wiki/Q11124', 'https://www.wikidata.org/wiki/Q11124'],
      }
    );
    expect(result.birthDate).toBe('1397-05-15');
    expect(result.deathDate).toBe('1450');
    expect(result.jobTitle).toBe('4th King of Joseon');
    expect(result.sameAs).toEqual(['https://www.wikidata.org/wiki/Q11124']);
    expect(result.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://sillok.kr/persons/sejong-daewang',
      dateModified: '2026-09-01T00:00:00Z',
    });
  });

  it('lists several titles as an array', () => {
    const result = personJsonLd({ name_en: 'Gojong', slug: 'g' }, { jobTitle: ['26th King of Joseon', '1st Emperor of the Korean Empire'] });
    expect(result.jobTitle).toEqual(['26th King of Joseon', '1st Emperor of the Korean Empire']);
  });
});

describe('historicalDate', () => {
  it('pads early years and ignores malformed month-days', () => {
    expect(historicalDate(397)).toBe('0397');
    expect(historicalDate(397, '03-01')).toBe('0397-03-01');
    expect(historicalDate(1397, '5-15')).toBe('1397');
    expect(historicalDate(-57, '01-01')).toBe('-57');
  });
});

describe('personSameAs', () => {
  it('keeps encyclopedia entries and Wikipedia/Wikidata links of any kind', () => {
    expect(
      personSameAs([
        { kind: 'ENCYCLOPEDIA', url: 'https://encykorea.aks.ac.kr/Article/E0029165' },
        { kind: 'WEB', url: 'https://www.wikidata.org/wiki/Q11124' },
        { kind: 'WEB', url: 'https://en.wikipedia.org/wiki/Sejong_the_Great' },
        { kind: 'WEB', url: 'https://example.com/sejong' },
        { kind: 'WEB', url: 'not a url' },
        { kind: 'ENCYCLOPEDIA', url: null },
      ])
    ).toEqual([
      'https://encykorea.aks.ac.kr/Article/E0029165',
      'https://www.wikidata.org/wiki/Q11124',
      'https://en.wikipedia.org/wiki/Sejong_the_Great',
    ]);
  });
});

describe('personBreadcrumbJsonLd — rulers', () => {
  it('uses the dynasty list as the parent', () => {
    const result = personBreadcrumbJsonLd({ name_en: 'Sejong the Great', slug: 'sejong-daewang' }, undefined, {
      title: 'Kings of Joseon',
      path: '/monarchs/joseon',
    });
    expect(result.itemListElement[1]).toMatchObject({ name: 'Kings of Joseon', item: 'https://sillok.kr/monarchs/joseon' });
  });
});

describe('dynastyListJsonLd', () => {
  it('lists rulers in order, linking those with pages', () => {
    const result = dynastyListJsonLd({
      name: 'Kings of Joseon',
      description: 'd',
      path: '/monarchs/joseon',
      rulers: [
        { name: 'Taejo', alternateName: '태조', jobTitle: '1st King of Joseon' },
        { name: 'Sejong the Great', alternateName: '세종', slug: 'sejong-daewang', jobTitle: '4th King of Joseon' },
      ],
    });
    expect(result.mainEntity.numberOfItems).toBe(2);
    expect(result.mainEntity.itemListElement[0].item).not.toHaveProperty('url');
    expect(result.mainEntity.itemListElement[1]).toMatchObject({
      position: 2,
      item: { url: 'https://sillok.kr/persons/sejong-daewang' },
    });
  });
});
