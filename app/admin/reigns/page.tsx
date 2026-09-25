'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface Reign {
  id: string;
  reign_start: number;
  reign_end: number;
  persons: { id: string; slug: string; name_en: string | null; name_ko: string } | null;
}

const EMPTY_FORM = { person_slug: '', reign_start: '', reign_end: '' };

export default function AdminReignsPage() {
  const { toast } = useToast();
  const { data: reigns, isLoading, mutate } = useSWR<Reign[]>('/api/admin/reigns', fetcher);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reign | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (reign: Reign) => {
    setForm({
      person_slug: reign.persons?.slug ?? '',
      reign_start: String(reign.reign_start),
      reign_end: String(reign.reign_end),
    });
    setEditing(reign);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = parseInt(form.reign_start, 10);
    const end = parseInt(form.reign_end, 10);
    if (!form.person_slug.trim() || isNaN(start) || isNaN(end)) return;
    if (end < start) {
      toast('End year must be on or after start year', 'error');
      return;
    }

    setSaving(true);
    try {
      const body = JSON.stringify({
        person_slug: form.person_slug.trim(),
        reign_start: start,
        reign_end: end,
      });
      if (editing) {
        await apiFetch(`/api/admin/reigns/${editing.id}`, { method: 'PUT', body });
        toast('Reign updated');
      } else {
        await apiFetch('/api/admin/reigns', { method: 'POST', body });
        toast('Reign added');
      }
      resetForm();
      mutate();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'An error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reign: Reign) => {
    const name = reign.persons?.name_en || reign.persons?.name_ko || 'this reign';
    if (!confirm(`Delete the ${reign.reign_start}–${reign.reign_end} reign of ${name}?`)) return;
    try {
      await apiFetch(`/api/admin/reigns/${reign.id}`, { method: 'DELETE' });
      toast('Reign deleted');
      mutate();
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reigns</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Reign periods shown as the current king in Age Flow. A ruler who returned to the throne has one row per reign.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary text-sm"
        >
          Add Reign
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-flat space-y-4 p-5">
          <h2 className="text-sm font-semibold text-gray-900">{editing ? 'Edit Reign' : 'Add New Reign'}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Figure slug *</label>
              <input
                type="text"
                value={form.person_slug}
                onChange={(e) => setForm((p) => ({ ...p, person_slug: e.target.value }))}
                placeholder="sejong-daewang"
                required
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Start year *</label>
              <input
                type="number"
                value={form.reign_start}
                onChange={(e) => setForm((p) => ({ ...p, reign_start: e.target.value }))}
                placeholder="1418"
                required
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">End year *</label>
              <input
                type="number"
                value={form.reign_end}
                onChange={(e) => setForm((p) => ({ ...p, reign_end: e.target.value }))}
                placeholder="1450"
                required
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={resetForm} className="btn-ghost text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : (reigns ?? []).length === 0 ? (
        <div className="card-flat py-12 text-center text-gray-400">
          <p className="text-sm">No reigns</p>
        </div>
      ) : (
        <div className="card-flat divide-y divide-gray-50 overflow-hidden">
          {(reigns ?? []).map((reign) => (
            <div key={reign.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
              <span className="w-24 shrink-0 font-mono text-sm text-gray-500">
                {reign.reign_start}–{reign.reign_end}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {reign.persons?.name_en || reign.persons?.name_ko || 'Unknown figure'}
                </span>
                {reign.persons && <span className="ml-2 text-xs text-gray-400">{reign.persons.slug}</span>}
              </div>
              <button
                onClick={() => startEdit(reign)}
                className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(reign)}
                className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
