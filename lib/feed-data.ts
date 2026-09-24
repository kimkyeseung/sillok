/**
 * Home feed — server-side loaders
 */
import { cache } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripMarkdown, truncateText } from '@/lib/seo';
import {
  TOP_WINDOW_DAYS,
  dayNumber,
  decodeCursor,
  encodeCursor,
  findTopic,
  kstMonthDay,
  onThisDay,
  pickDefaultSort,
  rotate,
  type DatedPerson,
  type FeedSort,
  type MonthEntry,
  type TopWindow,
} from '@/lib/feed';

// ─── Feed ───

export interface FeedFigure {
  slug: string;
  name_en: string;
  thumbnail: string | null;
}

export interface FeedItem {
  id: string;
  title: string;
  preview: string;
  category: string;
  created_at: string;
  like_count: number;
  reply_count: number;
  image: string | null;
  has_video: boolean;
  author: string | null;
  figures: FeedFigure[];
}

export interface FeedQuery {
  sort: FeedSort;
  t?: TopWindow;
  /** Era tag slug (board) */
  board?: string | null;
  /** Topic slug (thread category) */
  topic?: string | null;
  cursor?: string | null;
  limit?: number;
}

const FEED_FIELDS = `id, title, content, video_url, category, created_at, like_count, reply_count, person_id,
  profiles!threads_author_id_fkey ( nickname ),
  persons!threads_person_id_fkey ( slug, name_en, thumbnail ),
  thread_images ( url, sort_order ),
  thread_persons ( sort_order, persons ( slug, name_en, thumbnail ) )`;

type Row = {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  category?: string;
  created_at: string;
  like_count: number;
  reply_count: number;
  hot_score?: number;
  top_score?: number;
  profiles: { nickname: string | null } | null;
  persons: FeedFigure | null;
  thread_images: { url: string; sort_order: number }[] | null;
  thread_persons: { sort_order: number; persons: FeedFigure | null }[] | null;
};

/** Primary person ids in an era board */
const getBoardPersonIds = cache(async (board: string) => {
  const { data } = await supabaseAdmin
    .from('person_tags')
    .select('person_id, tags!inner ( name_en, type )')
    .eq('tags.name_en', board)
    .eq('tags.type', 'ERA');
  return (data ?? []).map((r) => r.person_id as string);
});

function toItem(r: Row): FeedItem {
  const figures = [
    ...(r.persons ? [r.persons] : []),
    ...[...(r.thread_persons ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((tp) => tp.persons)
      .filter((p): p is FeedFigure => !!p),
  ].filter((p, i, all) => all.findIndex((x) => x.slug === p.slug) === i);

  return {
    id: r.id,
    title: r.title,
    preview: truncateText(stripMarkdown(r.content ?? ''), 180),
    category: r.category ?? 'DISCUSSION',
    created_at: r.created_at,
    like_count: r.like_count ?? 0,
    reply_count: r.reply_count ?? 0,
    image: [...(r.thread_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
    has_video: !!r.video_url,
    author: r.profiles?.nickname ?? null,
    figures: figures.slice(0, 3),
  };
}

export async function getFeedPage({
  sort,
  t = 'all',
  board,
  topic,
  cursor,
  limit = 20,
}: FeedQuery): Promise<{ items: FeedItem[]; next_cursor: string | null; sort: FeedSort }> {
  const run = async (activeSort: FeedSort) => {
    const column = activeSort === 'hot' ? 'hot_score' : activeSort === 'top' ? 'top_score' : 'created_at';
    let query = supabaseAdmin
      .from('threads')
      .select(activeSort === 'new' ? FEED_FIELDS : `${FEED_FIELDS}, ${column}`)
      .eq('is_deleted', false);

    if (board) {
      const ids = await getBoardPersonIds(board);
      if (!ids.length) return { data: [] as Row[], error: null, column };
      query = query.in('person_id', ids);
    }
    const category = topic ? findTopic(topic)?.category : null;
    if (category) query = query.eq('category', category);

    const days = activeSort === 'top' ? TOP_WINDOW_DAYS[t] : null;
    if (days) query = query.gte('created_at', new Date(Date.now() - days * 86_400_000).toISOString());

    // Keyset pagination on (column, id) — values are validated by decodeCursor
    const c = decodeCursor(cursor, activeSort);
    if (c) {
      const v = typeof c.v === 'number' ? c.v : `"${c.v}"`;
      query = query.or(`${column}.lt.${v},and(${column}.eq.${v},id.lt.${c.id})`);
    }

    const { data, error } = await query
      .order(column, { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);
    return { data: (data ?? []) as unknown as Row[], error, column };
  };

  // hot_score / top_score arrive with the feed-ranking migration — fall back to New
  let activeSort = sort;
  let result = await run(activeSort);
  if (result.error && sort !== 'new') {
    activeSort = 'new';
    result = await run(activeSort);
  }

  const rows = result.data.slice(0, limit);
  const last = rows.at(-1) as (Row & Record<string, unknown>) | undefined;
  const next =
    result.data.length > limit && last
      ? encodeCursor({ v: last[result.column] as number | string, id: last.id })
      : null;
  return { items: rows.map(toItem), next_cursor: next, sort: activeSort };
}

/** Threads created in the last `days` days (drives the Top → Hot default switch) */
export const getRecentThreadCount = cache(async (days = 7) => {
  const { data } = await supabaseAdmin
    .from('threads')
    .select('id')
    .eq('is_deleted', false)
    .gte('created_at', new Date(Date.now() - days * 86_400_000).toISOString())
    .limit(50);
  return data?.length ?? 0;
});

export const getDefaultFeedSort = cache(async () => pickDefaultSort(await getRecentThreadCount()));

// ─── Today module ───

export interface FigureOfDay {
  slug: string;
  name_en: string;
  name_hanja: string | null;
  thumbnail: string | null;
  birth_year: number | null;
  death_year: number | null;
  summary: string | null;
  achievement: string | null;
  trivia: { title: string; body: string | null } | null;
}

export const getToday = cache(async () => {
  const today = kstMonthDay();
  const day = dayNumber();

  const [{ data: highlights }, { data: dated }, { data: monthRows }] = await Promise.all([
    supabaseAdmin
      .from('person_highlights')
      .select('person_id, kind, title, body, sort_order')
      .eq('is_deleted', false)
      .in('kind', ['ACHIEVEMENT', 'TRIVIA'])
      .order('sort_order'),
    supabaseAdmin
      .from('persons')
      .select('slug, name_en, birth_year, death_year, birth_date, death_date')
      .eq('is_deleted', false)
      .eq('is_published', true)
      .or('birth_date.not.is.null,death_date.not.is.null'),
    supabaseAdmin
      .from('person_timeline')
      .select('year, month, title, persons!inner ( slug, name_en, is_published, is_deleted )')
      .eq('month', today.month)
      .eq('persons.is_published', true)
      .eq('persons.is_deleted', false)
      .limit(200),
  ]);

  // Figure of the day: rotate through people with editorial content
  const withContent = Array.from(new Set((highlights ?? []).map((h) => h.person_id))).sort();
  const [pickId] = rotate(withContent, day, 1);
  let figure: FigureOfDay | null = null;
  if (pickId) {
    const { data: p } = await supabaseAdmin
      .from('persons')
      .select('slug, name_en, name_hanja, thumbnail, birth_year, death_year, summary')
      .eq('id', pickId)
      .eq('is_published', true)
      .maybeSingle();
    if (p) {
      const mine = (highlights ?? []).filter((h) => h.person_id === pickId);
      const trivia = mine.find((h) => h.kind === 'TRIVIA');
      figure = {
        ...p,
        summary: p.summary ? truncateText(p.summary, 220) : null,
        achievement: mine.find((h) => h.kind === 'ACHIEVEMENT')?.title ?? null,
        trivia: trivia ? { title: trivia.title, body: trivia.body } : null,
      };
    }
  }

  const monthEntries: MonthEntry[] = ((monthRows ?? []) as unknown as {
    year: number;
    month: number;
    title: string;
    persons: { slug: string; name_en: string };
  }[]).map((r) => ({ year: r.year, month: r.month, title: r.title, person: r.persons }));

  return {
    date: today,
    figure,
    history: onThisDay((dated ?? []) as DatedPerson[], monthEntries, today),
  };
});

/** Slug of the person whose poll is featured today */
export const getPollOfDaySlug = cache(async () => {
  const { data } = await supabaseAdmin
    .from('person_polls')
    .select('id, persons!inner ( slug, is_published, is_controversial )')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .eq('persons.is_published', true)
    .order('id');
  const eligible = ((data ?? []) as unknown as { persons: { slug: string; is_controversial: boolean | null } }[])
    .filter((p) => !p.persons.is_controversial)
    .map((p) => p.persons.slug);
  return rotate(eligible, dayNumber(), 1)[0] ?? null;
});

export interface TriviaCard {
  id: string;
  title: string;
  body: string | null;
  person: FeedFigure;
}

export const getTriviaOfDay = cache(async (count = 6): Promise<TriviaCard[]> => {
  const { data } = await supabaseAdmin
    .from('person_highlights')
    .select('id, title, body, persons!inner ( slug, name_en, thumbnail, is_published )')
    .eq('kind', 'TRIVIA')
    .eq('is_deleted', false)
    .eq('persons.is_published', true)
    .order('id');
  const all = ((data ?? []) as unknown as { id: string; title: string; body: string | null; persons: FeedFigure }[]).map(
    (r) => ({ id: r.id, title: r.title, body: r.body, person: { slug: r.persons.slug, name_en: r.persons.name_en, thumbnail: r.persons.thumbnail } })
  );
  return rotate(all, dayNumber(), count);
});

// ─── Community activity (comments on person page items) ───

export interface ActivityItem {
  id: string;
  author: string | null;
  content: string;
  created_at: string;
  person: FeedFigure;
  target: string;
  href: string;
}

export const getRecentActivity = cache(async (limit = 5): Promise<ActivityItem[]> => {
  const { data, error } = await supabaseAdmin
    .from('person_item_comments')
    .select('id, content, created_at, user_id, target_type, target_key, persons!inner ( slug, name_en, thumbnail, is_published )')
    .eq('is_deleted', false)
    .eq('persons.is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data?.length) return [];

  const rows = data as unknown as {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    target_type: 'HIGHLIGHT' | 'GALLERY' | 'PORTRAYAL';
    target_key: string;
    persons: FeedFigure;
  }[];

  const highlightIds = rows.filter((r) => r.target_type === 'HIGHLIGHT').map((r) => r.target_key);
  const nodeIds = rows.filter((r) => r.target_type === 'PORTRAYAL').map((r) => r.target_key);
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const [highlights, nodes, profiles] = await Promise.all([
    highlightIds.length
      ? supabaseAdmin.from('person_highlights').select('id, title').in('id', highlightIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    nodeIds.length
      ? supabaseAdmin.from('nodes').select('id, title').in('id', nodeIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    supabaseAdmin.from('profiles').select('id, nickname').in('id', userIds),
  ]);
  const title = new Map([...(highlights.data ?? []), ...(nodes.data ?? [])].map((r) => [r.id, r.title]));
  const nick = new Map((profiles.data ?? []).map((p) => [p.id, p.nickname]));
  const TAB = { HIGHLIGHT: 'legacy', GALLERY: 'gallery', PORTRAYAL: 'related' } as const;

  return rows.map((r) => ({
    id: r.id,
    author: nick.get(r.user_id) ?? null,
    content: truncateText(r.content, 140),
    created_at: r.created_at,
    person: { slug: r.persons.slug, name_en: r.persons.name_en, thumbnail: r.persons.thumbnail },
    target: r.target_type === 'GALLERY' ? 'a photo' : title.get(r.target_key) ?? 'an item',
    href: `/persons/${r.persons.slug}/${TAB[r.target_type]}`,
  }));
});

// ─── Sidebar ───

export interface TrendingFigure extends FeedFigure {
  score: number;
}

/**
 * Figures with the most views + hearts in the last 7 days.
 * Returns an empty list until there is enough signal (the sidebar then shows "Figures to discover").
 */
export const getTrendingFigures = cache(async (limit = 5): Promise<TrendingFigure[]> => {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [views, hearts] = await Promise.all([
    supabaseAdmin.from('view_logs').select('target_id').eq('target_type', 'PERSON').gte('viewed_at', since).limit(5000),
    supabaseAdmin.from('person_item_likes').select('person_id').gte('created_at', since).limit(5000),
  ]);
  const score = new Map<string, number>();
  (views.data ?? []).forEach((v) => score.set(v.target_id, (score.get(v.target_id) ?? 0) + 1));
  (hearts.data ?? []).forEach((h) => score.set(h.person_id, (score.get(h.person_id) ?? 0) + 3));

  const top = Array.from(score.entries())
    .filter(([, s]) => s >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  if (top.length < 3) return [];

  const { data } = await supabaseAdmin
    .from('persons')
    .select('id, slug, name_en, thumbnail')
    .in('id', top.map(([id]) => id))
    .eq('is_published', true);
  const byId = new Map((data ?? []).map((p) => [p.id, p]));
  return top
    .map(([id, s]) => byId.get(id) && { ...byId.get(id)!, score: s })
    .filter((f): f is TrendingFigure & { id: string } => !!f);
});

/** Rotating "figures to discover" (portrait + editorial content first) */
export const getDiscoverFigures = cache(async (limit = 5): Promise<FeedFigure[]> => {
  const { data } = await supabaseAdmin
    .from('persons')
    .select('slug, name_en, thumbnail')
    .eq('is_deleted', false)
    .eq('is_published', true)
    .not('thumbnail', 'is', null)
    .order('slug');
  return rotate(data ?? [], dayNumber() + 7, limit);
});

export const getSiteStats = cache(async () => {
  const count = async (table: string, extra: (q: ReturnType<typeof base>) => ReturnType<typeof base>) =>
    (await extra(base(table))).count ?? 0;
  const base = (table: string) =>
    supabaseAdmin.from(table).select('id', { count: 'exact', head: true }).eq('is_deleted', false);
  const [figures, nodes, threads] = await Promise.all([
    count('persons', (q) => q.eq('is_published', true)),
    count('nodes', (q) => q.eq('is_published', true)),
    count('threads', (q) => q),
  ]);
  return { figures, nodes, threads };
});

// ─── Board header ───

export const getBoardInfo = cache(async (board: string) => {
  const ids = await getBoardPersonIds(board);
  if (!ids.length) return { figureCount: 0, threadCount: 0, latest: null, figures: [] as FeedFigure[] };
  const [{ data: figures }, { data: threads }] = await Promise.all([
    supabaseAdmin
      .from('persons')
      .select('slug, name_en, thumbnail, follow_count, view_count')
      .in('id', ids)
      .eq('is_deleted', false)
      .eq('is_published', true)
      .not('thumbnail', 'is', null)
      .order('view_count', { ascending: false })
      .limit(8),
    supabaseAdmin
      .from('threads')
      .select('created_at')
      .in('person_id', ids)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(2000),
  ]);
  return {
    figureCount: ids.length,
    threadCount: threads?.length ?? 0,
    /** newest thread — sitemap lastmod */
    latest: (threads?.[0]?.created_at as string | undefined) ?? null,
    figures: (figures ?? []).map((f) => ({ slug: f.slug, name_en: f.name_en, thumbnail: f.thumbnail })),
  };
});

/** Thread count and newest post for a topic (category) page */
export const getTopicInfo = cache(async (topic: string) => {
  const category = findTopic(topic)?.category;
  if (!category) return { threadCount: 0, latest: null as string | null };
  const [{ count }, { data: newest }] = await Promise.all([
    supabaseAdmin
      .from('threads')
      .select('id', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .eq('category', category),
    supabaseAdmin
      .from('threads')
      .select('created_at')
      .eq('is_deleted', false)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);
  return { threadCount: count ?? 0, latest: (newest?.[0]?.created_at as string | undefined) ?? null };
});
