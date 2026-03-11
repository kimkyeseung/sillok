'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface CollectionData {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  items: Array<{
    person_id: string;
    persons: {
      id: string;
      slug: string;
      name_ko: string;
      thumbnail: string | null;
      birth_year: number | null;
      death_year: number | null;
    };
  }>;
}

export default function CollectionDetail({
  collectionId,
}: {
  collectionId: string;
}) {
  const { data, isLoading } = useSWR<CollectionData>(
    `/api/collections/${collectionId}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-gray-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <span className="text-sm">로딩 중...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        컬렉션을 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/collections" className="text-xs text-brand-600 hover:text-brand-700">
          &larr; 컬렉션 목록
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{data.name}</h1>
        {data.description && (
          <p className="mt-1 text-sm text-gray-500">{data.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(data.items ?? []).map((item) => {
          const p = item.persons;
          return (
            <Link
              key={p.id}
              href={`/persons/${p.slug}`}
              className="card group p-4 text-center"
            >
              {p.thumbnail ? (
                <img
                  src={p.thumbnail}
                  alt={p.name_ko}
                  className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-gray-100 transition-all group-hover:ring-brand-200"
                />
              ) : (
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-2xl font-bold text-brand-600 ring-2 ring-gray-100 transition-all group-hover:ring-brand-200">
                  {p.name_ko.charAt(0)}
                </div>
              )}
              <p className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-brand-600">
                {p.name_ko}
              </p>
              {(p.birth_year || p.death_year) && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {p.birth_year ?? '?'} ~ {p.death_year ?? '?'}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {(data.items ?? []).length === 0 && (
        <div className="card-flat flex flex-col items-center py-16">
          <p className="text-sm text-gray-500">아직 인물이 없습니다</p>
          <p className="text-xs text-gray-400">인물 상세에서 컬렉션에 추가해보세요</p>
        </div>
      )}
    </div>
  );
}
