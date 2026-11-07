import { describe, it, expect } from 'vitest';
import { layoutTree, type TreeInput } from '@/lib/royal-tree';

const node = (id: string, children: TreeInput[] = [], spouses = 0): TreeInput => ({ id, spouses, children });
const at = (layout: ReturnType<typeof layoutTree>) => Object.fromEntries(layout.positions.map((p) => [p.id, p]));
const leaves = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => node(`${prefix}${i}`));

const SAMPLE = node(
  'r',
  [
    node('a', [node('a1'), node('a2', [node('a21'), node('a22')], 1)], 2),
    node('b'),
    node('c', [node('c1', leaves('c1k', 9), 1), node('c2')], 3),
    ...leaves('z', 7),
  ],
  1
);

describe('layoutTree', () => {
  it('places a lone person at the origin', () => {
    expect(layoutTree(node('a'))).toEqual({ positions: [{ id: 'a', x: 0, gen: 0 }], columns: 1, rows: 1 });
  });

  it('counts spouses in the width', () => {
    expect(layoutTree(node('a', [], 2)).columns).toBe(3);
  });

  it('centers the parent over the children', () => {
    const p = at(layoutTree(node('a', [node('b'), node('c'), node('d')])));
    expect(p.a.x).toBeCloseTo(p.c.x);
    expect(p.b.x).toBeLessThan(p.c.x);
    expect(p.d.x).toBeGreaterThan(p.c.x);
    expect(p.b.gen).toBe(1);
  });

  it('keeps a single chain straight', () => {
    const p = at(layoutTree(node('a', [node('b', [node('c')])])));
    expect(p.a.x).toBe(p.b.x);
    expect(p.b.x).toBe(p.c.x);
  });

  it('centers the parent over the child who carries the line on', () => {
    const p = at(layoutTree(node('a', [...leaves('x', 5), node('heir', [node('k')])])));
    expect(p.a.x).toBeCloseTo(p.heir.x);
  });

  it('never overlaps cards on a row', () => {
    const layout = at(layoutTree(SAMPLE));
    const rows = new Map<number, [number, number][]>();
    const walk = (n: TreeInput) => {
      const p = layout[n.id];
      rows.set(p.gen, [...(rows.get(p.gen) ?? []), [p.x, p.x + 1 + n.spouses]]);
      n.children.forEach(walk);
    };
    walk(SAMPLE);
    for (const row of rows.values()) {
      const sorted = [...row].sort((x, y) => x[0] - y[0]);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i][0]).toBeGreaterThanOrEqual(sorted[i - 1][1] - 1e-9);
      }
    }
  });

  it('does not widen later generations for childless siblings', () => {
    const chain = (depth: number): TreeInput => (depth === 0 ? node('leaf') : node(`n${depth}`, [chain(depth - 1)]));
    const layout = layoutTree(node('root', [...leaves('s', 10), chain(3)]));
    // The generation of 11 sets the width; the chain below it adds nothing
    expect(layout.columns).toBeLessThan(13);
    expect(layout.rows).toBe(5);
  });

  it('keeps every position within the reported width', () => {
    const layout = layoutTree(SAMPLE);
    for (const p of layout.positions) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + 1).toBeLessThanOrEqual(layout.columns + 1e-9);
    }
  });
});
