import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TAB_MIN_ITEMS } from '@/lib/person-sections';

// Regenerate hourly — otherwise the sitemap is frozen at build time
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sillok.kr';

  const [
    { data: persons },
    { data: nodes },
    { data: articles },
    { data: threads },
    tabCounts,
  ] = await Promise.all([
    supabaseAdmin
      .from('persons')
      .select('id, slug, updated_at')
      .eq('is_deleted', false)
      .eq('is_published', true),
    supabaseAdmin
      .from('nodes')
      .select('slug, updated_at')
      .eq('is_deleted', false)
      .eq('is_published', true),
    supabaseAdmin
      .from('articles')
      .select('slug, updated_at')
      .eq('is_deleted', false)
      .eq('is_published', true),
    supabaseAdmin
      .from('threads')
      .select('id, updated_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1000),
    getPersonTabCounts(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/persons`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/threads`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/nodes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/age-flow`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  const personPages: MetadataRoute.Sitemap = (persons ?? []).flatMap((p) => [
    {
      url: `${baseUrl}/persons/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    // Tab pages with enough content to stand on their own (gallery/stats excluded)
    ...PERSON_TABS.filter((tab) => (tabCounts[tab].get(p.id) ?? 0) >= TAB_MIN_ITEMS[tab]).map(
      (tab) => ({
        url: `${baseUrl}/persons/${p.slug}/${tab}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })
    ),
  ]);

  const nodePages: MetadataRoute.Sitemap = (nodes ?? []).map((n) => ({
    url: `${baseUrl}/nodes/${n.slug}`,
    lastModified: new Date(n.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${baseUrl}/articles/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const threadPages: MetadataRoute.Sitemap = (threads ?? []).map((t) => ({
    url: `${baseUrl}/threads/${t.id}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...personPages,
    ...nodePages,
    ...articlePages,
    ...threadPages,
  ];
}

const PERSON_TABS = ['timeline', 'relations', 'related', 'threads'] as const;

/** Per-person item counts for each indexable tab, from one query per table */
async function getPersonTabCounts() {
  const [timeline, relations, links, threads, threadPersons] = await Promise.all([
    fetchAll<{ person_id: string }>((from, to) =>
      supabaseAdmin.from('person_timeline').select('person_id').order('id').range(from, to)
    ),
    fetchAll<{ from_person_id: string; to_person_id: string }>((from, to) =>
      supabaseAdmin
        .from('person_relations')
        .select('from_person_id, to_person_id')
        .eq('is_approved', true)
        .order('id')
        .range(from, to)
    ),
    fetchAll<{ person_id: string }>((from, to) =>
      supabaseAdmin
        .from('person_node_links')
        .select('person_id, nodes!inner ( is_deleted )')
        .eq('nodes.is_deleted', false)
        .order('id')
        .range(from, to)
    ),
    fetchAll<{ id: string; person_id: string }>((from, to) =>
      supabaseAdmin.from('threads').select('id, person_id').eq('is_deleted', false).order('id').range(from, to)
    ),
    fetchAll<{ thread_id: string; person_id: string }>((from, to) =>
      supabaseAdmin.from('thread_persons').select('thread_id, person_id').order('thread_id').order('person_id').range(from, to)
    ),
  ]);

  const tally = (ids: string[]) => {
    const m = new Map<string, number>();
    ids.forEach((id) => m.set(id, (m.get(id) ?? 0) + 1));
    return m;
  };

  // A thread counts once per person whether primary or referenced
  const liveThreads = new Set(threads.map((t) => t.id));
  const threadKeys = new Set([
    ...threads.map((t) => `${t.person_id}:${t.id}`),
    ...threadPersons
      .filter((t) => liveThreads.has(t.thread_id))
      .map((t) => `${t.person_id}:${t.thread_id}`),
  ]);

  return {
    timeline: tally(timeline.map((r) => r.person_id)),
    relations: tally(relations.flatMap((r) => [r.from_person_id, r.to_person_id])),
    related: tally(links.map((r) => r.person_id)),
    threads: tally(Array.from(threadKeys).map((k) => k.split(':')[0])),
  };
}

/** Supabase returns at most 1,000 rows per request — page through everything */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>
): Promise<T[]> {
  const size = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error || !data) break;
    rows.push(...(data as T[]));
    if (data.length < size) break;
  }
  return rows;
}
