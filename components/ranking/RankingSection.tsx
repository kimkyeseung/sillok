'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const ERA_TABS = [
  { label: '전체', value: '' },
  { label: '삼국', value: '삼국' },
  { label: '고려', value: '고려' },
  { label: '조선', value: '조선' },
  { label: '근현대', value: '근현대' },
];

interface RankedPerson {
  rank: number;
  id: string;
  slug: string;
  name_ko: string;
  name_en: string;
  name_hanja: string | null;
  birth_year: number | null;
  death_year: number | null;
  thumbnail: string | null;
  score: number;
  thread_count: number;
  hot_thread_count: number;
  like_count: number;
}

export default function RankingSection() {
  const [tag, setTag] = useState('');
  const [persons, setPersons] = useState<RankedPerson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = useCallback(async (selectedTag: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedTag) params.set('tag', selectedTag);
    params.set('limit', '10');

    const res = await fetch(`/api/ranking?${params}`);
    const json = await res.json();

    if (json.success) {
      setPersons(json.data.persons);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRanking(tag);
  }, [tag, fetchRanking]);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Trending Figures</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          최근 7일간 가장 활발하게 논의된 인물
        </p>
      </div>

      {/* Tag Tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {ERA_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTag(tab.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tag === tab.value
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
        </div>
      )}

      {/* Ranking List */}
      {!loading && persons.length > 0 && (
        <div className="space-y-2">
          {persons.map((person) => (
            <Link
              key={person.id}
              href={`/persons/${person.slug}`}
              className="card group flex items-center gap-3 p-3 transition-colors hover:bg-gray-50"
            >
              {/* Rank */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  person.rank <= 3
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {person.rank}
              </div>

              {/* Avatar */}
              {person.thumbnail ? (
                <Image
                  src={person.thumbnail}
                  alt={person.name_ko}
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-sm font-bold text-brand-600 ring-2 ring-gray-100">
                  {person.name_ko.charAt(0)}
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-brand-600">
                  {person.name_ko}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>스레드 {person.thread_count}</span>
                  {person.hot_thread_count > 0 && (
                    <span className="text-red-400">핫 {person.hot_thread_count}</span>
                  )}
                  <span>좋아요 {person.like_count}</span>
                </div>
              </div>

              {/* Score */}
              <div className="shrink-0 text-right">
                <p className="text-base font-bold text-brand-600">{person.score}</p>
                <p className="text-xs text-gray-400">점</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && persons.length === 0 && (
        <div className="card-flat flex flex-col items-center py-10">
          <svg
            className="h-10 w-10 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">
            최근 7일간 활동이 없습니다
          </p>
          <p className="text-xs text-gray-400">
            인물 페이지에서 스레드를 작성해보세요
          </p>
        </div>
      )}
    </div>
  );
}
