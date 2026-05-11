'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import ArticleForm from '@/components/admin/ArticleForm';

interface ArticleDetail {
  slug: string;
  title: string;
  body: string;
  summary: string | null;
  thumbnail: string | null;
  tag: string;
  is_notice: boolean;
  is_published: boolean;
}

export default function AdminEditArticlePage() {
  const params = useParams<{ slug: string }>();
  const { data, isLoading } = useSWR<ArticleDetail>(
    params.slug ? `/api/articles/${params.slug}` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-gray-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        Article not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {data.title}
        </p>
      </div>
      <ArticleForm mode="edit" initialData={data} slug={params.slug} />
    </div>
  );
}
