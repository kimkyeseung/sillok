'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface SearchResult {
  persons?: Array<{
    id: string;
    slug: string;
    name_ko: string;
    name_hanja?: string;
    thumbnail?: string;
  }>;
  nodes?: Array<{
    id: string;
    slug: string;
    node_type: string;
    title: string;
  }>;
  threads?: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
}

const nodeTypeLabel: Record<string, string> = {
  ARTIFACT: 'Artifact',
  MEDIA: 'Media',
  EVENT: 'Event',
};

export default function SearchClient() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data, isLoading } = useSWR<SearchResult>(
    submitted ? `/api/search?q=${encodeURIComponent(submitted)}&type=all&limit=10` : null,
    fetcher
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
  };

  const hasResults =
    (data?.persons?.length ?? 0) > 0 ||
    (data?.nodes?.length ?? 0) > 0 ||
    (data?.threads?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Search</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search figures, artifacts, and threads all at once
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search figures, artifacts, threads..."
            className="input pl-10"
          />
        </div>
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <span className="ml-2 text-sm text-gray-400">Searching...</span>
        </div>
      )}

      {data && hasResults && (
        <div className="space-y-6">
          {data.persons && data.persons.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Figures
              </h2>
              <div className="card-flat divide-y divide-gray-100">
                {data.persons.map((p) => (
                  <Link
                    key={p.id}
                    href={`/persons/${p.slug}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    {p.thumbnail ? (
                      <img
                        src={p.thumbnail}
                        alt={p.name_ko}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                        {p.name_ko.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {p.name_ko}
                      </p>
                      {p.name_hanja && (
                        <p className="text-xs text-gray-400">{p.name_hanja}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.nodes && data.nodes.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Artifacts / Media / Events
              </h2>
              <div className="card-flat divide-y divide-gray-100">
                {data.nodes.map((n) => (
                  <Link
                    key={n.id}
                    href={`/nodes/${n.slug}`}
                    className="block px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="badge-gray text-[10px]">
                        {nodeTypeLabel[n.node_type] ?? n.node_type}
                      </span>
                      <p className="text-sm font-medium text-gray-900">
                        {n.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.threads && data.threads.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Threads
              </h2>
              <div className="card-flat divide-y divide-gray-100">
                {data.threads.map((t) => (
                  <Link
                    key={t.id}
                    href={`/threads/${t.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {t.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString('en-US')}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {data && !hasResults && (
        <div className="card-flat flex flex-col items-center py-16">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">
            No results found for &ldquo;{submitted}&rdquo;
          </p>
          <p className="text-xs text-gray-400">Try a different search term</p>
        </div>
      )}

      {!data && !isLoading && (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <svg className="h-16 w-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="mt-3 text-sm">Enter a search term to see results</p>
        </div>
      )}
    </div>
  );
}
