'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface CuratorRole {
  id: string;
  user_id: string;
  role_type: 'era' | 'field' | 'global';
  role_value: string;
  granted_by: string | null;
  granted_at: string;
  is_active: boolean;
  profiles: { nickname: string; avatar_url: string | null } | null;
}

const TYPE_COLORS: Record<string, string> = {
  era: 'bg-blue-50 text-blue-700',
  field: 'bg-green-50 text-green-700',
  global: 'bg-purple-50 text-purple-700',
};

const EMPTY_FORM = {
  user_id: '',
  role_type: 'field' as 'era' | 'field' | 'global',
  role_value: '',
};

export default function AdminCuratorsPage() {
  const { toast } = useToast();
  const [activeOnly, setActiveOnly] = useState(false);

  const url = `/api/admin/curators${activeOnly ? '?active_only=true' : ''}`;
  const { data: curators, isLoading, mutate } = useSWR<CuratorRole[]>(url, fetcher);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id.trim() || !form.role_value.trim()) return;

    setSaving(true);
    try {
      await apiFetch('/api/admin/curators', {
        method: 'POST',
        body: JSON.stringify({
          user_id: form.user_id.trim(),
          role_type: form.role_type,
          role_value: form.role_value.trim(),
        }),
      });
      toast('Curator role granted');
      resetForm();
      mutate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (curator: CuratorRole) => {
    try {
      await apiFetch(`/api/admin/curators/${curator.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !curator.is_active }),
      });
      toast(curator.is_active ? 'Curator deactivated' : 'Curator activated');
      mutate();
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const handleDelete = async (curator: CuratorRole) => {
    const name = curator.profiles?.nickname ?? curator.user_id;
    if (!confirm(`Remove curator role for "${name}" (${curator.role_value})?`)) return;
    try {
      await apiFetch(`/api/admin/curators/${curator.id}`, { method: 'DELETE' });
      toast('Curator role removed');
      mutate();
    } catch {
      toast('Failed to remove', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Curator Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage volunteer curators and their assigned roles
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary text-sm"
        >
          <svg className="mr-1.5 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Grant Role
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveOnly(false)}
          className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            !activeOnly ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveOnly(true)}
          className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            activeOnly ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Active Only
        </button>
      </div>

      {/* Grant Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-flat space-y-4 p-5">
          <h2 className="text-sm font-semibold text-gray-900">Grant Curator Role</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">User ID (UUID) *</label>
              <input
                type="text"
                value={form.user_id}
                onChange={(e) => setForm((p) => ({ ...p, user_id: e.target.value }))}
                placeholder="e.g. a1b2c3d4-..."
                required
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Role Type *</label>
              <select
                value={form.role_type}
                onChange={(e) => setForm((p) => ({ ...p, role_type: e.target.value as 'era' | 'field' | 'global' }))}
                className="input"
              >
                <option value="era">Era (period-specific)</option>
                <option value="field">Field (topic-specific)</option>
                <option value="global">Global (all content)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Role Value *</label>
              <input
                type="text"
                value={form.role_value}
                onChange={(e) => setForm((p) => ({ ...p, role_value: e.target.value }))}
                placeholder="e.g. Joseon Dynasty, K-pop"
                required
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !form.user_id.trim() || !form.role_value.trim()} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Grant'}
            </button>
            <button type="button" onClick={resetForm} className="btn-ghost text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Curator List */}
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
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role Type</th>
                <th className="px-5 py-3">Role Value</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Granted</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(curators ?? []).map((c) => (
                <tr key={c.id} className={`transition-colors hover:bg-gray-50 ${!c.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {c.profiles?.avatar_url ? (
                        <img src={c.profiles.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                          {c.profiles?.nickname?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">
                        {c.profiles?.nickname ?? 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[c.role_type]}`}>
                      {c.role_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{c.role_value}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        c.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(c.granted_at).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleDelete(c)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Remove">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(curators ?? []).length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm">No curators found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
