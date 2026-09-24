/**
 * Person page — computed sections (pure, no DB access)
 * Tabs, contemporaries, merged life timeline, relation graph layout.
 */

// ─── Tabs ───

export type PersonTabKey =
  | 'overview'
  | 'timeline'
  | 'relations'
  | 'legacy'
  | 'related'
  | 'gallery'
  | 'threads'
  | 'sources'
  | 'stats';

export interface PersonTabCounts {
  timeline: number;
  relations: number;
  legacy: number;
  related: number;
  gallery: number;
  threads: number;
  sources: number;
}

export interface PersonTab {
  key: PersonTabKey;
  label: string;
  href: string;
  count?: number;
}

/** Minimum items for a tab to get its own page (avoid thin pages) */
export const TAB_MIN_ITEMS: Record<keyof PersonTabCounts, number> = {
  timeline: 1,
  relations: 1,
  legacy: 1,
  related: 1,
  gallery: 2,
  threads: 1,
  sources: 1,
};

export function personTabs(slug: string, counts: PersonTabCounts): PersonTab[] {
  const base = `/persons/${slug}`;
  const optional: { key: keyof PersonTabCounts; label: string }[] = [
    { key: 'timeline', label: 'Timeline' },
    { key: 'relations', label: 'Relations' },
    { key: 'legacy', label: 'Legacy' },
    { key: 'related', label: 'Related' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'threads', label: 'Threads' },
    { key: 'sources', label: 'Sources' },
  ];
  return [
    { key: 'overview', label: 'Overview', href: base },
    ...optional
      .filter(({ key }) => counts[key] >= TAB_MIN_ITEMS[key])
      .map(({ key, label }) => ({ key, label, href: `${base}/${key}`, count: counts[key] })),
    { key: 'stats', label: 'Stats', href: `${base}/stats` },
  ];
}

export function isTabVisible(tab: keyof PersonTabCounts, counts: PersonTabCounts) {
  return counts[tab] >= TAB_MIN_ITEMS[tab];
}

// ─── Contemporaries ───

export interface LifespanPerson {
  id: string;
  birth_year: number | null;
  death_year: number | null;
  is_alive?: boolean | null;
  thumbnail?: string | null;
}

const endYear = (p: LifespanPerson, currentYear: number) =>
  p.death_year ?? (p.is_alive ? currentYear : null);

/** Years two people were both alive (0 when they never overlapped or data is missing) */
export function lifespanOverlap(
  a: LifespanPerson,
  b: LifespanPerson,
  currentYear = new Date().getFullYear()
): number {
  const aEnd = endYear(a, currentYear);
  const bEnd = endYear(b, currentYear);
  if (a.birth_year == null || b.birth_year == null || aEnd == null || bEnd == null) return 0;
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(a.birth_year, b.birth_year));
}

/**
 * People alive at the same time as `self`, most overlapping first.
 * Ties prefer people with a portrait, then closer birth years.
 */
export function findContemporaries<T extends LifespanPerson>(
  self: LifespanPerson,
  candidates: T[],
  { limit = 12, minOverlap = 5, excludeIds = [] as string[] } = {}
): (T & { overlap: number })[] {
  const exclude = new Set([self.id, ...excludeIds]);
  return candidates
    .filter((c) => !exclude.has(c.id))
    .map((c) => ({ ...c, overlap: lifespanOverlap(self, c) }))
    .filter((c) => c.overlap >= minOverlap)
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        Number(!!b.thumbnail) - Number(!!a.thumbnail) ||
        Math.abs((a.birth_year ?? 0) - (self.birth_year ?? 0)) -
          Math.abs((b.birth_year ?? 0) - (self.birth_year ?? 0))
    )
    .slice(0, limit);
}

// ─── Life timeline (own events + related lives + linked events) ───

export interface LifeEvent {
  year: number;
  title: string;
  description?: string | null;
  kind: 'personal' | 'related' | 'event';
  href?: string;
}

interface RelatedLife {
  slug: string;
  name_en: string;
  birth_year: number | null;
  death_year: number | null;
  /** e.g. "Father", "Teacher" */
  label: string;
}

interface LinkedEvent {
  slug: string;
  title: string;
  year: number | null;
}

/**
 * Merge the person's own timeline with births/deaths of related people and
 * linked historical events that fall within the person's lifetime.
 */
export function buildLifeEvents(
  self: { birth_year: number | null; death_year: number | null },
  personal: { year: number; title: string; description?: string | null }[],
  related: RelatedLife[],
  events: LinkedEvent[]
): LifeEvent[] {
  const from = self.birth_year ?? Number.NEGATIVE_INFINITY;
  const to = self.death_year ?? Number.POSITIVE_INFINITY;
  const within = (y: number | null): y is number => y != null && y >= from && y <= to;

  const items: LifeEvent[] = personal.map((t) => ({ ...t, kind: 'personal' as const }));

  related.forEach((r) => {
    if (within(r.birth_year))
      items.push({
        year: r.birth_year,
        title: `${r.label} ${r.name_en} is born`,
        kind: 'related',
        href: `/persons/${r.slug}`,
      });
    if (within(r.death_year))
      items.push({
        year: r.death_year,
        title: `${r.label} ${r.name_en} dies`,
        kind: 'related',
        href: `/persons/${r.slug}`,
      });
  });

  // Personal entries often already describe the same event — skip same-year duplicates by title
  const personalTitles = new Set(personal.map((p) => `${p.year}:${p.title.toLowerCase()}`));
  events.forEach((e) => {
    if (within(e.year) && !personalTitles.has(`${e.year}:${e.title.toLowerCase()}`))
      items.push({ year: e.year, title: e.title, kind: 'event', href: `/nodes/${e.slug}` });
  });

  const order = { personal: 0, event: 1, related: 2 };
  return items.sort((a, b) => a.year - b.year || order[a.kind] - order[b.kind]);
}

// ─── Relation graph (radial layout) ───

export interface GraphRelation {
  from: string;
  to: string;
  type: string;
}

export interface GraphNode {
  id: string;
  ring: 0 | 1 | 2;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

export interface RelationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  size: number;
}

/**
 * Radial layout: self at the center, direct relations on ring 1,
 * their relations on ring 2 (placed near the ring-1 node they connect to).
 */
export function buildRelationGraph(
  selfId: string,
  relations: GraphRelation[],
  { maxRing1 = 12, maxRing2PerNode = 3, maxRing2 = 18, size = 640 } = {}
): RelationGraph {
  const center = size / 2;
  const r1 = size * 0.26;
  const r2 = size * 0.43;

  const neighbors = (id: string) =>
    relations.flatMap((r) => (r.from === id ? [r.to] : r.to === id ? [r.from] : []));

  const ring1 = Array.from(new Set(neighbors(selfId))).slice(0, maxRing1);
  const placed = new Set([selfId, ...ring1]);

  const nodes: GraphNode[] = [{ id: selfId, ring: 0, x: center, y: center }];
  const angle1 = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / Math.max(ring1.length, 1);
  ring1.forEach((id, i) =>
    nodes.push({
      id,
      ring: 1,
      x: center + r1 * Math.cos(angle1(i)),
      y: center + r1 * Math.sin(angle1(i)),
    })
  );

  // Ring 2 grouped by parent so children fan out around their ring-1 node
  const ring2Groups: { parentIndex: number; ids: string[] }[] = [];
  let ring2Total = 0;
  ring1.forEach((id, i) => {
    const ids: string[] = [];
    for (const n of neighbors(id)) {
      if (placed.has(n) || ids.length >= maxRing2PerNode || ring2Total >= maxRing2) continue;
      placed.add(n);
      ids.push(n);
      ring2Total++;
    }
    if (ids.length) ring2Groups.push({ parentIndex: i, ids });
  });

  const slice = (2 * Math.PI) / Math.max(ring1.length, 1);
  ring2Groups.forEach(({ parentIndex, ids }) => {
    const spread = Math.min(slice * 0.8, 0.5);
    ids.forEach((id, j) => {
      const offset = ids.length === 1 ? 0 : -spread / 2 + (spread * j) / (ids.length - 1);
      const a = angle1(parentIndex) + offset;
      nodes.push({ id, ring: 2, x: center + r2 * Math.cos(a), y: center + r2 * Math.sin(a) });
    });
  });

  const shown = new Set(nodes.map((n) => n.id));
  const seen = new Set<string>();
  const edges = relations.filter((r) => {
    const key = [r.from, r.to].sort().join('|') + r.type;
    if (!shown.has(r.from) || !shown.has(r.to) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { nodes, edges, size };
}
