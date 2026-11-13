import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import type { Metadata } from 'next';
import RankingSection, { type RankedPerson } from '@/components/ranking/RankingSection';
import FigureGrid from '@/components/person/FigureGrid';
import HubLinks from '@/components/person/HubLinks';
import { getPrimaryFieldTag } from '@/lib/person-utils';
import { sanitizeSearchTerm } from '@/lib/search';
import { tagLabel } from '@/lib/tags';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';
import { getPersonDirectory } from '@/lib/person-directory-data';
import { groupByInitial, hubCounts, lifespan } from '@/lib/person-directory';

export const metadata: Metadata = {
  title: 'Figures',
  description: 'Explore Korean historical figures from Dangun to the present — kings, scholars, generals, artists, and modern icons.',
  alternates: { canonical: '/persons' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Figures | Sillok',
    description: 'Explore Korean historical figures from Dangun to the present.',
  },
  twitter: {
    images: [DEFAULT_OG_IMAGE],
    card: 'summary',
    title: 'Figures | Sillok',
    description: 'Explore Korean historical figures from Dangun to the present.',
  },
};

export const dynamic = 'force-dynamic';
// 'force-no-store' would also bypass the shared directory cache on every request
export const fetchCache = 'default-no-store';

interface SearchParams {
  q?: string;
}

export default async function PersonsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let query = supabaseAdmin
    .from('persons')
    .select(
      'id, slug, name_ko, name_en, name_hanja, birth_year, death_year, thumbnail, summary, person_tags ( tags ( id, name_en, type ) )'
    )
    .eq('is_deleted', false)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(40);

  const q = sanitizeSearchTerm(searchParams.q ?? '').slice(0, 200);
  if (q) {
    query = query.or(`name_en.ilike.%${q}%,name_ko.ilike.%${q}%`);
  }

  const [{ data: persons }, directory] = await Promise.all([query, getPersonDirectory()]);
  const index = q ? [] : groupByInitial(directory);

  // ── Trending Figures: gravity decay scoring ──
  // score = Σ (1 + replies*0.5 + likes) / (age_days + 2)^1.5
  const now = Date.now();
  const GRAVITY = 1.5;
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentThreads } = await supabaseAdmin
    .from('threads')
    .select('id, person_id, reply_count, like_count, created_at')
    .eq('is_deleted', false)
    .gte('created_at', thirtyDaysAgo);

  const scoreMap = new Map<
    string,
    { score: number; threadCount: number; hotCount: number; likeCount: number }
  >();

  for (const thread of recentThreads ?? []) {
    const pid = thread.person_id;
    if (!scoreMap.has(pid)) {
      scoreMap.set(pid, { score: 0, threadCount: 0, hotCount: 0, likeCount: 0 });
    }
    const entry = scoreMap.get(pid)!;
    const ageDays = (now - new Date(thread.created_at).getTime()) / (24 * 60 * 60 * 1000);
    const replyCount = thread.reply_count ?? 0;
    const likeCount = thread.like_count ?? 0;
    const points = 1 + replyCount * 0.5 + likeCount;
    const decay = Math.pow(ageDays + 2, GRAVITY);
    entry.score += points / decay;
    entry.threadCount += 1;
    if (replyCount >= 10) entry.hotCount += 1;
    entry.likeCount += likeCount;
  }

  const ranked = Array.from(scoreMap.entries())
    .filter(([, v]) => v.score > 0.01)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10);

  const rankedPersonIds = ranked.map(([pid]) => pid);
  let rankedPersons: RankedPerson[] = [];

  if (rankedPersonIds.length > 0) {
    const { data: rPersons } = await supabaseAdmin
      .from('persons')
      .select(
        'id, slug, name_ko, name_en, name_hanja, birth_year, death_year, thumbnail, person_tags ( tags ( name_en, name_ko, type ) )'
      )
      .in('id', rankedPersonIds)
      .eq('is_deleted', false)
      .eq('is_published', true);

    const personMap = new Map((rPersons ?? []).map((p) => [p.id, p]));
    rankedPersons = ranked
      .map(([pid, stats], idx) => {
        const person = personMap.get(pid);
        if (!person) return null;
        const { person_tags, ...personData } = person as typeof person & {
          person_tags: { tags: { name_en: string | null; name_ko: string; type: string } | null }[];
        };
        const tags = (person_tags ?? [])
          .map((pt) => {
            const tag = pt.tags as unknown as { name_en: string | null; name_ko: string } | null;
            return tag?.name_en ? tagLabel(tag.name_en) : tag?.name_ko;
          })
          .filter(Boolean) as string[];
        return {
          rank: idx + 1,
          ...personData,
          tags,
          thread_count: stats.threadCount,
          hot_thread_count: stats.hotCount,
          like_count: stats.likeCount,
        } as RankedPerson;
      })
      .filter(Boolean) as RankedPerson[];
  }

  return (
    <div>
      {/* Ranking Section */}
      <RankingSection initialPersons={rankedPersons} />

      {/* Divider */}
      <div className="my-8 border-t border-gray-200" />

      {/* All Figures Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{q ? 'Search Results' : 'All Figures'}</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {q ? `Figures matching "${q}"` : `${directory.length} Korean historical figures`}
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            type="text"
            placeholder="Search by name..."
            defaultValue={searchParams.q}
            className="input max-w-xs"
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Era / field hubs */}
      <div className="mb-6">
        <HubLinks counts={hubCounts(directory)} />
      </div>

      {!q && (persons ?? []).length > 0 && (
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Recently added</h3>
      )}

      {/* Grid */}
      <FigureGrid
        figures={(persons ?? []).map((person) => ({
          ...person,
          fieldTag: getPrimaryFieldTag(
            ((person as any).person_tags ?? []).map((pt: any) => pt.tags).filter(Boolean)
          ),
        }))}
      />

      {/* A–Z index: a crawlable link to every figure (the grid above shows only the newest) */}
      {index.length > 0 && (
        <section aria-labelledby="figures-az" className="mt-10">
          <h3 id="figures-az" className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            A–Z index
          </h3>
          <div className="space-y-5">
            {index.map((group) => (
              <div key={group.letter} className="flex gap-4">
                <span className="w-6 shrink-0 text-lg font-bold text-brand-600">{group.letter}</span>
                <ul className="grid flex-1 grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                  {group.persons.map((p) => (
                    <li key={p.id} className="truncate text-sm">
                      <Link href={`/persons/${p.slug}`} prefetch={false} className="text-gray-800 hover:text-brand-600">
                        {p.name_en}
                      </Link>
                      {lifespan(p) && <span className="ml-1.5 text-xs text-gray-400">{lifespan(p)}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {(persons ?? []).length === 0 && (
        <div className="card-flat flex flex-col items-center py-16">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">
            {searchParams.q
              ? `No results found for "${searchParams.q}"`
              : 'No figures registered yet'}
          </p>
          <p className="text-xs text-gray-400">
            {searchParams.q ? 'Try a different search term' : 'Figures will be added soon'}
          </p>
        </div>
      )}
    </div>
  );
}
