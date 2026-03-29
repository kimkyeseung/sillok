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
  name_en: string | null;
  birth_year: number | null;
  death_year: number | null;
  thumbnail: string | null;
  is_published: boolean;
  is_controversial: boolean;
  is_alive: boolean;
  view_count: number;
  follow_count: number;
  created_at: string;
}

interface PersonsResponse {
  items: Person[];
  has_next: boolean;
  next_cursor: string | null;
}

interface InlineEditForm {
  birth_year: string;
  death_year: string;
  name_en: string;
  is_alive: boolean;
  is_published: boolean;
  is_controversial: boolean;
}

export default function AdminPersonsPage() {
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [missingYear, setMissingYear] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<InlineEditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const url = `/api/admin/persons?limit=20${search ? `&q=${encodeURIComponent(search)}` : ''}${cursor ? `&cursor=${cursor}` : ''}${missingYear ? '&missing_year=true' : ''}`;
  const { data, isLoading, mutate } = useSWR<PersonsResponse>(url, fetcher);

  const handleDelete = async (slug: string, nameKo: string) => {
    if (!confirm(`"${nameKo}" will be deleted. Continue?`)) return;
    try {
      await apiFetch(`/api/persons/${slug}`, { method: 'DELETE' });
      toast('Deleted successfully');
      mutate();
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const startEdit = (person: Person) => {
    setEditingSlug(person.slug);
    setEditForm({
      birth_year: person.birth_year?.toString() ?? '',
      death_year: person.death_year?.toString() ?? '',
      name_en: person.name_en ?? '',
      is_alive: person.is_alive ?? false,
      is_published: person.is_published,
      is_controversial: person.is_controversial,
    });
  };

  const cancelEdit = () => {
    setEditingSlug(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editingSlug || !editForm) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        is_alive: editForm.is_alive,
        is_published: editForm.is_published,
        is_controversial: editForm.is_controversial,
      };
      if (editForm.birth_year.trim()) {
        body.birth_year = parseInt(editForm.birth_year);
      } else {
        body.birth_year = null;
      }
      if (editForm.death_year.trim()) {
        body.death_year = parseInt(editForm.death_year);
      } else {
        body.death_year = null;
      }
      if (editForm.name_en.trim()) {
        body.name_en = editForm.name_en.trim();
      } else {
        body.name_en = null;
      }

      await apiFetch(`/api/persons/${editingSlug}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      toast('Saved');
      cancelEdit();
      mutate();
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') cancelEdit();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Persons</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage person data — click a row to quick-edit
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
          Add Person
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
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCursor(null);
          }}
          className="input pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setMissingYear(!missingYear); setCursor(null); }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            missingYear
              ? 'bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {missingYear ? '✓ ' : ''}Missing Year
        </button>
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
                <th className="px-4 py-3">Name (EN)</th>
                <th className="px-4 py-3">Birth</th>
                <th className="px-4 py-3">Death</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map((person) => {
                const isEditing = editingSlug === person.slug;

                return (
                  <tr
                    key={person.id}
                    className={`transition-colors ${isEditing ? 'bg-brand-50/30' : 'hover:bg-gray-50 cursor-pointer'}`}
                    onClick={() => !isEditing && startEdit(person)}
                  >
                    {/* Person name + avatar */}
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

                    {/* Name EN */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {isEditing && editForm ? (
                        <input
                          type="text"
                          value={editForm.name_en}
                          onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })}
                          onKeyDown={handleEditKeyDown}
                          placeholder="English name"
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                        />
                      ) : (
                        <span className={person.name_en ? 'text-gray-600' : 'text-gray-300'}>
                          {person.name_en || '—'}
                        </span>
                      )}
                    </td>

                    {/* Birth year */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {isEditing && editForm ? (
                        <input
                          type="number"
                          value={editForm.birth_year}
                          onChange={(e) => setEditForm({ ...editForm, birth_year: e.target.value })}
                          onKeyDown={handleEditKeyDown}
                          placeholder="Year"
                          className="w-20 rounded border border-gray-200 px-2 py-1 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                          autoFocus
                        />
                      ) : (
                        <span className={person.birth_year == null ? 'font-medium text-amber-600' : 'text-gray-500'}>
                          {person.birth_year ?? 'Missing'}
                        </span>
                      )}
                    </td>

                    {/* Death year */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {isEditing && editForm ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editForm.death_year}
                            onChange={(e) => setEditForm({ ...editForm, death_year: e.target.value })}
                            onKeyDown={handleEditKeyDown}
                            placeholder="Year"
                            disabled={editForm.is_alive}
                            className="w-20 rounded border border-gray-200 px-2 py-1 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-300"
                          />
                          <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={editForm.is_alive}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                is_alive: e.target.checked,
                                death_year: e.target.checked ? '' : editForm.death_year,
                              })}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600"
                            />
                            Alive
                          </label>
                        </div>
                      ) : (
                        <span className={!person.is_alive && person.death_year == null ? 'font-medium text-amber-600' : 'text-gray-500'}>
                          {person.is_alive ? 'Alive' : (person.death_year ?? 'Missing')}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {isEditing && editForm ? (
                        <div className="flex items-center justify-center gap-2">
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={editForm.is_published}
                              onChange={(e) => setEditForm({ ...editForm, is_published: e.target.checked })}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600"
                            />
                            <span className="text-gray-600">Public</span>
                          </label>
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={editForm.is_controversial}
                              onChange={(e) => setEditForm({ ...editForm, is_controversial: e.target.checked })}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-amber-600"
                            />
                            <span className="text-gray-600">Controversial</span>
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              person.is_published
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {person.is_published ? 'Public' : 'Draft'}
                          </span>
                          {person.is_controversial && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              Controversial
                            </span>
                          )}
                          {person.is_alive && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                              Alive
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                          >
                            {saving ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/persons/${person.slug}/edit`}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="Full edit"
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
                            title="Delete"
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
                      )}
                    </td>
                  </tr>
                );
              })}
              {(data?.items ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No persons found
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
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
