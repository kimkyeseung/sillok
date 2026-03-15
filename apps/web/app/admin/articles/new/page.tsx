'use client';

import ArticleForm from '@/components/admin/ArticleForm';

export default function AdminNewArticlePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Write Article</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Write a new article or notice
        </p>
      </div>
      <ArticleForm mode="create" />
    </div>
  );
}
