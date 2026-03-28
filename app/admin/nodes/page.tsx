'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface Node {
  id: string;
  slug: string;
  node_type: 'ARTIFACT' | 'MEDIA' | 'EVENT';
  title: string;
  description: string | null;
  thumbnail: string | null;
  metadata: Record<string, unknown> | null;
  is_published: boolean;
  view_count: number;
  follow_count: number;
  created_at: string;
}

interface NodesResponse {
  items: Node[];
  has_next: boolean;
  next_cursor: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  ARTIFACT: 'bg-amber-50 text-amber-700',
  MEDIA: 'bg-purple-50 text-purple-700',
  EVENT: 'bg-teal-50 text-teal-700',
};

const EMPTY_FORM = {
  slug: '',
  node_type: 'ARTIFACT' as 'ARTIFACT' | 'MEDIA' | 'EVENT',
  title: '',
  description: '',
  thumbnail: '',
  is_published: false,
};

export default function AdminNodesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);

  const params = new URLSearchParams();
  params.set('limit', '20');
  if (search) params.set('q', search);
  if (typeFilter) params.set('type', typeFilter);
  if (cursor) params.set('cursor', cursor);

  const { data, isLoading, mutate } = useSWR<NodesResponse>(
    `/api/admin/nodes?${params}`,
    fetcher
  );

  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingNode(null);
    setShowForm(false);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (node: Node) => {
    setForm({
      slug: node.slug,
      node_type: node.node_type,
      title: node.title,
      description: node.description ?? '',
      thumbnail: node.thumbnail ?? '',
      is_published: node.is_published,
    });
    setEditingNode(node);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.title.trim()) return;

    setSaving(true);
    try {
      const body = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        thumbnail: form.thumbnail.trim() || undefined,
        is_published: form.is_published,
      };

      if (editingNode) {
        await apiFetch(`/api/nodes/${editingNode.slug}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast('Node updated');
      } else {
        await apiFetch('/api/nodes', {
          method: 'POST',
          body: JSON.stringify({ ...body, node_type: form.node_type }),
        });
        toast('Node created');
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

  const handleDelete = async (node: Node) => {
    if (!confirm(`Delete "${node.title}"?`)) return;
    try {
      await apiFetch(`/api/nodes/${node.slug}`, { method: 'DELETE' });
      toast('Node deleted');
      mutate();
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const handleTogglePublish = async (node: Node) => {
    try {
      await apiFetch(`/api/nodes/${node.slug}`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: !node.is_published }),
      });
      toast(node.is_published ? 'Unpublished' : 'Published');
      mutate();
    } catch {
      toast('Failed to update', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Node Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage artifacts, media, and events
          </p>
        </div>
        <button onClick={startCreate} className="btn-primary text-sm">
          <svg className="mr-1.5 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Node
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCursor(null); }}
            placeholder="Search by title..."
            className="input w-full pl-10"
          />
        </div>
        <div className="flex gap-1">
          {['', 'ARTIFACT', 'MEDIA', 'EVENT'].map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setCursor(null); }}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-flat space-y-4 p-5">
          <h2 className="text-sm font-semibold text-gray-900">
            {editingNode ? 'Edit Node' : 'New Node'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="hunminjeongeum"
                required
                pattern="^[a-z0-9-]+$"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Hunminjeongeum"
                required
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Type *</label>
              <select
                value={form.node_type}
                onChange={(e) => setForm((p) => ({ ...p, node_type: e.target.value as 'ARTIFACT' | 'MEDIA' | 'EVENT' }))}
                disabled={!!editingNode}
                className="input disabled:opacity-50"
              >
                <option value="ARTIFACT">Artifact</option>
                <option value="MEDIA">Media</option>
                <option value="EVENT">Event</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="input"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Thumbnail URL</label>
              <input
                type="url"
                value={form.thumbnail}
                onChange={(e) => setForm((p) => ({ ...p, thumbnail: e.target.value }))}
                placeholder="https://..."
                className="input"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                Published
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !form.slug.trim() || !form.title.trim()} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving...' : editingNode ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="btn-ghost text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Node List */}
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
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Views</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map((node) => (
                <tr key={node.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      {node.thumbnail ? (
                        <img src={node.thumbnail} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          node.node_type === 'ARTIFACT' ? 'bg-amber-50 text-amber-600' :
                          node.node_type === 'MEDIA' ? 'bg-purple-50 text-purple-600' :
                          'bg-teal-50 text-teal-600'
                        }`}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {node.node_type === 'ARTIFACT' && <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
                            {node.node_type === 'MEDIA' && <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />}
                            {node.node_type === 'EVENT' && <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                          </svg>
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{node.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[node.node_type]}`}>
                      {node.node_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{node.slug}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleTogglePublish(node)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        node.is_published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {node.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">{node.view_count.toLocaleString()}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(node.created_at).toLocaleDateString('en-US')}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(node)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600" title="Edit">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(node)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete">
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
          {(data?.items ?? []).length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm">No nodes found</p>
            </div>
          )}
        </div>
      )}

      {data?.has_next && (
        <div className="text-center">
          <button onClick={() => setCursor(data.next_cursor)} className="btn-secondary text-sm">Load More</button>
        </div>
      )}
    </div>
  );
}
