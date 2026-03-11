import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import FollowButton from '@/components/person/FollowButton';
import VoteTodayButton from '@/components/person/VoteTodayButton';
import RelationSuggestForm from '@/components/person/RelationSuggestForm';
import PersonRequestButton from '@/components/person/PersonRequestButton';

interface Props {
  params: { slug: string };
}

const RELATION_TYPE_LABELS: Record<string, string> = {
  FAMILY: '가족',
  TEACHER: '스승/제자',
  ALLY: '동맹',
  RIVAL: '라이벌',
  LORD_VASSAL: '군신',
  INFLUENCE: '영향',
};

const RELATION_TYPE_COLORS: Record<string, string> = {
  FAMILY: 'bg-rose-50 text-rose-700',
  TEACHER: 'bg-blue-50 text-blue-700',
  ALLY: 'bg-green-50 text-green-700',
  RIVAL: 'bg-red-50 text-red-700',
  LORD_VASSAL: 'bg-purple-50 text-purple-700',
  INFLUENCE: 'bg-amber-50 text-amber-700',
};

const NODE_TYPE_LABELS: Record<string, string> = {
  ARTIFACT: '유물',
  MEDIA: '미디어',
  EVENT: '사건',
};

const NODE_TYPE_COLORS: Record<string, string> = {
  ARTIFACT: 'bg-amber-50 text-amber-700',
  MEDIA: 'bg-blue-50 text-blue-700',
  EVENT: 'bg-purple-50 text-purple-700',
};

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

  const [
    { data: timeline },
    { data: threads },
    { data: tags },
    { data: nodeLinks },
  ] = await Promise.all([
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
      .select('tags!inner ( id, name, type )')
      .eq('person_id', person.id),
    supabaseAdmin
      .from('person_node_links')
      .select(
        `id, link_type,
         nodes!inner ( id, slug, node_type, title, thumbnail )`
      )
      .eq('person_id', person.id)
      .eq('nodes.is_deleted', false),
  ]);

  // Relations — fetch via RPC
  let relations: {
    relation_id: string;
    other_person_id: string;
    rel_type: string;
    direction: string;
    rel_description: string | null;
  }[] = [];
  let relatedPersons: Record<
    string,
    {
      id: string;
      slug: string;
      name_ko: string;
      thumbnail: string | null;
      birth_year: number | null;
      death_year: number | null;
    }
  > = {};

  const { data: relData } = await supabaseAdmin.rpc('get_person_relations', {
    p_id: person.id,
  });

  if (relData && relData.length > 0) {
    relations = relData;
    const otherIds = relData.map(
      (r: { other_person_id: string }) => r.other_person_id
    );
    const { data: relPersons } = await supabaseAdmin
      .from('persons')
      .select('id, slug, name_ko, thumbnail, birth_year, death_year')
      .in('id', otherIds)
      .eq('is_deleted', false);

    relatedPersons = Object.fromEntries(
      (relPersons ?? []).map((p) => [p.id, p])
    );
  }

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

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <div>
                <span className="font-semibold text-gray-900">
                  {(person.view_count ?? 0).toLocaleString()}
                </span>
                <span className="ml-1 text-gray-500">조회</span>
              </div>
              <FollowButton
                targetType="person"
                targetId={person.id}
                initialCount={person.follow_count ?? 0}
              />
              <VoteTodayButton personSlug={params.slug} />
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

        {/* 인물 관계 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              인물 관계
            </h2>
            <RelationSuggestForm
              personId={person.id}
              personName={person.name_ko}
            />
          </div>
          {relations.length > 0 ? (
            <div className="card-flat divide-y divide-gray-100">
              {relations.map((rel) => {
                const other = relatedPersons[rel.other_person_id];
                if (!other) return null;
                return (
                  <Link
                    key={rel.relation_id}
                    href={`/persons/${other.slug}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    {other.thumbnail ? (
                      <img
                        src={other.thumbnail}
                        alt={other.name_ko}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                        {other.name_ko.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {other.name_ko}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            RELATION_TYPE_COLORS[rel.rel_type] ??
                            'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {RELATION_TYPE_LABELS[rel.rel_type] ?? rel.rel_type}
                        </span>
                      </div>
                      {rel.rel_description && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {rel.rel_description}
                        </p>
                      )}
                    </div>
                    <svg
                      className="h-4 w-4 shrink-0 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="card-flat py-8 text-center">
              <p className="text-sm text-gray-400">
                아직 등록된 관계가 없습니다
              </p>
            </div>
          )}
        </div>

        {/* 연결된 노드 (유물/미디어/사건) */}
        {(nodeLinks ?? []).length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              관련 유물 · 미디어 · 사건
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(nodeLinks ?? []).map((link: Record<string, unknown>) => {
                const node = link.nodes as Record<string, unknown>;
                const nodeType = node.node_type as string;
                return (
                  <Link
                    key={link.id as string}
                    href={`/nodes/${node.slug}`}
                    className="card-flat flex items-center gap-3 p-3 transition-colors hover:bg-gray-50"
                  >
                    {node.thumbnail ? (
                      <img
                        src={node.thumbnail as string}
                        alt={node.title as string}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-lg">
                        {nodeType === 'ARTIFACT'
                          ? '🏛'
                          : nodeType === 'MEDIA'
                            ? '🎬'
                            : '📅'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            NODE_TYPE_COLORS[nodeType] ??
                            'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {NODE_TYPE_LABELS[nodeType] ?? nodeType}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-gray-900">
                        {node.title as string}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 스레드 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              스레드
            </h2>
            <Link
              href={`/threads/new?person_id=${person.id}`}
              className="btn-ghost text-xs"
            >
              <svg
                className="mr-1 inline h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              글쓰기
            </Link>
          </div>
          <div className="card-flat divide-y divide-gray-100">
            {(threads ?? []).map((thread: Record<string, unknown>) => {
              const profile = thread.profiles as Record<
                string,
                unknown
              > | null;
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

      {/* 사이드바 */}
      <aside className="space-y-6">
        {/* 타임라인 */}
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

        {/* 인물 추가 요청 */}
        <div className="card-flat p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            인물이 없나요?
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            찾는 인물이 실록에 등록되어 있지 않다면 추가를 요청해주세요.
          </p>
          <PersonRequestButton />
        </div>
      </aside>
    </div>
  );
}
