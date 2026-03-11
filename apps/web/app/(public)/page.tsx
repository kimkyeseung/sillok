import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getHomeData() {
  const [
    { data: newPersons },
    { data: recentThreads },
    { count: personCount },
    { count: threadCount },
  ] = await Promise.all([
    supabaseAdmin
      .from('persons')
      .select('id, slug, name_ko, thumbnail, birth_year, death_year')
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
    stats: { persons: personCount ?? 0, threads: threadCount ?? 0 },
  };
}

export default async function HomePage() {
  const { newPersons, recentThreads, stats } = await getHomeData();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* 메인 피드 */}
      <div className="space-y-6">
        {/* Hero Card */}
        <div className="card-flat overflow-hidden">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-10 text-center text-white">
            <h1 className="text-3xl font-bold tracking-tight">
              한국 인물 아카이브
            </h1>
            <p className="mt-2 text-brand-200">
              단군부터 현재까지, 한국의 이름있는 인물을 하나의 노드로 연결합니다
            </p>
            <div className="mt-5 flex justify-center gap-8">
              <div>
                <p className="text-2xl font-bold">{stats.persons.toLocaleString()}</p>
                <p className="text-xs text-brand-200">등록 인물</p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div>
                <p className="text-2xl font-bold">{stats.threads.toLocaleString()}</p>
                <p className="text-xs text-brand-200">스레드</p>
              </div>
            </div>
          </div>
        </div>

        {/* 최근 스레드 피드 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              최근 스레드
            </h2>
            <Link href="/threads/new" className="btn-primary text-xs">
              글쓰기
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
                      <span>{(profile?.nickname as string) ?? '익명'}</span>
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
                <p className="mt-2 text-sm">아직 스레드가 없습니다</p>
                <p className="text-xs">첫 스레드를 작성해보세요!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 사이드바 */}
      <aside className="space-y-6">
        {/* 최근 등록 인물 */}
        <div className="card-flat p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">최근 등록 인물</h2>
            <Link
              href="/persons"
              className="text-xs text-brand-600 hover:text-brand-700"
            >
              전체 보기 &rarr;
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
                    alt={person.name_ko}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-500">
                    {person.name_ko.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {person.name_ko}
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
                등록된 인물이 없습니다
              </p>
            )}
          </div>
        </div>

        {/* 실록 소개 */}
        <div className="card-flat p-4">
          <h2 className="text-sm font-semibold text-gray-900">실록에 대해</h2>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            실록은 한국 역사 인물을 탐색하고 토론하는 커뮤니티 아카이브입니다.
            인물 간 관계를 그래프로 연결하고, 스레드에서 자유롭게 의견을 나눌 수 있습니다.
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/persons" className="btn-primary text-xs">
              인물 탐색
            </Link>
            <Link href="/search" className="btn-secondary text-xs">
              검색하기
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-2 text-xs text-gray-400">
          <p>&copy; 2026 실록. 한국 인물 아카이브.</p>
          <div className="mt-1 flex gap-3">
            <span className="cursor-pointer hover:text-gray-600">이용약관</span>
            <span className="cursor-pointer hover:text-gray-600">개인정보처리방침</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
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

function ChatBubbleIcon() {
  return (
    <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}
