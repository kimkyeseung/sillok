import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CURATED_NODES_FILTER } from '@/lib/heritage';
import { buildLinkTargets, createLinker, type Linker, type LinkSource, type LinkTarget } from '@/lib/autolink';

const PAGE = 1000;

/** Supabase returns at most 1,000 rows per request — page through everything */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(`[autolink] fetch failed: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function loadLinkTargets(): Promise<LinkTarget[]> {
  const [persons, nodes] = await Promise.all([
    fetchAll<{ slug: string; name_en: string | null; aliases_en: string[] | null }>((from, to) =>
      supabaseAdmin
        .from('persons')
        .select('slug, name_en, aliases_en')
        .eq('is_deleted', false)
        .eq('is_published', true)
        .order('id')
        .range(from, to)
    ),
    // Events and groups ("Imjin War", "Jiphyeonjeon"); artifact titles are too generic to auto-link
    fetchAll<{ slug: string; title: string }>((from, to) =>
      supabaseAdmin
        .from('nodes')
        .select('slug, title')
        .in('node_type', ['EVENT', 'GROUP'])
        .eq('is_deleted', false)
        .eq('is_published', true)
        .or(CURATED_NODES_FILTER)
        .order('id')
        .range(from, to)
    ),
  ]);
  const sources: LinkSource[] = [
    ...persons.map((p) => ({ names: [p.name_en, ...(p.aliases_en ?? [])], href: `/persons/${p.slug}` })),
    ...nodes.map((n) => ({ names: [n.title], href: `/nodes/${n.slug}` })),
  ];
  return buildLinkTargets(sources);
}

/** Link targets for editorial text — shares the age-flow tag so admin writes refresh it */
export const getLinkTargets = unstable_cache(loadLinkTargets, ['autolink-targets'], {
  revalidate: 3600,
  tags: ['age-flow'],
});

/** A linker for one page; never links the page itself. Without targets (DB error) text stays plain. */
export async function getPageLinker(selfHref: string): Promise<Linker> {
  const targets = await getLinkTargets().catch((err) => {
    console.error('[autolink] targets unavailable:', err);
    return [] as LinkTarget[];
  });
  return createLinker(targets, { exclude: [selfHref] });
}
