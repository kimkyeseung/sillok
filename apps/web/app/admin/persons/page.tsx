'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface Person {
  id: string;
  slug: string;
  name_ko: string;
  name_hanja: string | null;
  birth_year: number | null;
  death_year: number | null;
  thumbnail: string | null;
  is_published: boolean;
  is_controversial: boolean;
  view_count: number;
  follow_count: number;
  created_at: string;
}

interface PersonsResponse {
  items: Person[];
  has_next: boolean;
  next_cursor: string | null;
}

export default function AdminPersonsPage() {
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const { toast } = useToast();

  const url = `/api/admin/persons?limit=20${search ? `&q=${encodeURIComponent(search)}` : ''}${cursor ? `&cursor=${cursor}` : ''}`;
  const { data, isLoading, mutate } = useSWR<PersonsResponse>(url, fetcher);

  const handleDelete = async (slug: string, nameKo: string) => {
    if (!confirm(`Are you sure you want to delete "${nameKo}"?`)) return;
    try {
      await apiFetch(`/api/persons/${slug}`, { method: 'DELETE' });
      toast('Deleted successfully');
      mutate();
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Person Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage the list of persons
          </p>
        </div>
        <Link href="/admin/persons/new" className="btn-primary text-sm">
          <svg
            className="mr-1.5 inline h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Register Person
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by person name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCursor(null);
          }}
          className="input pl-10"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : (
        <div className="card-flat overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Birth-Death</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3 text-right">Follows</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map((person) => (
                <tr
                  key={person.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {person.thumbnail ? (
                        <img
                          src={person.thumbnail}
                          alt={person.name_ko}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                          {person.name_ko.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {person.name_ko}
                        </p>
                        {person.name_hanja && (
                          <p className="text-xs text-gray-400">
                            {person.name_hanja}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {person.birth_year ?? '?'} ~ {person.death_year ?? '?'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          person.is_published
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {person.is_published ? 'Public' : 'Private'}
                      </span>
                      {person.is_controversial && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Controversial
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {person.view_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {person.follow_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/persons/${person.slug}/edit`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Link>
                      <button
                        onClick={() =>
                          handleDelete(person.slug, person.name_ko)
                        }
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.items ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No persons registered
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data?.has_next && (
        <div className="flex justify-center">
          <button
            onClick={() => setCursor(data.next_cursor)}
            className="btn-ghost text-sm"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
