import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import FollowButton from '@/components/person/FollowButton';

interface Props {
  params: { slug: string };
}

async function getPerson(slug: string) {
  const { data } = await supabaseAdmin
    .from('persons')
    .select('*')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const person = await getPerson(params.slug);
  if (!person) return {};
  return {
    title: `${person.name_ko} - 실록`,
    description: person.description?.slice(0, 160) ?? `${person.name_ko} 인물 정보`,
    openGraph: {
      title: `${person.name_ko} - 실록`,
      images: person.thumbnail ? [person.thumbnail] : [],
    },
  };
}

export default async function PersonDetailPage({ params }: Props) {
  const person = await getPerson(params.slug);
  if (!person) notFound();

  const [{ data: timeline }, { data: threads }, { data: tags }] =
    await Promise.all([
      supabaseAdmin
        .from('person_timeline')
        .select('id, year, title, description')
        .eq('person_id', person.id)
        .order('year', { ascending: true }),
      supabaseAdmin
        .from('threads')
        .select(
          `id, title, like_count, reply_count, created_at,
           profiles!threads_author_id_fkey ( nickname )`
        )
        .eq('person_id', person.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('person_tags')
        .select('tags!inner ( id, name, category )')
        .eq('person_id', person.id),
    ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* 메인 */}
      <div className="space-y-6">
        {/* 프로필 카드 */}
        <div className="card-flat overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-brand-500 to-brand-700" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex items-end gap-5">
              {person.thumbnail ? (
                <img
                  src={person.thumbnail}
                  alt={person.name_ko}
                  className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-brand-400 to-brand-600 text-3xl font-bold text-white shadow-md">
                  {person.name_ko.charAt(0)}
                </div>
              )}
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {person.name_ko}
                </h1>
                {person.name_hanja && (
                  <p className="text-sm text-gray-500">{person.name_hanja}</p>
                )}
              </div>
            </div>

            {/* 태그 & 메타 */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(person.birth_year || person.death_year) && (
                <span className="badge-gray">
                  {person.birth_year ?? '?'} ~ {person.death_year ?? '?'}
                </span>
              )}
              {(tags ?? []).map((pt: Record<string, unknown>) => {
                const tag = pt.tags as Record<string, unknown>;
                return (
                  <span key={tag.id as string} className="badge-brand">
                    {tag.name as string}
                  </span>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-6 text-sm">
              <div>
                <span className="font-semibold text-gray-900">
                  {(person.view_count ?? 0).toLocaleString()}
                </span>
                <span className="ml-1 text-gray-500">조회</span>
              </div>
              <FollowButton targetType="person" targetId={person.id} initialCount={person.follow_count ?? 0} />
            </div>
          </div>
        </div>

        {/* 설명 */}
        {person.description && (
          <div className="card-flat p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
              소개
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {person.description}
            </p>
          </div>
        )}

        {/* 스레드 */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            스레드
          </h2>
          <div className="card-flat divide-y divide-gray-100">
            {(threads ?? []).map((thread: Record<string, unknown>) => {
              const profile = thread.profiles as Record<string, unknown> | null;
              return (
                <Link
                  key={thread.id as string}
                  href={`/threads/${thread.id}`}
                  className="block px-4 py-3.5 transition-colors hover:bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {thread.title as string}
                  </p>
                  <div className="mt-1 flex gap-3 text-xs text-gray-400">
                    <span>{(profile?.nickname as string) ?? '익명'}</span>
                    <span>좋아요 {thread.like_count as number}</span>
                    <span>댓글 {thread.reply_count as number}</span>
                  </div>
                </Link>
              );
            })}
            {(threads ?? []).length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                아직 스레드가 없습니다
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 사이드바 — 타임라인 */}
      <aside className="space-y-6">
        {timeline && timeline.length > 0 && (
          <div className="card-flat p-4">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              생애 타임라인
            </h2>
            <div className="relative space-y-4 pl-5 before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-8px)] before:w-0.5 before:bg-brand-100">
              {timeline.map((event) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full border-2 border-brand-400 bg-white" />
                  <p className="text-xs font-semibold text-brand-600">
                    {event.year}년
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    {event.title}
                  </p>
                  {event.description && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
