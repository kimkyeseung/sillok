import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

async function getArticle(slug: string) {
  const { data } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return {};

  return {
    title: `${article.title} - Sillok`,
    description: article.summary?.slice(0, 160),
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <article className="card-flat overflow-hidden">
        {article.thumbnail && (
          <img
            src={article.thumbnail}
            alt={article.title}
            className="h-64 w-full object-cover sm:h-80"
          />
        )}

        <div className="p-6">
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

          <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
            {article.title}
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            {new Date(article.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <div className="mt-8 whitespace-pre-wrap text-sm leading-[1.8] text-gray-700">
            {article.body}
          </div>
        </div>
      </article>

      <div className="mt-4 flex justify-center">
        <Link href="/articles" className="btn-secondary text-xs">
          Back to List
        </Link>
      </div>
    </div>
  );
}
