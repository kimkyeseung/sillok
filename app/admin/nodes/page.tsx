'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface LinkedPerson {
  id: string;
  name_ko: string;
  name_en: string | null;
  slug: string;
}

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
  person_node_links?: Array<{ person_id: string; persons: LinkedPerson | null }>;
}

interface NodesResponse {
  items: Node[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

const TYPE_COLORS: Record<string, string> = {
  ARTIFACT: 'bg-amber-50 text-amber-700',
  MEDIA: 'bg-purple-50 text-purple-700',
  EVENT: 'bg-teal-50 text-teal-700',
};

const EVENT_TYPES = ['war', 'purge', 'revolt', 'politics', 'diplomacy', 'culture', 'dynasty'] as const;

const EMPTY_FORM = {
  slug: '',
  node_type: 'ARTIFACT' as 'ARTIFACT' | 'MEDIA' | 'EVENT',
  title: '',
  title_ko: '',
  description: '',
  thumbnail: '',
  is_published: false,
  start_year: '',
  event_type: '' as string,
};

// ── Modal ──

function NodeModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ── Page ──

export default function AdminNodesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const apiUrl = `/api/admin/nodes?limit=20&page=${page}${search ? `&q=${encodeURIComponent(search)}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}`;
  const { data, isLoading, mutate } = useSWR<NodesResponse>(apiUrl, fetcher);

  const pagination = data?.pagination;

  const [showModal, setShowModal] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedPersons, setSelectedPersons] = useState<LinkedPerson[]>([]);
  const [personQuery, setPersonQuery] = useState('');

  // Person search (debounced by typing)
  const { data: personResults } = useSWR<{ items: LinkedPerson[] }>(
    personQuery.length >= 1 ? `/api/admin/persons/all?q=${encodeURIComponent(personQuery)}` : null,
    fetcher
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingNode(null);
    setSelectedPersons([]);
    setPersonQuery('');
    setShowModal(false);
  };

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setSelectedPersons([]);
    setPersonQuery('');
    setEditingNode(null);
    setShowModal(true);
  };

  const startEdit = (node: Node) => {
    setForm({
      slug: node.slug,
      node_type: node.node_type,
      title: node.title,
      title_ko: (node.metadata?.title_ko as string) ?? '',
      description: node.description ?? '',
      thumbnail: node.thumbnail ?? '',
      is_published: node.is_published,
      start_year: node.metadata?.start_year != null ? String(node.metadata.start_year) : '',
      event_type: (node.metadata?.event_type as string) ?? '',
    });
    setSelectedPersons(
      (node.person_node_links ?? [])
        .filter((l) => l.persons !== null)
        .map((l) => l.persons!)
    );
    setPersonQuery('');
    setEditingNode(node);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.title.trim()) return;

    setSaving(true);
    try {
      const metadata: Record<string, unknown> = {};
      if (form.start_year.trim()) metadata.start_year = parseInt(form.start_year);
      if (form.event_type) metadata.event_type = form.event_type;
      if (form.title_ko.trim()) metadata.title_ko = form.title_ko.trim();

      const body: Record<string, unknown> = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        thumbnail: form.thumbnail.trim() || undefined,
        is_published: form.is_published,
      };
      if (Object.keys(metadata).length > 0) body.metadata = metadata;

      const personIds = selectedPersons.map((p) => p.id);

      if (editingNode) {
        const merged = { ...(editingNode.metadata ?? {}), ...metadata };
        await apiFetch(`/api/nodes/${editingNode.slug}`, {
          method: 'PUT',
          body: JSON.stringify({ ...body, metadata: merged, person_ids: personIds }),
        });
        toast('Node updated');
      } else {
        await apiFetch('/api/nodes', {
          method: 'POST',
          body: JSON.stringify({ ...body, node_type: form.node_type, person_ids: personIds.length > 0 ? personIds : undefined }),
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
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by title..."
            className="input w-full pl-10"
          />
        </div>
        <div className="flex gap-1">
          {['', 'ARTIFACT', 'MEDIA', 'EVENT'].map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1); }}
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
                <th className="px-5 py-3">Year</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Views</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map((node) => (
                <tr
                  key={node.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                  onClick={() => startEdit(node)}
                >
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
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {node.metadata?.start_year != null ? String(node.metadata.start_year) : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{node.slug}</td>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
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
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
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

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {((page - 1) * pagination.limit + 1).toLocaleString()}–{Math.min(page * pagination.limit, pagination.total).toLocaleString()} of {pagination.total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            >
              Prev
            </button>
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.total_pages || Math.abs(p - page) <= 2)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="px-1 text-xs text-gray-300">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[28px] rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-brand-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.total_pages}
              className="rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            >
              Next
            </button>
            <button
              onClick={() => setPage(pagination.total_pages)}
              disabled={page === pagination.total_pages}
              className="rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <NodeModal
        open={showModal}
        onClose={resetForm}
        title={editingNode ? `Edit: ${editingNode.title}` : 'New Node'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
                autoFocus
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Title (EN) *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Imjin War"
                required
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Title (KO)</label>
              <input
                type="text"
                value={form.title_ko}
                onChange={(e) => setForm((p) => ({ ...p, title_ko: e.target.value }))}
                placeholder="Imjin War"
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="input resize-none"
            />
          </div>
          {/* Event-specific fields */}
          {form.node_type === 'EVENT' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Year</label>
                <input
                  type="number"
                  value={form.start_year}
                  onChange={(e) => setForm((p) => ({ ...p, start_year: e.target.value }))}
                  placeholder="1592"
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Event Type</label>
                <select
                  value={form.event_type}
                  onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))}
                  className="input"
                >
                  <option value="">-- Select --</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
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
          {/* Linked persons */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Linked Persons</label>
            {selectedPersons.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {selectedPersons.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                  >
                    {p.name_ko}
                    {p.name_en && <span className="text-brand-400">({p.name_en})</span>}
                    <button
                      type="button"
                      onClick={() => setSelectedPersons((prev) => prev.filter((x) => x.id !== p.id))}
                      className="ml-0.5 text-brand-400 hover:text-brand-600"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={personQuery}
                onChange={(e) => setPersonQuery(e.target.value)}
                placeholder="Search person by name..."
                className="input w-full"
              />
              {personQuery.length >= 1 && personResults?.items && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {personResults.items.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400">No results</p>
                  ) : (
                    personResults.items
                      .filter((p) => !selectedPersons.some((s) => s.id === p.id))
                      .slice(0, 10)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPersons((prev) => [...prev, p]);
                            setPersonQuery('');
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">{p.name_ko}</span>
                          {p.name_en && <span className="text-xs text-gray-400">{p.name_en}</span>}
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Published
          </label>
          <div className="flex gap-2 border-t border-gray-100 pt-4">
            <button type="submit" disabled={saving || !form.slug.trim() || !form.title.trim()} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving...' : editingNode ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="btn-ghost text-sm">Cancel</button>
          </div>
        </form>
      </NodeModal>
    </div>
  );
}
