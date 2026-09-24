import { describe, it, expect } from 'vitest';
import {
  pickDefaultSort,
  encodeCursor,
  decodeCursor,
  dayNumber,
  kstMonthDay,
  rotate,
  onThisDay,
  timeAgo,
  buildReplyTree,
  findBoard,
  findTopic,
} from '@/lib/feed';

describe('pickDefaultSort', () => {
  it('uses Top while the community is quiet and Hot once it is active', () => {
    expect(pickDefaultSort(0)).toEqual({ sort: 'top', t: 'all' });
    expect(pickDefaultSort(4).sort).toBe('top');
    expect(pickDefaultSort(5).sort).toBe('hot');
  });
});

describe('feed cursor', () => {
  const id = '6106b552-6773-456d-a7ea-99679c91bc40';

  it('round-trips numeric and timestamp cursors', () => {
    expect(decodeCursor(encodeCursor({ v: 0.42, id }), 'hot')).toEqual({ v: 0.42, id });
    const ts = '2026-09-24T15:05:16.921Z';
    expect(decodeCursor(encodeCursor({ v: ts, id }), 'new')).toEqual({ v: ts, id });
  });

  it('rejects malformed or injected cursors', () => {
    expect(decodeCursor('not-base64-json', 'hot')).toBeNull();
    expect(decodeCursor(encodeCursor({ v: '1,is_deleted.eq.true', id }), 'hot')).toBeNull();
    expect(decodeCursor(encodeCursor({ v: 3, id: 'x),or(1.eq.1' }), 'top')).toBeNull();
    expect(decodeCursor(encodeCursor({ v: 3, id }), 'new')).toBeNull();
    expect(decodeCursor(null, 'hot')).toBeNull();
  });
});

describe('daily rotation (KST)', () => {
  it('rolls over at midnight Korea time, not UTC', () => {
    const beforeKstMidnight = new Date('2026-09-24T14:59:00Z'); // 23:59 KST
    const afterKstMidnight = new Date('2026-09-24T15:01:00Z'); // 00:01 KST next day
    expect(dayNumber(afterKstMidnight) - dayNumber(beforeKstMidnight)).toBe(1);
    expect(kstMonthDay(afterKstMidnight)).toEqual({ month: 9, day: 25, key: '09-25' });
  });

  it('picks the same items for the same day and cycles through the list', () => {
    const list = ['a', 'b', 'c', 'd', 'e'];
    expect(rotate(list, 10, 2)).toEqual(rotate(list, 10, 2));
    expect(rotate(list, 0, 2)).toEqual(['a', 'b']);
    expect(rotate(list, 1, 2)).toEqual(['c', 'd']);
    expect(rotate(list, 2, 2)).toEqual(['e', 'a']);
    expect(rotate([], 3, 2)).toEqual([]);
    expect(rotate(list, 1, 10)).toHaveLength(5);
  });
});

describe('onThisDay', () => {
  const persons = [
    { slug: 'a', name_en: 'A', birth_year: 1400, death_year: 1450, birth_date: '09-25', death_date: '03-01' },
    { slug: 'b', name_en: 'B', birth_year: 1500, death_year: 1560, birth_date: '01-01', death_date: '09-03' },
  ];
  const monthEntries = [{ year: 1446, month: 9, title: 'Promulgation', person: { slug: 'a', name_en: 'A' } }];

  it('prefers exact-date births and deaths', () => {
    const r = onThisDay(persons, monthEntries, { month: 9, key: '09-25' });
    expect(r.scope).toBe('day');
    expect(r.items).toEqual([{ year: 1400, text: 'A is born', href: '/persons/a', kind: 'born' }]);
  });

  it('falls back to the whole month, sorted by year', () => {
    const r = onThisDay(persons, monthEntries, { month: 9, key: '09-10' });
    expect(r.scope).toBe('month');
    expect(r.items.map((i) => i.year)).toEqual([1400, 1446, 1560]);
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-09-25T00:00:00Z');
  it('formats relative times', () => {
    expect(timeAgo('2026-09-24T23:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-09-24T22:00:00Z', now)).toBe('2h ago');
    expect(timeAgo('2026-09-20T00:00:00Z', now)).toBe('5d ago');
    expect(timeAgo('2026-05-01T00:00:00Z', now)).toBe('4mo ago');
    expect(timeAgo('2024-09-01T00:00:00Z', now)).toBe('2y ago');
  });
});

describe('buildReplyTree', () => {
  const r = (id: string, parent_id: string | null, t: number) => ({
    id,
    parent_id,
    created_at: new Date(Date.UTC(2026, 0, 1, 0, t)).toISOString(),
  });

  it('nests replies under their parents, oldest first', () => {
    const tree = buildReplyTree([r('b', null, 2), r('a', null, 1), r('a1', 'a', 3), r('a1x', 'a1', 4), r('b1', 'b', 5)]);
    expect(tree.map((n) => `${n.reply.id}:${n.depth}`)).toEqual(['a:0', 'a1:1', 'a1x:2', 'b:0', 'b1:1']);
  });

  it('treats orphans as top level and caps depth', () => {
    const chain = [r('1', null, 1), r('2', '1', 2), r('3', '2', 3), r('4', '3', 4), r('5', '4', 5), r('6', '5', 6)];
    const tree = buildReplyTree([...chain, r('o', 'missing', 7)]);
    expect(tree.find((n) => n.reply.id === '6')?.depth).toBe(4);
    expect(tree.find((n) => n.reply.id === 'o')?.depth).toBe(0);
  });
});

describe('boards & topics', () => {
  it('finds known slugs only', () => {
    expect(findBoard('joseon')?.label).toBe('Joseon');
    expect(findBoard('nope')).toBeNull();
    expect(findTopic('film-tv')?.category).toBe('MEDIA');
  });
});
