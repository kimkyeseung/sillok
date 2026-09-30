import { describe, it, expect } from 'vitest';
import { getMediaInfo, mediaFacts, mediaKind, mediaLabel, stripKoreanTitle } from '@/lib/media';
import { mediaJsonLd } from '@/lib/jsonld';

describe('mediaKind', () => {
  it('detects dramas and films from any batch key', () => {
    expect(mediaKind({ media_type: 'drama' })).toBe('drama');
    expect(mediaKind({ genre: 'TV series' })).toBe('drama');
    expect(mediaKind({ media_type: 'film' })).toBe('film');
    expect(mediaKind({ genre: 'Legal Code' })).toBe('legal code');
    expect(mediaKind({})).toBeNull();
  });
});

describe('getMediaInfo', () => {
  it('reads the new-batch keys', () => {
    const info = getMediaInfo({
      media_type: 'drama', release_year: 2021, original_title_ko: '옷소매 붉은 끝동',
      platform: 'MBC', episodes: 17, cast: ['Lee Jun-ho', 'Lee Se-young'], genre: 'Historical Romance Drama',
    });
    expect(info).toMatchObject({ kind: 'drama', year: 2021, titleKo: '옷소매 붉은 끝동', platform: 'MBC', episodes: 17 });
    expect(info.cast).toHaveLength(2);
  });

  it('falls back to older keys and treats books as non-screen media', () => {
    const info = getMediaInfo({ year: 1485, genre: 'Legal Code', title_ko: '경국대전' });
    expect(info).toMatchObject({ kind: null, year: 1485, titleKo: '경국대전' });
    expect(mediaLabel(info)).toBeNull();
    expect(mediaFacts(info)).toEqual([]);
  });

  it('survives null metadata and junk cast entries', () => {
    expect(getMediaInfo(null).kind).toBeNull();
    expect(getMediaInfo({ media_type: 'film', cast: ['A', 3, null] }).cast).toEqual(['A']);
  });
});

describe('stripKoreanTitle', () => {
  it('drops a trailing Korean parenthetical only', () => {
    expect(stripKoreanTitle('The Red Sleeve (옷소매 붉은 끝동)')).toBe('The Red Sleeve');
    expect(stripKoreanTitle('Detective K: Secret of Virtuous Widow (조선명탐정: 각시투구꽃의 비밀)')).toBe(
      'Detective K: Secret of Virtuous Widow'
    );
    expect(stripKoreanTitle('Hero (2022)')).toBe('Hero (2022)');
    expect(stripKoreanTitle('Kingdom')).toBe('Kingdom');
  });
});

describe('mediaLabel / mediaFacts', () => {
  it('builds a search label and fact rows', () => {
    const info = getMediaInfo({ media_type: 'film', release_year: 2019, director: 'Jo Chul-hyun', cast: ['Song Kang-ho'] });
    expect(mediaLabel(info)).toBe('2019 Korean film');
    expect(mediaFacts(info).map((f) => f.label)).toEqual(['Released', 'Type', 'Director', 'Starring']);
  });
});

describe('mediaJsonLd', () => {
  it('uses Movie for films with director, actors and depicted figures', () => {
    const ld = mediaJsonLd({
      kind: 'film', name: "The King's Letters", name_ko: '나랏말싸미', year: 2019,
      director: 'Jo Chul-hyun', cast: ['Song Kang-ho'], slug: 'the-kings-letters',
      persons: [{ name: 'Sejong the Great', slug: 'sejong-daewang' }],
    });
    expect(ld['@type']).toBe('Movie');
    expect(ld).toMatchObject({ alternateName: '나랏말싸미', datePublished: '2019' });
    expect(ld.actor).toEqual([{ '@type': 'Person', name: 'Song Kang-ho' }]);
    expect(ld.about?.[0].url).toBe('https://sillok.kr/persons/sejong-daewang');
  });

  it('uses TVSeries with startDate and episodes, omitting empty fields', () => {
    const ld = mediaJsonLd({ kind: 'drama', name: 'Mr. Queen', year: 2020, episodes: 20, cast: [], slug: 'mr-queen' });
    expect(ld['@type']).toBe('TVSeries');
    expect(ld).toMatchObject({ startDate: '2020', numberOfEpisodes: 20 });
    expect(ld).not.toHaveProperty('actor');
    expect(ld).not.toHaveProperty('director');
  });
});
