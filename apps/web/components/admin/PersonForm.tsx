'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, fetcher } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import useSWR from 'swr';

interface Tag {
  id: string;
  name: string;
  type: string;
}

interface PersonData {
  slug: string;
  name_ko: string;
  name_hanja?: string | null;
  name_en?: string | null;
  birth_year?: number | null;
  death_year?: number | null;
  birth_place?: string | null;
  summary?: string | null;
  thumbnail?: string | null;
  is_controversial: boolean;
  is_alive: boolean;
  is_published: boolean;
  person_tags?: Array<{ tag_id: string; tags: Tag }>;
}

interface PersonFormProps {
  mode: 'create' | 'edit';
  initialData?: PersonData;
  slug?: string;
}

export default function PersonForm({ mode, initialData, slug }: PersonFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    slug: initialData?.slug ?? '',
    name_ko: initialData?.name_ko ?? '',
    name_hanja: initialData?.name_hanja ?? '',
    name_en: initialData?.name_en ?? '',
    birth_year: initialData?.birth_year?.toString() ?? '',
    death_year: initialData?.death_year?.toString() ?? '',
    birth_place: initialData?.birth_place ?? '',
    summary: initialData?.summary ?? '',
    thumbnail: initialData?.thumbnail ?? '',
    is_controversial: initialData?.is_controversial ?? false,
    is_alive: initialData?.is_alive ?? false,
    is_published: initialData?.is_published ?? false,
  });

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.person_tags?.map((pt) => pt.tag_id) ?? []
  );

  // Fetch all tags
  const { data: tagsData } = useSWR<Tag[]>('/api/admin/tags', fetcher);
  const allTags = tagsData ?? [];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.name_ko.trim()) return;

    setSaving(true);
    try {
      const body = {
        slug: form.slug.trim(),
        name_ko: form.name_ko.trim(),
        name_hanja: form.name_hanja.trim() || undefined,
        name_en: form.name_en.trim() || undefined,
        birth_year: form.birth_year ? parseInt(form.birth_year) : undefined,
        death_year: form.death_year ? parseInt(form.death_year) : undefined,
        birth_place: form.birth_place.trim() || undefined,
        summary: form.summary.trim() || undefined,
        thumbnail: form.thumbnail.trim() || undefined,
        is_controversial: form.is_controversial,
        is_alive: form.is_alive,
        is_published: form.is_published,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      };

      if (mode === 'create') {
        await apiFetch('/api/persons', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast('Person has been registered');
      } else {
        await apiFetch(`/api/persons/${slug}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast('Person has been updated');
      }

      router.push('/admin/persons');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'An error occurred';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Group tags by type
  const tagsByType = allTags.reduce<Record<string, Tag[]>>((acc, tag) => {
    const t = tag.type || 'Other';
    if (!acc[t]) acc[t] = [];
    acc[t].push(tag);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card-flat p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Basic Info</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Slug (URL) *
            </label>
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="sejong-daewang"
              pattern="[a-z0-9\-]+"
              required
              className="input"
            />
            <p className="mt-1 text-xs text-gray-400">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Name (Korean) *
            </label>
            <input
              type="text"
              name="name_ko"
              value={form.name_ko}
              onChange={handleChange}
              placeholder="Sejong the Great"
              required
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Name (Hanja)
            </label>
            <input
              type="text"
              name="name_hanja"
              value={form.name_hanja}
              onChange={handleChange}
              placeholder="世宗大王"
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Name (English)
            </label>
            <input
              type="text"
              name="name_en"
              value={form.name_en}
              onChange={handleChange}
              placeholder="King Sejong the Great"
              className="input"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Birth Year
            </label>
            <input
              type="number"
              name="birth_year"
              value={form.birth_year}
              onChange={handleChange}
              placeholder="1397"
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Death Year
            </label>
            <input
              type="number"
              name="death_year"
              value={form.death_year}
              onChange={handleChange}
              placeholder="1450"
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Birthplace
            </label>
            <input
              type="text"
              name="birth_place"
              value={form.birth_place}
              onChange={handleChange}
              placeholder="Hanyang"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Thumbnail URL
          </label>
          <input
            type="url"
            name="thumbnail"
            value={form.thumbnail}
            onChange={handleChange}
            placeholder="https://..."
            className="input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Description
          </label>
          <textarea
            name="summary"
            value={form.summary}
            onChange={handleChange}
            placeholder="Write a description about this person"
            rows={5}
            maxLength={5000}
            className="input resize-none"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {form.summary.length}/5000
          </p>
        </div>
      </div>

      {/* Tag Selection */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Tags</h2>
        {Object.keys(tagsByType).length > 0 ? (
          Object.entries(tagsByType).map(([type, typeTags]) => (
            <div key={type}>
              <p className="mb-2 text-xs font-medium text-gray-500">
                {type === 'ERA' ? 'Era' : type === 'FIELD' ? 'Field' : type}
              </p>
              <div className="flex flex-wrap gap-2">
                {typeTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedTagIds.includes(tag.id)
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400">No tags available</p>
        )}
      </div>

      {/* Options */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Options</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_published"
            checked={form.is_published}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Published</span>
            <p className="text-xs text-gray-500">
              Visible in the public listing when checked
            </p>
          </div>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_controversial"
            checked={form.is_controversial}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Controversial</span>
            <p className="text-xs text-gray-500">
              Shows a controversy badge when checked
            </p>
          </div>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_alive"
            checked={form.is_alive}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Living Person</span>
            <p className="text-xs text-gray-500">
              Currently alive
            </p>
          </div>
        </label>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !form.slug.trim() || !form.name_ko.trim()}
          className="btn-primary disabled:opacity-50"
        >
          {saving
            ? 'Saving...'
            : mode === 'create'
              ? 'Register Person'
              : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/persons')}
          className="btn-ghost"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
