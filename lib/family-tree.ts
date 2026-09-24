/**
 * Family tree layout (pure — no DB access)
 *
 * Builds a person-centered family tree from FAMILY relations:
 *   gen -2  grandparents
 *   gen -1  parents
 *   gen  0  siblings · SELF · spouses
 *   gen +1  children
 *   gen +2  grandchildren
 *
 * `x` is a slot index (0 = leftmost). The renderer converts slots/gens to pixels.
 */

export type FamilyRole = 'PARENT' | 'SPOUSE' | 'SIBLING';

export interface FamilyRelation {
  from_person_id: string;
  to_person_id: string;
  family_role: FamilyRole;
}

export type FamilyTreeRole =
  | 'self'
  | 'grandparent'
  | 'parent'
  | 'sibling'
  | 'spouse'
  | 'child'
  | 'grandchild';

export interface FamilyTreeNode {
  id: string;
  role: FamilyTreeRole;
  gen: number;
  x: number;
}

export interface FamilyTreeEdge {
  from: string;
  to: string;
  kind: 'parent' | 'spouse' | 'sibling';
}

export interface FamilyTree {
  nodes: FamilyTreeNode[];
  edges: FamilyTreeEdge[];
  /** Number of columns (slots) — for width calculation */
  columns: number;
  /** Lowest generation present (e.g. -2) */
  minGen: number;
  /** Highest generation present (e.g. 2) */
  maxGen: number;
}

interface BuildOptions {
  /** Birth years for ordering siblings/children (older first) */
  birthYears?: Record<string, number | null | undefined>;
  /** Max nodes per group (siblings, children, grandchildren per parent) */
  maxPerGroup?: number;
}

export function buildFamilyTree(
  selfId: string,
  relations: FamilyRelation[],
  { birthYears = {}, maxPerGroup = 8 }: BuildOptions = {}
): FamilyTree {
  const byAge = (a: string, b: string) => {
    const ya = birthYears[a] ?? Number.POSITIVE_INFINITY;
    const yb = birthYears[b] ?? Number.POSITIVE_INFINITY;
    return ya - yb || a.localeCompare(b);
  };
  const uniqSorted = (ids: Iterable<string>, exclude: Set<string>) =>
    Array.from(new Set(ids))
      .filter((id) => !exclude.has(id))
      .sort(byAge)
      .slice(0, maxPerGroup);

  // Loaders may return the same row twice (e.g. from both the 1st- and 2nd-hop queries)
  const seenLinks = new Set<string>();
  relations = relations.filter((r) => {
    const key = `${r.family_role}:${r.from_person_id}:${r.to_person_id}`;
    if (seenLinks.has(key)) return false;
    seenLinks.add(key);
    return true;
  });

  const parentLinks = relations.filter((r) => r.family_role === 'PARENT');
  const parentsOf = (id: string) =>
    parentLinks.filter((r) => r.to_person_id === id).map((r) => r.from_person_id);
  const childrenOf = (id: string) =>
    parentLinks.filter((r) => r.from_person_id === id).map((r) => r.to_person_id);
  const partnersOf = (id: string, role: FamilyRole) =>
    relations
      .filter((r) => r.family_role === role)
      .flatMap((r) =>
        r.from_person_id === id
          ? [r.to_person_id]
          : r.to_person_id === id
            ? [r.from_person_id]
            : []
      );

  // Each person appears once — the first (closest) role wins
  const placed = new Set<string>([selfId]);
  const take = (ids: string[]) => {
    ids.forEach((id) => placed.add(id));
    return ids;
  };

  const parents = take(uniqSorted(parentsOf(selfId), placed));
  const spouses = take(uniqSorted(partnersOf(selfId, 'SPOUSE'), placed));
  const children = take(uniqSorted(childrenOf(selfId), placed));
  const sharedParentSiblings = take(
    uniqSorted(parents.flatMap(childrenOf), placed)
  );
  const explicitSiblings = take(
    uniqSorted(partnersOf(selfId, 'SIBLING'), placed)
  );
  const grandparentGroups = parents.map((p) => take(uniqSorted(parentsOf(p), placed)));
  const grandchildGroups = children.map((c) => take(uniqSorted(childrenOf(c), placed)));

  const nodes: FamilyTreeNode[] = [];
  const add = (id: string, role: FamilyTreeRole, gen: number, x: number) =>
    nodes.push({ id, role, gen, x });

  // gen 0: [shared-parent siblings][explicit siblings] SELF [spouses]
  const siblings = [...sharedParentSiblings, ...explicitSiblings];
  siblings.forEach((id, i) => add(id, 'sibling', 0, i - siblings.length));
  add(selfId, 'self', 0, 0);
  spouses.forEach((id, i) => add(id, 'spouse', 0, i + 1));

  // gen ±1: centered on self
  const centered = (count: number, center: number) =>
    Array.from({ length: count }, (_, i) => center - (count - 1) / 2 + i);
  const parentXs = centered(parents.length, 0);
  parents.forEach((id, i) => add(id, 'parent', -1, parentXs[i]));
  const childXs = centered(children.length, 0);
  children.forEach((id, i) => add(id, 'child', 1, childXs[i]));

  // gen ±2: each group centered on its anchor, then pushed apart to avoid overlap
  const placeGroups = (
    groups: string[][],
    anchorXs: number[],
    role: FamilyTreeRole,
    gen: number
  ) => {
    let minNext = Number.NEGATIVE_INFINITY;
    groups.forEach((group, gi) => {
      const xs = centered(group.length, anchorXs[gi]);
      const shift = Math.max(0, minNext - (xs[0] ?? 0));
      group.forEach((id, i) => add(id, role, gen, xs[i] + shift));
      if (group.length) minNext = xs[group.length - 1] + shift + 1;
    });
  };
  placeGroups(grandparentGroups, parentXs, 'grandparent', -2);
  placeGroups(grandchildGroups, childXs, 'grandchild', 2);

  // Normalize slots so the leftmost node is at x = 0
  const minX = Math.min(...nodes.map((n) => n.x));
  nodes.forEach((n) => (n.x -= minX));
  // Slots can be fractional (even-sized groups center on a half slot)
  const columns = Math.ceil(Math.max(...nodes.map((n) => n.x)) + 1);

  // Edges between displayed nodes
  const shown = new Set(nodes.map((n) => n.id));
  const edges: FamilyTreeEdge[] = [];
  parentLinks.forEach((r) => {
    if (shown.has(r.from_person_id) && shown.has(r.to_person_id))
      edges.push({ from: r.from_person_id, to: r.to_person_id, kind: 'parent' });
  });
  spouses.forEach((id) => edges.push({ from: selfId, to: id, kind: 'spouse' }));
  explicitSiblings.forEach((id) => edges.push({ from: id, to: selfId, kind: 'sibling' }));

  const gens = nodes.map((n) => n.gen);
  return {
    nodes,
    edges,
    columns,
    minGen: Math.min(...gens),
    maxGen: Math.max(...gens),
  };
}
