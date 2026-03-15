import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NodeActions, CommentActions, CommentFormWrapper } from '@/components/thread/NodeInteractions';

interface Props {
  params: { slug: string };
}

async function getNode(slug: string) {
  const { data } = await supabaseAdmin
    .from('nodes')
    .select('*')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const node = await getNode(params.slug);
  if (!node) return {};

  return {
    title: `${node.title} - Sillok`,
    description: node.description?.slice(0, 160) ?? `${node.title} info`,
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

export default async function NodeDetailPage({ params }: Props) {
  const node = await getNode(params.slug);
  if (!node) notFound();

  const { data: comments } = await supabaseAdmin
    .from('node_comments')
    .select(
      `id, content, like_count, created_at,
       profiles!node_comments_author_id_fkey ( nickname, avatar_url )`
    )
    .eq('node_id', node.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20);

  const typeLabel: Record<string, string> = {
    ARTIFACT: 'Artifact',
    MEDIA: 'Media',
    EVENT: 'Event',
  };

  const typeColor: Record<string, string> = {
    ARTIFACT: 'bg-amber-50 text-amber-700',
    MEDIA: 'bg-blue-50 text-blue-700',
    EVENT: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Node Info Card */}
      <div className="card-flat overflow-hidden">
        {node.thumbnail && (
          <div className="relative h-64 w-full">
            <img
              src={node.thumbnail}
              alt={node.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <div className="p-5">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor[node.node_type] ?? 'badge-gray'}`}>
            {typeLabel[node.node_type] ?? node.node_type}
          </span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{node.title}</h1>

          {node.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {node.description}
            </p>
          )}

          <div className="mt-5 flex items-center gap-6 border-t border-gray-100 pt-4 text-sm">
            <div>
              <span className="font-semibold text-gray-900">
                {(node.view_count ?? 0).toLocaleString()}
              </span>
              <span className="ml-1 text-gray-500">Views</span>
            </div>
            <NodeActions nodeId={node.id} nodeSlug={params.slug} followCount={node.follow_count ?? 0} />
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card-flat">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Comments</h2>
        </div>

        <div className="divide-y divide-gray-50">
          {(comments ?? []).map((comment: Record<string, unknown>) => {
            const author = comment.profiles as Record<string, unknown> | null;
            const commentName = (author?.nickname as string) ?? 'Anonymous';
            return (
              <div key={comment.id as string} className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                    {commentName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {commentName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {timeAgo(comment.created_at as string)}
                  </span>
                </div>
                <p className="mt-1.5 pl-[38px] text-sm leading-relaxed text-gray-700">
                  {comment.content as string}
                </p>
                <CommentActions commentId={comment.id as string} likeCount={comment.like_count as number} />
              </div>
            );
          })}
          {(comments ?? []).length === 0 && (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-2 text-sm">No comments yet</p>
            </div>
          )}
        </div>

        {/* Comment Form */}
        <CommentFormWrapper nodeSlug={params.slug} />
      </div>
    </div>
  );
}
