import { describe, it, expect } from 'vitest';
import { FactSchema, HighlightSchema, SourceSchema } from '@/lib/person-content-schemas';
// Plain JS data module shared with the seed script
import { JOSEON_KINGS, buildRows } from '../../scripts/data/joseon-kings-content.mjs';

type Row = Record<string, unknown>;
const kings = JOSEON_KINGS as { slug: string; reign: string }[];
const rowsOf = (i: number) => buildRows(kings[i], i) as { facts: Row[]; highlights: Row[]; sources: Row[] };

describe('Joseon kings seed content', () => {
  it('covers all 27 monarchs with unique slugs', () => {
    expect(kings).toHaveLength(27);
    expect(new Set(kings.map((k) => k.slug)).size).toBe(27);
  });

  it('links predecessor/successor in succession order', () => {
    const first = rowsOf(0).facts;
    const last = rowsOf(26).facts;
    expect(first.some((f) => f.label === 'Predecessor')).toBe(false);
    expect(last.some((f) => f.label === 'Successor')).toBe(false);
    const sejong = rowsOf(3).facts;
    expect(sejong.find((f) => f.label === 'Predecessor')?.linkedSlug).toBe('taejong-yi-bang-won');
    expect(sejong.find((f) => f.label === 'Successor')?.linkedSlug).toBe('munjong-yi-hyang');
  });

  it('every row passes the admin validation schemas', () => {
    kings.forEach((_, i) => {
      const { facts, highlights, sources } = rowsOf(i);
      facts.forEach((f) =>
        expect(
          FactSchema.safeParse({ label: f.label, value: f.value ?? '', linked_person_slug: f.linkedSlug ?? null }).success
        ).toBe(true)
      );
      highlights.forEach((h) => expect(HighlightSchema.safeParse(h).success).toBe(true));
      sources.forEach((s) => expect(SourceSchema.safeParse(s).success).toBe(true));
      expect(highlights.some((h) => h.kind === 'ACHIEVEMENT')).toBe(true);
    });
  });

  it('highlight years fall within each reign window (±60 years for pre-reign life events)', () => {
    kings.forEach((k, i) => {
      const [start] = k.reign.match(/\d{4}/g)!.map(Number);
      const end = Number(k.reign.match(/\d{4}/g)!.at(-1));
      rowsOf(i).highlights.forEach((h) => {
        if (typeof h.year !== 'number') return;
        expect(h.year).toBeGreaterThanOrEqual(start - 60);
        expect(h.year).toBeLessThanOrEqual(end + 1);
      });
    });
  });
});

describe('content schemas', () => {
  it('rejects non-http URLs for sources', () => {
    expect(SourceSchema.safeParse({ kind: 'WEB', title: 'x', url: 'javascript:alert(1)' }).success).toBe(false);
    expect(SourceSchema.safeParse({ kind: 'WEB', title: 'x', url: 'https://example.com' }).success).toBe(true);
  });

  it('normalizes empty optional text to null', () => {
    const r = HighlightSchema.parse({ kind: 'TRIVIA', title: 'Fact', body: '' });
    expect(r.body).toBeNull();
  });
});
