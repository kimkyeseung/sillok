import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: { id: string };
}

async function getThread(id: string) {
  const { data } = await supabaseAdmin
    .from('threads')
    .select(
      `*, profiles!threads_author_id_fkey ( nickname, avatar_url ),
       persons!threads_person_id_fkey ( slug, name_ko ),
       thread_images ( id, image_url, display_order )`
    )
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const thread = await getThread(params.id);
  if (!thread) return {};

  return {
    title: `${thread.title} - 실록`,
    description: thread.content?.slice(0, 160),
  };
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

export default async function ThreadDetailPage({ params }: Props) {
  const thread = await getThread(params.id);
  if (!thread) notFound();

  const { data: replies } = await supabaseAdmin
    .from('thread_replies')
    .select(
      `id, content, depth, like_count, created_at,
       profiles!thread_replies_author_id_fkey ( nickname, avatar_url )`
    )
    .eq('thread_id', params.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(50);

  const person = thread.persons as Record<string, unknown> | null;
  const author = thread.profiles as Record<string, unknown>;
  const images = (thread.thread_images ?? []) as Array<Record<string, unknown>>;
  const authorName = (author?.nickname as string) ?? '익명';

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* 스레드 본문 카드 */}
      <article className="card-flat overflow-hidden">
        {/* 인물 태그 바 */}
        {person && (
          <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-2.5">
            <Link
              href={`/persons/${person.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-100 text-[10px] font-bold text-brand-700">
                {(person.name_ko as string).charAt(0)}
              </span>
              {person.name_ko as string}
            </Link>
          </div>
        )}

        <div className="p-5">
          {/* 작성자 정보 */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {authorName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{authorName}</p>
              <p className="text-xs text-gray-400">{timeAgo(thread.created_at)}</p>
            </div>
          </div>

          {/* 제목 & 본문 */}
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            {thread.title}
          </h1>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {thread.content}
          </div>

          {/* 이미지 */}
          {images.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {images.map((img) => (
                <img
                  key={img.id as string}
                  src={img.image_url as string}
                  alt=""
                  className="max-h-64 rounded-lg object-cover"
                />
              ))}
            </div>
          )}

          {/* 영상 링크 */}
          {thread.video_url && (
            <a
              href={thread.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              영상 보기
            </a>
          )}

          {/* 통계 바 */}
          <div className="mt-5 flex items-center gap-5 border-t border-gray-100 pt-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {thread.like_count}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {thread.reply_count}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {thread.view_count}
            </span>
          </div>
        </div>
      </article>

      {/* 댓글 섹션 */}
      <div className="card-flat">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            댓글 {thread.reply_count}개
          </h2>
        </div>

        <div className="divide-y divide-gray-50">
          {(replies ?? []).map((reply: Record<string, unknown>) => {
            const replyAuthor = reply.profiles as Record<string, unknown> | null;
            const depth = Math.min((reply.depth as number) ?? 0, 3);
            const replyName = (replyAuthor?.nickname as string) ?? '익명';
            return (
              <div
                key={reply.id as string}
                className="px-5 py-3.5"
                style={{ paddingLeft: `${20 + depth * 24}px` }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                    {replyName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {replyName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {timeAgo(reply.created_at as string)}
                  </span>
                </div>
                <p className="mt-1.5 pl-[38px] text-sm leading-relaxed text-gray-700">
                  {reply.content as string}
                </p>
                <div className="mt-1 pl-[38px] text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {reply.like_count as number}
                  </span>
                </div>
              </div>
            );
          })}
          {(replies ?? []).length === 0 && (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-2 text-sm">아직 댓글이 없습니다</p>
              <p className="text-xs">첫 댓글을 남겨보세요!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
