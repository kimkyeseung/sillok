'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface Person {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string;
  birth_year: number | null;
  death_year: number | null;
}

interface TimelineEntry {
  id: string;
  person_id: string;
  year: number;
  month: number | null;
  title: string;
  description: string | null;
  sort_order: number;
}

const EMPTY_FORM = {
  year: '',
  month: '',
  title: '',
  description: '',
  sort_order: '0',
};

export default function AdminTimelinesPage() {
  const { toast } = useToast();

  // Person search
  const [personSearch, setPersonSearch] = useState('');
  const { data: allPersons } = useSWR<Person[]>(
    '/api/admin/persons/all',
    fetcher
  );
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Timeline entries
  const { data: entries, mutate } = useSWR<TimelineEntry[]>(
    selectedPerson ? `/api/admin/timelines?person_id=${selectedPerson.id}` : null,
    fetcher
  );

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const filteredPersons = (allPersons ?? []).filter((p) => {
    if (!personSearch.trim()) return false;
    const q = personSearch.toLowerCase();
    return (
      p.name_ko.toLowerCase().includes(q) ||
      p.name_en.toLowerCase().includes(q) ||
      p.slug.includes(q)
    );
  }).slice(0, 10);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingEntry(null);
    setShowForm(false);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (entry: TimelineEntry) => {
    setForm({
      year: String(entry.year),
      month: entry.month ? String(entry.month) : '',
      title: entry.title,
      description: entry.description ?? '',
      sort_order: String(entry.sort_order),
    });
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !form.year || !form.title.trim()) return;

    setSaving(true);
    try {
      const body = {
        person_id: selectedPerson.id,
        year: Number(form.year),
        month: form.month ? Number(form.month) : undefined,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        sort_order: Number(form.sort_order) || 0,
      };

      if (editingEntry) {
        const { person_id: _, ...updateBody } = body;
        await apiFetch(`/api/admin/timelines/${editingEntry.id}`, {
          method: 'PUT',
          body: JSON.stringify(updateBody),
        });
        toast('Entry updated');
      } else {
        await apiFetch('/api/admin/timelines', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast('Entry created');
      }

      resetForm();
      mutate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: TimelineEntry) => {
    if (!confirm(`Delete "${entry.title}" (${entry.year})?`)) return;
    try {
      await apiFetch(`/api/admin/timelines/${entry.id}`, { method: 'DELETE' });
      toast('Entry deleted');
      mutate();
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Timeline Management</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Manage life timeline entries for each historical figure
        </p>
      </div>

      {/* Person Selector */}
      <div className="card-flat space-y-3 p-5">
        <label className="block text-xs font-medium text-gray-600">Select a Person</label>
        <div className="relative">
          <input
            type="text"
            value={selectedPerson ? `${selectedPerson.name_en} (${selectedPerson.name_ko})` : personSearch}
            onChange={(e) => {
              setPersonSearch(e.target.value);
              if (selectedPerson) setSelectedPerson(null);
            }}
            placeholder="Search by name or slug..."
            className="input w-full"
          />
          {!selectedPerson && filteredPersons.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
              {filteredPersons.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPerson(p);
                    setPersonSearch('');
                    resetForm();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{p.name_en}</span>
                  <span className="text-xs text-gray-400">{p.name_ko}</span>
                  {p.birth_year && (
                    <span className="text-xs text-gray-400">
                      {p.birth_year}–{p.death_year ?? ''}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedPerson && (
          <div className="flex items-center gap-2">
            <span className="badge-brand">
              {selectedPerson.name_en}
            </span>
            <span className="text-xs text-gray-400">{selectedPerson.slug}</span>
            <button
              onClick={() => { setSelectedPerson(null); setPersonSearch(''); resetForm(); }}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      {selectedPerson && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Timeline — {selectedPerson.name_en}
              <span className="ml-2 text-xs font-normal text-gray-400">
                {(entries ?? []).length} entries
              </span>
            </h2>
            <button onClick={startCreate} className="btn-primary text-sm">
              <svg className="mr-1.5 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Entry
            </button>
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="card-flat space-y-4 p-5">
              <h3 className="text-sm font-semibold text-gray-900">
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Year *</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                    placeholder="1443"
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Month</label>
                  <input
                    type="number"
                    value={form.month}
                    onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))}
                    placeholder="1–12"
                    min={1}
                    max={12}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Created Hunminjeongeum"
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="input"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving || !form.year || !form.title.trim()} className="btn-primary text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : editingEntry ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={resetForm} className="btn-ghost text-sm">Cancel</button>
              </div>
            </form>
          )}

          {/* Timeline List */}
          <div className="card-flat overflow-hidden">
            {(entries ?? []).length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-sm">No timeline entries yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {(entries ?? []).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50">
                    {/* Year badge */}
                    <div className="flex w-20 shrink-0 items-center gap-1">
                      <span className="text-sm font-bold text-brand-700">{entry.year}</span>
                      {entry.month && (
                        <span className="text-xs text-gray-400">
                          .{String(entry.month).padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                      {entry.description && (
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{entry.description}</p>
                      )}
                    </div>

                    {/* Sort order */}
                    <span className="shrink-0 text-[10px] text-gray-300">#{entry.sort_order}</span>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => startEdit(entry)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600" title="Edit">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(entry)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
