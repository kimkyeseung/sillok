import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ThreadActions, ReplyActions, ReplyFormWrapper } from '@/components/thread/ThreadInteractions';
import ViewLogger from '@/components/thread/ViewLogger';
import ImageLightbox from '@/components/common/ImageLightbox';
import { normalizeThreadFigures, type ThreadFigure } from '@/lib/thread-figures';
import { DEFAULT_OG_IMAGE, stripMarkdown, truncateDescription, truncateTitle } from '@/lib/seo';
import { buildReplyTree } from '@/lib/feed';
import { breadcrumbJsonLd, discussionJsonLd } from '@/lib/jsonld';

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
       persons!threads_person_id_fkey ( id, slug, name_en, name_ko, thumbnail ),
       thread_images ( id, url, sort_order ),
       thread_persons ( person_id, is_primary, sort_order, persons ( id, slug, name_en, name_ko, thumbnail ) )`
    )
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
  return data ? normalizeThreadFigures(data) : data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const thread = await getThread(params.id);
  if (!thread) return {};

  const description = truncateDescription(
    thread.content ? stripMarkdown(thread.content) : thread.title
  );
  const title = truncateTitle(thread.title);

  const images = ((thread.thread_images as unknown as { url: string; sort_order: number }[]) ?? [])
    .sort((a, b) => a.sort_order - b.sort_order);
  const ogImage = images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/threads/${params.id}` },
    openGraph: {
      title: `${title} - Sillok`,
      description,
      type: 'article',
      url: `/threads/${params.id}`,
      publishedTime: thread.created_at,
      images: [ogImage ?? DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: [ogImage ?? DEFAULT_OG_IMAGE],
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
      `id, parent_id, content, depth, like_count, created_at,
       profiles!thread_replies_author_id_fkey ( nickname, avatar_url )`
    )
    .eq('thread_id', params.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(200);
  const replyTree = buildReplyTree((replies ?? []) as Array<Record<string, unknown> & { id: string; parent_id: string | null; created_at: string }>);

  const author = thread.profiles as Record<string, unknown>;
  const images = (thread.thread_images ?? []) as Array<Record<string, unknown>>;
  const figures = thread.figures ?? [];
  const authorName = (author?.nickname as string) ?? 'Anonymous';
  const firstImage = [...images].sort((a, b) => (a.sort_order as number) - (b.sort_order as number))[0];

  const jsonLd = [
    discussionJsonLd(
      {
        id: thread.id,
        title: thread.title,
        content: thread.content,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        author: (author?.nickname as string) ?? null,
        like_count: thread.like_count ?? 0,
        reply_count: thread.reply_count ?? 0,
        image: (firstImage?.url as string) ?? null,
        figures: figures.map((f: ThreadFigure) => ({ name: f.name_en ?? f.name_ko, slug: f.slug })),
      },
      replyTree.map(({ reply }) => ({
        id: reply.id,
        parent_id: reply.parent_id,
        content: reply.content as string,
        created_at: reply.created_at,
        like_count: (reply.like_count as number) ?? 0,
        author: ((reply.profiles as Record<string, unknown> | null)?.nickname as string) ?? null,
      }))
    ),
    breadcrumbJsonLd([
      { name: 'Home', path: '' },
      { name: 'Threads', path: '/threads' },
      { name: thread.title, path: `/threads/${thread.id}` },
    ]),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {/* Thread Content Card */}
      <ViewLogger threadId={params.id} />
      <article className="card-flat overflow-hidden">
        {/* Person Tag Bar */}
        {figures.length > 0 && (
          <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {figures.map((figure: ThreadFigure) => (
                <Link
                  key={figure.id}
                  href={`/persons/${figure.slug}`}
                  className={`inline-flex items-center gap-1.5 font-medium hover:text-brand-700 ${
                    figure.is_primary
                      ? 'text-sm text-brand-600'
                      : 'text-xs text-gray-500 hover:text-brand-600'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center rounded font-bold ${
                      figure.is_primary
                        ? 'h-5 w-5 bg-brand-100 text-[10px] text-brand-700'
                        : 'h-4 w-4 bg-gray-100 text-[9px] text-gray-500'
                    }`}
                  >
                    {(figure.name_en ?? figure.name_ko ?? '?').charAt(0)}
                  </span>
                  {figure.name_en ?? figure.name_ko}
                </Link>
              ))}
            </div>
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
            <ImageLightbox
              images={images.map((img) => ({
                id: img.id as string,
                url: img.url as string,
              }))}
            />
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
      <div id="comments" className="card-flat scroll-mt-20">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Comments {thread.reply_count}
          </h2>
        </div>

        <div className="divide-y divide-gray-50">
          {replyTree.map(({ reply, depth }) => {
            const replyAuthor = reply.profiles as Record<string, unknown> | null;
            const replyName = (replyAuthor?.nickname as string) ?? 'Anonymous';
            return (
              <div
                key={reply.id}
                id={`reply-${reply.id}`}
                className={`py-3.5 pr-5 ${depth > 0 ? 'border-l-2 border-gray-100' : ''}`}
                style={{ paddingLeft: depth > 0 ? '14px' : '20px', marginLeft: depth > 0 ? `${depth * 20}px` : undefined }}
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
                <ReplyActions threadId={params.id} replyId={reply.id} likeCount={reply.like_count as number} />
              </div>
            );
          })}
          {replyTree.length === 0 && (
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
