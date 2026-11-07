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

/** Every card on a line, as [left, right] */
function cardsByLine(root: TreeInput, maxCols?: number) {
  const layout = at(layoutTree(root, { maxCols }));
  const lines = new Map<string, [number, number][]>();
  const walk = (n: TreeInput) => {
    const p = layout[n.id];
    const key = `${p.gen}:${p.subRow}`;
    lines.set(key, [...(lines.get(key) ?? []), [p.x, p.x + 1 + n.spouses]]);
    n.children.forEach(walk);
  };
  walk(root);
  return lines;
}

function expectNoOverlap(root: TreeInput, maxCols?: number) {
  for (const line of cardsByLine(root, maxCols).values()) {
    const sorted = [...line].sort((x, y) => x[0] - y[0]);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i][0]).toBeGreaterThanOrEqual(sorted[i - 1][1] - 1e-9);
    }
  }
}

describe('layoutTree', () => {
  it('places a lone person at the origin', () => {
    expect(layoutTree(node('a'))).toEqual({
      positions: [{ id: 'a', x: 0, gen: 0, subRow: 0 }],
      groups: [],
      columns: 1,
      rowSpans: [1],
    });
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

  it('never overlaps cards on a line', () => {
    expectNoOverlap(SAMPLE);
  });

  it('does not widen later generations for childless siblings', () => {
    const chain = (depth: number): TreeInput => (depth === 0 ? node('leaf') : node(`n${depth}`, [chain(depth - 1)]));
    const layout = layoutTree(node('root', [...leaves('s', 10), chain(3)]));
    // The generation of 11 sets the width; the chain below it adds nothing
    expect(layout.columns).toBeLessThan(13);
    expect(layout.rowSpans).toHaveLength(5);
  });

  it('keeps every position within the reported width', () => {
    for (const maxCols of [undefined, 3]) {
      const layout = layoutTree(SAMPLE, { maxCols });
      for (const p of layout.positions) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x + 1).toBeLessThanOrEqual(layout.columns + 1e-9);
      }
    }
  });
});

describe('layoutTree with maxCols', () => {
  it('wraps childless siblings into groups on each side of the heir', () => {
    const layout = layoutTree(node('a', [...leaves('x', 20), node('heir', [node('k')])]), { maxCols: 4 });
    const p = at(layout);
    const siblings = layout.groups.filter((group) => group.parentId === 'a');
    expect(siblings).toHaveLength(2);
    for (const group of siblings) {
      expect(group.cols).toBe(4);
      expect(group.rows).toBe(3);
    }
    expect(layout.rowSpans).toEqual([1, 3, 1]);
    expect(p.x0.x).toBeLessThan(p.heir.x);
    expect(p.x19.x).toBeGreaterThan(p.heir.x);
    expect(p.x4).toMatchObject({ gen: 1, subRow: 1 });
    // Far narrower than one line of 21
    expect(layout.columns).toBeLessThan(10);
  });

  it('keeps a small family on one line', () => {
    const layout = layoutTree(node('a', leaves('x', 3)), { maxCols: 4 });
    expect(layout.groups).toHaveLength(1);
    expect(layout.groups[0]).toMatchObject({ cols: 3, rows: 1 });
    expect(layout.rowSpans).toEqual([1, 1]);
  });

  it('lets a family with no heir use both sides’ width, centered', () => {
    const layout = layoutTree(node('a', leaves('x', 16)), { maxCols: 4 });
    expect(layout.groups[0]).toMatchObject({ cols: 8, rows: 2 });
    const p = at(layout);
    expect(p.a.x).toBeCloseTo(layout.groups[0].x + 3.5);
  });

  it('does not wrap a married child without children', () => {
    const layout = layoutTree(node('a', [node('king', [], 1), ...leaves('x', 6)]), { maxCols: 4 });
    expect(layout.groups.flatMap((g) => g.memberIds)).not.toContain('king');
    expect(at(layout).king.subRow).toBe(0);
  });

  it('never overlaps cards on a line, and places everyone once', () => {
    expectNoOverlap(SAMPLE, 3);
    const ids = layoutTree(SAMPLE, { maxCols: 3 }).positions.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(26);
  });
});
