import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import type { Metadata } from 'next';
import { websiteJsonLd } from '@/lib/jsonld';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export const dynamic = 'force-dynamic';

async function getHomeData() {
  const [
    { data: newPersons },
    { data: recentThreads },
    { data: latestArticles },
    { count: personCount },
    { count: threadCount },
  ] = await Promise.all([
    supabaseAdmin
      .from('persons')
      .select('id, slug, name_en, thumbnail, birth_year, death_year')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(8),
    supabaseAdmin
      .from('threads')
      .select(
        `id, title, like_count, reply_count, created_at,
         profiles!threads_author_id_fkey ( nickname )`
      )
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('articles')
      .select('id, slug, title, summary, thumbnail, tag, is_notice, created_at')
      .eq('is_deleted', false)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(3),
    supabaseAdmin
      .from('persons')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false),
    supabaseAdmin
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false),
  ]);

  return {
    newPersons: newPersons ?? [],
    recentThreads: recentThreads ?? [],
    latestArticles: latestArticles ?? [],
    stats: { persons: personCount ?? 0, threads: threadCount ?? 0 },
  };
}

export default async function HomePage() {
  const { newPersons, recentThreads, latestArticles, stats } = await getHomeData();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      {/* Main Feed */}
      <div className="space-y-6">
        {/* Hero Card */}
        <div className="card-flat overflow-hidden">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-10 text-center text-white">
            <h1 className="text-3xl font-bold tracking-tight">
              Korean Historical Figures Archive
            </h1>
            <p className="mt-2 text-brand-200">
              Connecting notable Korean figures from Dangun to the present as interconnected nodes
            </p>
            <div className="mt-5 flex justify-center gap-8">
              <div>
                <p className="text-2xl font-bold">{stats.persons.toLocaleString()}</p>
                <p className="text-xs text-brand-200">Figures</p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div>
                <p className="text-2xl font-bold">{stats.threads.toLocaleString()}</p>
                <p className="text-xs text-brand-200">Threads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Articles */}
        {latestArticles.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Latest Articles
              </h2>
              <Link
                href="/articles"
                className="text-xs text-brand-600 hover:text-brand-700"
              >
                View All &rarr;
              </Link>
            </div>

            {/* Featured Article (latest 1) */}
            <Link
              href={`/articles/${latestArticles[0].slug}`}
              className="card group block overflow-hidden"
            >
              {latestArticles[0].thumbnail ? (
                <div className="relative h-40 w-full overflow-hidden sm:h-48">
                  <img
                    src={latestArticles[0].thumbnail}
                    alt={latestArticles[0].title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    {latestArticles[0].is_notice && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                        Notice
                      </span>
                    )}
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-600 backdrop-blur-sm">
                      {latestArticles[0].tag}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
                  <DocumentIcon />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-base font-bold text-gray-900 transition-colors group-hover:text-brand-600 line-clamp-2">
                  {latestArticles[0].title}
                </h3>
                {latestArticles[0].summary && (
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500 line-clamp-2">
                    {latestArticles[0].summary}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  {timeAgo(latestArticles[0].created_at)}
                </p>
              </div>
            </Link>

            {/* Rest Articles (compact 2-col grid) */}
            {latestArticles.length > 1 && (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {latestArticles.slice(1, 3).map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="card group flex gap-3 p-3"
                  >
                    {article.thumbnail ? (
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        className="h-16 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <DocumentIcon />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        {article.is_notice && (
                          <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-600">
                            Notice
                          </span>
                        )}
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-600">
                          {article.tag}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-gray-900 transition-colors group-hover:text-brand-600 line-clamp-2">
                        {article.title}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        {timeAgo(article.created_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Threads Feed */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Recent Threads
            </h2>
            <Link href="/threads/new" className="btn-primary text-xs">
              Write
            </Link>
          </div>
          <div className="card-flat divide-y divide-gray-100">
            {recentThreads.map((thread: Record<string, unknown>) => {
              const profile = thread.profiles as Record<string, unknown> | null;
              return (
                <Link
                  key={thread.id as string}
                  href={`/threads/${thread.id}`}
                  className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                    {((profile?.nickname as string) ?? '?').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {thread.title as string}
                    </p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                      <span>{(profile?.nickname as string) ?? 'Anonymous'}</span>
                      <span className="flex items-center gap-0.5">
                        <HeartIcon />
                        {thread.like_count as number}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <ChatIcon />
                        {thread.reply_count as number}
                      </span>
                      <span>
                        {timeAgo(thread.created_at as string)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
            {recentThreads.length === 0 && (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <ChatBubbleIcon />
                <p className="mt-2 text-sm">No threads yet</p>
                <p className="text-xs">Be the first to start a thread!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        {/* Recently Added Figures */}
        <div className="card-flat p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recently Added</h2>
            <Link
              href="/persons"
              className="text-xs text-brand-600 hover:text-brand-700"
            >
              View All &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {newPersons.map((person) => (
              <Link
                key={person.id}
                href={`/persons/${person.slug}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
              >
                {person.thumbnail ? (
                  <img
                    src={person.thumbnail}
                    alt={person.name_en}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-500">
                    {person.name_en.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {person.name_en}
                  </p>
                  {(person.birth_year || person.death_year) && (
                    <p className="text-xs text-gray-400">
                      {person.birth_year ?? '?'} ~ {person.death_year ?? '?'}
                    </p>
                  )}
                </div>
              </Link>
            ))}
            {newPersons.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">
                No figures registered yet
              </p>
            )}
          </div>
        </div>

        {/* About Sillok */}
        <div className="card-flat p-4">
          <h2 className="text-sm font-semibold text-gray-900">About Sillok</h2>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Sillok is a community archive for exploring and discussing Korean historical figures.
            Connect figures through relationship graphs and share your thoughts in threads.
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/persons" className="btn-primary text-xs">
              Explore
            </Link>
            <Link href="/search" className="btn-secondary text-xs">
              Search
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-2 text-xs text-gray-400">
          <p>&copy; 2026 Sillok. Korean Historical Figures Archive.</p>
          <div className="mt-1 flex gap-3">
            <span className="cursor-pointer hover:text-gray-600">Terms of Service</span>
            <span className="cursor-pointer hover:text-gray-600">Privacy Policy</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US');
}

function HeartIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="h-8 w-8 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}
