import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ThreadActions, ReplyActions, ReplyFormWrapper } from '@/components/thread/ThreadInteractions';
import ViewLogger from '@/components/thread/ViewLogger';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { id: string };
}

async function getThread(id: string) {
  const { data } = await supabaseAdmin
    .from('threads')
    .select(
      `*, profiles!threads_author_id_fkey ( nickname, avatar_url ),
       persons!threads_person_id_fkey ( slug, name_en ),
       thread_images ( id, url, sort_order )`
    )
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const thread = await getThread(params.id);
  if (!thread) return {};

  const description = thread.content?.slice(0, 160) ?? thread.title;

  const images = ((thread.thread_images as unknown as { url: string; sort_order: number }[]) ?? [])
    .sort((a, b) => a.sort_order - b.sort_order);
  const ogImage = images[0]?.url;

  return {
    title: `${thread.title}`,
    description,
    alternates: { canonical: `/threads/${params.id}` },
    openGraph: {
      title: `${thread.title} - Sillok`,
      description,
      type: 'article',
      ...(ogImage && { images: [ogImage] }),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: thread.title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
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

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
  } catch { /* ignore */ }
  return null;
}

function VideoEmbed({ url }: { url: string }) {
  const ytId = getYouTubeId(url);

  if (ytId) {
    return (
      <div className="mt-4 overflow-hidden rounded-lg">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}`}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
    );
  }

  // Fallback for non-YouTube (Naver TV etc.)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Watch Video
    </a>
  );
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
  const authorName = (author?.nickname as string) ?? 'Anonymous';

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Thread Content Card */}
      <ViewLogger threadId={params.id} />
      <article className="card-flat overflow-hidden">
        {/* Person Tag Bar */}
        {person && (
          <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-2.5">
            <Link
              href={`/persons/${person.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-100 text-[10px] font-bold text-brand-700">
                {(person.name_en as string).charAt(0)}
              </span>
              {person.name_en as string}
            </Link>
          </div>
        )}

        <div className="p-5">
          {/* Author Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {author?.avatar_url ? (
                <Image src={author.avatar_url as string} alt="" width={40} height={40} className="h-full w-full object-cover" />
              ) : (
                authorName.charAt(0)
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{authorName}</p>
              <p className="text-xs text-gray-400">{timeAgo(thread.created_at)}</p>
            </div>
          </div>

          {/* Title & Body */}
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            {thread.title}
          </h1>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {thread.content}
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {images.map((img) => (
                <div key={img.id as string} className="relative h-64 min-w-[200px] shrink-0">
                  <Image
                    src={img.url as string}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 80vw, 300px"
                    className="rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Video Embed */}
          {thread.video_url && (
            <VideoEmbed url={thread.video_url} />
          )}

          {/* Interaction Bar */}
          <ThreadActions
            threadId={thread.id}
            authorId={thread.author_id}
            likeCount={thread.like_count}
            replyCount={thread.reply_count}
            viewCount={thread.view_count}
          />
        </div>
      </article>

      {/* Comments Section */}
      <div className="card-flat">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Comments {thread.reply_count}
          </h2>
        </div>

        <div className="divide-y divide-gray-50">
          {(replies ?? []).map((reply: Record<string, unknown>) => {
            const replyAuthor = reply.profiles as Record<string, unknown> | null;
            const depth = Math.min((reply.depth as number) ?? 0, 3);
            const replyName = (replyAuthor?.nickname as string) ?? 'Anonymous';
            return (
              <div
                key={reply.id as string}
                className="px-5 py-3.5"
                style={{ paddingLeft: `${20 + depth * 24}px` }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                    {replyAuthor?.avatar_url ? (
                      <Image src={replyAuthor.avatar_url as string} alt="" width={28} height={28} className="h-full w-full object-cover" />
                    ) : (
                      replyName.charAt(0)
                    )}
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
                <ReplyActions replyId={reply.id as string} likeCount={reply.like_count as number} />
              </div>
            );
          })}
          {(replies ?? []).length === 0 && (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-2 text-sm">No comments yet</p>
              <p className="text-xs">Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Comment Form */}
        <ReplyFormWrapper threadId={params.id} />
      </div>
    </div>
  );
}
