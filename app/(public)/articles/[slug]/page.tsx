import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { articleJsonLd } from '@/lib/jsonld';
import ArticleBody from '@/components/article/ArticleBody';
import ArticleViewLogger from '@/components/article/ArticleViewLogger';
import LikeButton from '@/components/thread/LikeButton';

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

  const description = article.summary?.slice(0, 160) ?? article.title;

  return {
    title: `${article.title}`,
    description,
    alternates: { canonical: `/articles/${params.slug}` },
    openGraph: {
      title: `${article.title} - Sillok`,
      description,
      type: 'article',
      ...(article.thumbnail && { images: [article.thumbnail] }),
    },
    twitter: {
      card: article.thumbnail ? 'summary_large_image' : 'summary',
      title: article.title,
      description,
      ...(article.thumbnail && { images: [article.thumbnail] }),
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(article)) }}
      />
      <ArticleViewLogger slug={params.slug} />
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

          <ArticleBody content={article.body} />

          <div className="mt-8 flex items-center border-t pt-4">
            <LikeButton
              targetType="article"
              targetId={article.slug}
              initialCount={article.like_count ?? 0}
              size="md"
            />
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
