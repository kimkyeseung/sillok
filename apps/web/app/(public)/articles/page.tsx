import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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

export default async function ArticlesPage() {
  const { data: articles } = await supabaseAdmin
    .from('articles')
    .select('id, slug, title, summary, thumbnail, tag, is_notice, created_at')
    .eq('is_deleted', false)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Stories and announcements from the Sillok team
        </p>
      </div>

      <div className="space-y-3">
        {(articles ?? []).map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="card group flex gap-4 p-4"
          >
            {article.thumbnail && (
              <img
                src={article.thumbnail}
                alt={article.title}
                className="h-24 w-32 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {article.is_notice && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                    Notice
                  </span>
                )}
                <span className="badge-gray text-[10px]">
                  {article.tag}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-gray-900 group-hover:text-brand-600 line-clamp-1">
                {article.title}
              </p>
              {article.summary && (
                <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
                  {article.summary}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {timeAgo(article.created_at)}
              </p>
            </div>
          </Link>
        ))}

        {(articles ?? []).length === 0 && (
          <div className="card-flat flex flex-col items-center py-16">
            <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-500">
              No articles yet
            </p>
            <p className="text-xs text-gray-400">New articles coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
