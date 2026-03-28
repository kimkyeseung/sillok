'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface Group {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  metadata: Record<string, unknown> | null;
  is_published: boolean;
  view_count: number;
  follow_count: number;
  created_at: string;
}

interface GroupsResponse {
  items: Group[];
  has_next: boolean;
  next_cursor: string | null;
}

interface PersonLink {
  id: string;
  link_type: string | null;
  persons: { id: string; slug: string; name_en: string; thumbnail: string | null };
}

const EMPTY_FORM = {
  slug: '',
  title: '',
  description: '',
  thumbnail: '',
  is_published: false,
};

export default function AdminGroupsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);

  const url = `/api/admin/groups?limit=20${search ? `&q=${encodeURIComponent(search)}` : ''}${cursor ? `&cursor=${cursor}` : ''}`;
  const { data, isLoading, mutate } = useSWR<GroupsResponse>(url, fetcher);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Detail / members
  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const { data: members, mutate: mutateMembers } = useSWR<PersonLink[]>(
    detailGroup ? `/api/admin/groups/${detailGroup.id}/members` : null,
    fetcher
  );
  const [addPersonId, setAddPersonId] = useState('');
  const [addLinkType, setAddLinkType] = useState('');

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingGroup(null);
    setShowForm(false);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (group: Group) => {
    setForm({
      slug: group.slug,
      title: group.title,
      description: group.description ?? '',
      thumbnail: group.thumbnail ?? '',
      is_published: group.is_published,
    });
    setEditingGroup(group);
    setShowForm(true);
    setDetailGroup(null);
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

      if (editingGroup) {
        await apiFetch(`/api/nodes/${editingGroup.slug}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast('Group updated');
      } else {
        await apiFetch('/api/nodes', {
          method: 'POST',
          body: JSON.stringify({ ...body, node_type: 'GROUP' }),
        });
        toast('Group created');
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

  const handleDelete = async (group: Group) => {
    if (!confirm(`Delete "${group.title}"?`)) return;
    try {
      await apiFetch(`/api/nodes/${group.slug}`, { method: 'DELETE' });
      toast('Group deleted');
      mutate();
      if (detailGroup?.id === group.id) setDetailGroup(null);
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const handleTogglePublish = async (group: Group) => {
    try {
      await apiFetch(`/api/nodes/${group.slug}`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: !group.is_published }),
      });
      toast(group.is_published ? 'Unpublished' : 'Published');
      mutate();
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const handleAddMember = async () => {
    if (!detailGroup || !addPersonId.trim()) return;
    try {
      await apiFetch(`/api/admin/groups/${detailGroup.id}/members`, {
        method: 'POST',
        body: JSON.stringify({
          person_id: addPersonId.trim(),
          link_type: addLinkType.trim() || undefined,
        }),
      });
      toast('Member added');
      setAddPersonId('');
      setAddLinkType('');
      mutateMembers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add';
      toast(msg, 'error');
    }
  };

  const handleRemoveMember = async (personId: string, name: string) => {
    if (!detailGroup || !confirm(`Remove "${name}" from this group?`)) return;
    try {
      await apiFetch(`/api/admin/groups/${detailGroup.id}/members`, {
        method: 'DELETE',
        body: JSON.stringify({ person_id: personId }),
      });
      toast('Member removed');
      mutateMembers();
    } catch {
      toast('Failed to remove', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage GROUP-type nodes (dynasties, organizations, K-pop groups, etc.)
          </p>
        </div>
        <button onClick={startCreate} className="btn-primary text-sm">
          <svg className="mr-1.5 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Group
        </button>
      </div>

      {/* Search */}
      <div className="relative">
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

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-flat space-y-4 p-5">
          <h2 className="text-sm font-semibold text-gray-900">
            {editingGroup ? 'Edit Group' : 'New Group'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="goryeo-dynasty"
                required
                pattern="^[a-z0-9-]+$"
                className="input"
              />
              <p className="mt-1 text-[11px] text-gray-400">Lowercase, hyphens only</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Goryeo Dynasty"
                required
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of the group..."
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
            <button
              type="submit"
              disabled={saving || !form.slug.trim() || !form.title.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingGroup ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="btn-ghost text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Group List */}
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
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Views</th>
                <th className="px-5 py-3 text-right">Follows</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map((group) => (
                <tr key={group.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      {group.thumbnail ? (
                        <img
                          src={group.thumbnail}
                          alt=""
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      )}
                      <button
                        onClick={() => setDetailGroup(detailGroup?.id === group.id ? null : group)}
                        className="font-medium text-gray-900 hover:text-brand-600"
                      >
                        {group.title}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{group.slug}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleTogglePublish(group)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        group.is_published
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {group.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {group.view_count.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {group.follow_count.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(group.created_at).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(group)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(group)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
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
              <p className="text-sm">No groups found</p>
            </div>
          )}
        </div>
      )}

      {/* Load More */}
      {data?.has_next && (
        <div className="text-center">
          <button
            onClick={() => setCursor(data.next_cursor)}
            className="btn-secondary text-sm"
          >
            Load More
          </button>
        </div>
      )}

      {/* Detail Panel — Members */}
      {detailGroup && (
        <div className="card-flat space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Members — {detailGroup.title}
            </h2>
            <button
              onClick={() => setDetailGroup(null)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Add Member */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600">Person ID (UUID)</label>
              <input
                type="text"
                value={addPersonId}
                onChange={(e) => setAddPersonId(e.target.value)}
                placeholder="e.g. a1b2c3d4-..."
                className="input"
              />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-gray-600">Link Type</label>
              <input
                type="text"
                value={addLinkType}
                onChange={(e) => setAddLinkType(e.target.value)}
                placeholder="MEMBER, FOUNDER..."
                className="input"
              />
            </div>
            <button
              onClick={handleAddMember}
              disabled={!addPersonId.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {/* Member List */}
          <div className="divide-y divide-gray-50 rounded-lg border border-gray-100">
            {(members ?? []).length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">No members linked</div>
            ) : (
              (members ?? []).map((link) => (
                <div key={link.id} className="flex items-center gap-3 px-4 py-2.5">
                  {link.persons.thumbnail ? (
                    <img
                      src={link.persons.thumbnail}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                      {link.persons.name_en?.charAt(0) ?? '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">
                      {link.persons.name_en}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">{link.persons.slug}</span>
                  </div>
                  {link.link_type && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                      {link.link_type}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveMember(link.persons.id, link.persons.name_en)}
                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Remove"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
