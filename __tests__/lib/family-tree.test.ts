import { describe, it, expect } from 'vitest';
import { buildFamilyTree, type FamilyRelation } from '@/lib/family-tree';

const parent = (from: string, to: string): FamilyRelation => ({
  from_person_id: from,
  to_person_id: to,
  family_role: 'PARENT',
});
const spouse = (from: string, to: string): FamilyRelation => ({
  from_person_id: from,
  to_person_id: to,
  family_role: 'SPOUSE',
});

// Joseon lineage around Sejong
const RELS: FamilyRelation[] = [
  parent('taejo', 'jeongjong'),
  parent('taejo', 'taejong'),
  parent('taejong', 'sejong'),
  parent('taejong', 'yangnyeong'),
  parent('sejong', 'munjong'),
  parent('sejong', 'sejo'),
  parent('munjong', 'danjong'),
  parent('sejo', 'yejong'),
  spouse('sejong', 'soheon'),
];
const YEARS = { sejong: 1397, yangnyeong: 1394, munjong: 1414, sejo: 1417 };

const roleOf = (tree: ReturnType<typeof buildFamilyTree>, id: string) =>
  tree.nodes.find((n) => n.id === id)?.role;

describe('buildFamilyTree', () => {
  it('classifies relatives around self', () => {
    const tree = buildFamilyTree('sejong', RELS, { birthYears: YEARS });
    expect(roleOf(tree, 'sejong')).toBe('self');
    expect(roleOf(tree, 'taejong')).toBe('parent');
    expect(roleOf(tree, 'taejo')).toBe('grandparent');
    expect(roleOf(tree, 'yangnyeong')).toBe('sibling');
    expect(roleOf(tree, 'soheon')).toBe('spouse');
    expect(roleOf(tree, 'munjong')).toBe('child');
    expect(roleOf(tree, 'danjong')).toBe('grandchild');
    expect(roleOf(tree, 'yejong')).toBe('grandchild');
    // Uncle (taejo's other son) is out of scope
    expect(roleOf(tree, 'jeongjong')).toBeUndefined();
    expect(tree.minGen).toBe(-2);
    expect(tree.maxGen).toBe(2);
  });

  it('works from the child side of a relation (bidirectional lookup)', () => {
    const tree = buildFamilyTree('danjong', RELS);
    expect(roleOf(tree, 'munjong')).toBe('parent');
    expect(roleOf(tree, 'sejong')).toBe('grandparent');
  });

  it('orders children by birth year and keeps rows non-overlapping', () => {
    const tree = buildFamilyTree('sejong', RELS, { birthYears: YEARS });
    const x = (id: string) => tree.nodes.find((n) => n.id === id)!.x;
    expect(x('munjong')).toBeLessThan(x('sejo'));
    expect(x('yangnyeong')).toBeLessThan(x('sejong'));
    expect(x('sejong')).toBeLessThan(x('soheon'));
    for (const gen of [-2, -1, 0, 1, 2]) {
      const xs = tree.nodes.filter((n) => n.gen === gen).map((n) => n.x).sort((a, b) => a - b);
      xs.slice(1).forEach((v, i) => expect(v - xs[i]).toBeGreaterThanOrEqual(1));
    }
    expect(Math.min(...tree.nodes.map((n) => n.x))).toBe(0);
    tree.nodes.forEach((n) => expect(n.x).toBeLessThan(tree.columns));
  });

  it('only draws edges between displayed nodes', () => {
    const tree = buildFamilyTree('sejong', RELS);
    const ids = new Set(tree.nodes.map((n) => n.id));
    tree.edges.forEach((e) => {
      expect(ids.has(e.from)).toBe(true);
      expect(ids.has(e.to)).toBe(true);
    });
    expect(tree.edges).toContainEqual({ from: 'sejong', to: 'soheon', kind: 'spouse' });
    expect(tree.edges).not.toContainEqual(
      expect.objectContaining({ from: 'taejo', to: 'jeongjong' })
    );
  });

  it('returns just self when there are no relations', () => {
    const tree = buildFamilyTree('solo', []);
    expect(tree.nodes).toEqual([{ id: 'solo', role: 'self', gen: 0, x: 0 }]);
    expect(tree.columns).toBe(1);
  });

  it('caps large groups', () => {
    const many = Array.from({ length: 20 }, (_, i) => parent('king', `c${i}`));
    const tree = buildFamilyTree('king', many, { maxPerGroup: 8 });
    expect(tree.nodes.filter((n) => n.role === 'child')).toHaveLength(8);
  });
});
