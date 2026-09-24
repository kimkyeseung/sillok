/**
 * Home feed — pure helpers (no DB access)
 * Sorting & cursors, default-sort switch, daily rotation, boards/topics, reply trees.
 */

// ─── Sorting ───

export const FEED_SORTS = ['hot', 'new', 'top'] as const;
export type FeedSort = (typeof FEED_SORTS)[number];

export const TOP_WINDOWS = ['day', 'week', 'month', 'all'] as const;
export type TopWindow = (typeof TOP_WINDOWS)[number];

export const TOP_WINDOW_DAYS: Record<TopWindow, number | null> = {
  day: 1,
  week: 7,
  month: 30,
  all: null,
};

/** Threads posted in the last 7 days needed before "Hot" becomes the default sort */
export const HOT_DEFAULT_THRESHOLD = 5;

/**
 * Quiet community → show the all-time best ("Top") so the feed reads like a hall of fame
 * instead of a list of old posts; busy community → "Hot".
 */
export function pickDefaultSort(recentThreadCount: number): { sort: FeedSort; t: TopWindow } {
  return recentThreadCount >= HOT_DEFAULT_THRESHOLD ? { sort: 'hot', t: 'all' } : { sort: 'top', t: 'all' };
}

// ─── Cursor (keyset pagination on (value, id)) ───

export interface FeedCursor {
  /** hot_score, top_score or created_at of the last item */
  v: number | string;
  id: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:?\d{2})?$/;

export function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

/** Returns null for malformed cursors — values end up in filter strings, so validate strictly */
export function decodeCursor(raw: string | null | undefined, sort: FeedSort): FeedCursor | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as FeedCursor;
    if (typeof c?.id !== 'string' || !UUID.test(c.id)) return null;
    if (sort === 'new') return typeof c.v === 'string' && ISO.test(c.v) ? c : null;
    return typeof c.v === 'number' && Number.isFinite(c.v) ? c : null;
  } catch {
    return null;
  }
}

// ─── Daily rotation (Korea time, so "today" matches the audience) ───

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Whole days since the epoch in KST — same value for everyone on a given Korean date */
export function dayNumber(date = new Date()): number {
  return Math.floor((date.getTime() + KST_OFFSET_MS) / 86_400_000);
}

/** Month and day in KST, e.g. { month: 9, day: 25, key: '09-25' } */
export function kstMonthDay(date = new Date()) {
  const d = new Date(date.getTime() + KST_OFFSET_MS);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return { month, day, key: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
}

/** Deterministically pick `count` items for a day, cycling through the whole list over time */
export function rotate<T>(items: T[], day: number, count = 1): T[] {
  if (!items.length) return [];
  const n = Math.min(count, items.length);
  const start = (((day * n) % items.length) + items.length) % items.length;
  return Array.from({ length: n }, (_, i) => items[(start + i) % items.length]);
}

// ─── On this day ───

export interface DatedPerson {
  slug: string;
  name_en: string;
  birth_year: number | null;
  death_year: number | null;
  /** 'MM-DD' */
  birth_date: string | null;
  death_date: string | null;
}

export interface MonthEntry {
  year: number;
  month: number;
  title: string;
  person: { slug: string; name_en: string };
}

export interface HistoryItem {
  year: number | null;
  text: string;
  href: string;
  kind: 'born' | 'died' | 'event';
}

/**
 * Births and deaths on today's date; when there are none (most days),
 * fall back to births, deaths and timeline events in the same month.
 */
export function onThisDay(
  persons: DatedPerson[],
  monthEntries: MonthEntry[],
  today: { month: number; key: string },
  limit = 5
): { scope: 'day' | 'month'; items: HistoryItem[] } {
  const mm = today.key.slice(0, 2);
  const lifeEvents = (match: (date: string) => boolean): HistoryItem[] =>
    persons.flatMap((p) => [
      ...(p.birth_date && match(p.birth_date)
        ? [{ year: p.birth_year, text: `${p.name_en} is born`, href: `/persons/${p.slug}`, kind: 'born' as const }]
        : []),
      ...(p.death_date && match(p.death_date)
        ? [{ year: p.death_year, text: `${p.name_en} dies`, href: `/persons/${p.slug}`, kind: 'died' as const }]
        : []),
    ]);
  const byYear = (a: HistoryItem, b: HistoryItem) => (a.year ?? 0) - (b.year ?? 0);

  const day = lifeEvents((d) => d === today.key).sort(byYear);
  if (day.length) return { scope: 'day', items: day.slice(0, limit) };

  const month = [
    ...lifeEvents((d) => d.startsWith(`${mm}-`)),
    ...monthEntries
      .filter((e) => e.month === today.month)
      .map((e) => ({
        year: e.year,
        text: `${e.person.name_en}: ${e.title}`,
        href: `/persons/${e.person.slug}/timeline`,
        kind: 'event' as const,
      })),
  ].sort(byYear);
  return { scope: 'month', items: month.slice(0, limit) };
}

// ─── Boards (eras) & topics (thread categories) ───

export const BOARDS = [
  { slug: 'ancient', label: 'Ancient Korea', icon: '🏺' },
  { slug: 'three-kingdoms', label: 'Three Kingdoms', icon: '⚔️' },
  { slug: 'unified-silla', label: 'Unified Silla', icon: '🛕' },
  { slug: 'goryeo', label: 'Goryeo', icon: '🏯' },
  { slug: 'joseon', label: 'Joseon', icon: '👑' },
  { slug: 'modern', label: 'Modern Korea', icon: '🇰🇷' },
] as const;
export type BoardSlug = (typeof BOARDS)[number]['slug'];
export const findBoard = (slug: string) => BOARDS.find((b) => b.slug === slug) ?? null;

export const TOPICS = [
  { slug: 'discussion', category: 'DISCUSSION', label: 'Discussion', icon: '💬' },
  { slug: 'trivia', category: 'TRIVIA', label: 'Trivia', icon: '💡' },
  { slug: 'qna', category: 'QNA', label: 'Q&A', icon: '❓' },
  { slug: 'sources', category: 'SOURCES', label: 'Sources', icon: '📚' },
  { slug: 'film-tv', category: 'MEDIA', label: 'Film & TV', icon: '🎬' },
] as const;
export const findTopic = (slug: string) => TOPICS.find((t) => t.slug === slug) ?? null;

// ─── Relative time ───

export function timeAgo(date: string | Date, now = new Date()): string {
  const diff = now.getTime() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// ─── Reply trees ───

export const MAX_REPLY_DEPTH = 4;

export interface ReplyNode<T> {
  reply: T;
  depth: number;
}

/**
 * Order replies depth-first under their parents (oldest first at each level).
 * Orphans (deleted/missing parent) become top-level; depth is capped for display.
 */
export function buildReplyTree<T extends { id: string; parent_id: string | null; created_at: string }>(
  replies: T[],
  maxDepth = MAX_REPLY_DEPTH
): ReplyNode<T>[] {
  const ids = new Set(replies.map((r) => r.id));
  const children = new Map<string | null, T[]>();
  replies.forEach((r) => {
    const parent = r.parent_id && ids.has(r.parent_id) ? r.parent_id : null;
    children.set(parent, [...(children.get(parent) ?? []), r]);
  });
  children.forEach((list) => list.sort((a, b) => a.created_at.localeCompare(b.created_at)));

  const out: ReplyNode<T>[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const r of children.get(parent) ?? []) {
      out.push({ reply: r, depth: Math.min(depth, maxDepth) });
      walk(r.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}
