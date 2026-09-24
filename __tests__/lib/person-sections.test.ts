import { describe, it, expect } from 'vitest';
import {
  personTabs,
  lifespanOverlap,
  findContemporaries,
  buildLifeEvents,
  buildRelationGraph,
} from '@/lib/person-sections';

describe('personTabs', () => {
  it('always shows overview and stats; hides empty tabs', () => {
    const tabs = personTabs('sejong-daewang', {
      timeline: 5,
      relations: 0,
      related: 3,
      gallery: 1,
      threads: 4,
    });
    expect(tabs.map((t) => t.key)).toEqual(['overview', 'timeline', 'related', 'threads', 'stats']);
    expect(tabs[0].href).toBe('/persons/sejong-daewang');
    expect(tabs[1].href).toBe('/persons/sejong-daewang/timeline');
  });
});

describe('lifespanOverlap', () => {
  it('computes shared years', () => {
    expect(
      lifespanOverlap(
        { id: 'a', birth_year: 1397, death_year: 1450 },
        { id: 'b', birth_year: 1390, death_year: 1442 }
      )
    ).toBe(45);
  });

  it('is 0 when lifetimes never overlap or data is missing', () => {
    expect(
      lifespanOverlap({ id: 'a', birth_year: 1397, death_year: 1450 }, { id: 'b', birth_year: 1500, death_year: 1560 })
    ).toBe(0);
    expect(
      lifespanOverlap({ id: 'a', birth_year: 1397, death_year: 1450 }, { id: 'b', birth_year: null, death_year: 1440 })
    ).toBe(0);
  });

  it('treats living people as alive until the current year', () => {
    expect(
      lifespanOverlap(
        { id: 'a', birth_year: 1990, death_year: null, is_alive: true },
        { id: 'b', birth_year: 2000, death_year: 2010 },
        2026
      )
    ).toBe(10);
  });
});

describe('findContemporaries', () => {
  const self = { id: 'sejong', birth_year: 1397, death_year: 1450 };
  const candidates = [
    { id: 'sejong', birth_year: 1397, death_year: 1450 },
    { id: 'jang', birth_year: 1390, death_year: 1450, thumbnail: 'x' },
    { id: 'hwang', birth_year: 1363, death_year: 1452 },
    { id: 'later', birth_year: 1500, death_year: 1560 },
    { id: 'short', birth_year: 1447, death_year: 1470 },
  ];

  it('excludes self, non-overlapping and short overlaps', () => {
    const result = findContemporaries(self, candidates, { minOverlap: 5 });
    // Both overlap 53 years — the tie goes to the one with a portrait
    expect(result.map((r) => r.id)).toEqual(['jang', 'hwang']);
    expect(result.map((r) => r.overlap)).toEqual([53, 53]);
  });

  it('sorts by overlap first', () => {
    const result = findContemporaries(self, [
      { id: 'brief', birth_year: 1440, death_year: 1500, thumbnail: 'x' },
      { id: 'long', birth_year: 1400, death_year: 1460 },
    ]);
    expect(result.map((r) => r.id)).toEqual(['long', 'brief']);
  });

  it('respects excludeIds and limit', () => {
    expect(findContemporaries(self, candidates, { excludeIds: ['hwang'] }).map((r) => r.id)).toEqual(['jang']);
    expect(findContemporaries(self, candidates, { limit: 1 })).toHaveLength(1);
  });
});

describe('buildLifeEvents', () => {
  it('merges personal, related and event entries within the lifetime', () => {
    const events = buildLifeEvents(
      { birth_year: 1397, death_year: 1450 },
      [
        { year: 1418, title: 'Enthronement' },
        { year: 1443, title: 'Creation of Hunminjeongeum' },
      ],
      [
        { slug: 'taejong', name_en: 'Taejong', birth_year: 1367, death_year: 1422, label: 'Father' },
        { slug: 'munjong', name_en: 'Munjong', birth_year: 1414, death_year: 1452, label: 'Son' },
      ],
      [
        { slug: 'hangul', title: 'Creation of Hunminjeongeum', year: 1443 },
        { slug: 'daemado', title: 'Expedition to Tsushima', year: 1419 },
        { slug: 'later', title: 'Later event', year: 1500 },
      ]
    );
    expect(events.map((e) => `${e.year} ${e.kind} ${e.title}`)).toEqual([
      '1414 related Son Munjong is born',
      '1418 personal Enthronement',
      '1419 event Expedition to Tsushima',
      '1422 related Father Taejong dies',
      '1443 personal Creation of Hunminjeongeum',
    ]);
  });
});

describe('buildRelationGraph', () => {
  const rels = [
    { from: 'sejong', to: 'taejong', type: 'FAMILY' },
    { from: 'sejong', to: 'jang', type: 'LORD_VASSAL' },
    { from: 'taejong', to: 'taejo', type: 'FAMILY' },
    { from: 'jang', to: 'taejong', type: 'ALLY' },
    { from: 'x', to: 'y', type: 'ALLY' },
  ];

  it('places self in the center, direct relations on ring 1, their relations on ring 2', () => {
    const g = buildRelationGraph('sejong', rels, { size: 600 });
    const ring = (id: string) => g.nodes.find((n) => n.id === id)?.ring;
    expect(ring('sejong')).toBe(0);
    expect(ring('taejong')).toBe(1);
    expect(ring('jang')).toBe(1);
    expect(ring('taejo')).toBe(2);
    expect(ring('x')).toBeUndefined();
    const self = g.nodes.find((n) => n.id === 'sejong')!;
    expect(self.x).toBe(300);
    expect(self.y).toBe(300);
  });

  it('keeps edges between shown nodes only, including ring1↔ring1 links', () => {
    const g = buildRelationGraph('sejong', rels);
    expect(g.edges).toHaveLength(4);
    expect(g.edges.some((e) => e.from === 'x')).toBe(false);
  });

  it('caps ring sizes', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ from: 'c', to: `n${i}`, type: 'ALLY' }));
    const g = buildRelationGraph('c', many, { maxRing1: 10 });
    expect(g.nodes.filter((n) => n.ring === 1)).toHaveLength(10);
  });
});
