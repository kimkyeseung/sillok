'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

const TAGS = ['Feature', 'Special', 'Profile', 'Modern', 'Notice', 'Guide'] as const;

interface ArticleData {
  slug: string;
  title: string;
  body: string;
  summary?: string | null;
  thumbnail?: string | null;
  tag: string;
  is_notice: boolean;
  is_published: boolean;
}

interface ArticleFormProps {
  mode: 'create' | 'edit';
  initialData?: ArticleData;
  slug?: string;
}

export default function ArticleForm({
  mode,
  initialData,
  slug,
}: ArticleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    slug: initialData?.slug ?? '',
    title: initialData?.title ?? '',
    body: initialData?.body ?? '',
    summary: initialData?.summary ?? '',
    thumbnail: initialData?.thumbnail ?? '',
    tag: initialData?.tag ?? 'Feature',
    is_notice: initialData?.is_notice ?? false,
    is_published: initialData?.is_published ?? false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.title.trim() || !form.body.trim()) return;

    setSaving(true);
    try {
      const body = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        body: form.body,
        summary: form.summary.trim() || undefined,
        thumbnail: form.thumbnail.trim() || undefined,
        tag: form.tag,
        is_notice: form.is_notice,
        is_published: form.is_published,
      };

      if (mode === 'create') {
        await apiFetch('/api/articles', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast('Article has been created');
      } else {
        await apiFetch(`/api/articles/${slug}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast('Article has been updated');
      }

      router.push('/admin/articles');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'An error occurred';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

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
              placeholder="my-article"
              pattern="[a-z0-9\-]+"
              required
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Tag *
            </label>
            <select
              name="tag"
              value={form.tag}
              onChange={handleChange}
              className="input"
            >
              {TAGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Article title"
            maxLength={300}
            required
            className="input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Summary
          </label>
          <input
            type="text"
            name="summary"
            value={form.summary}
            onChange={handleChange}
            placeholder="Brief summary (shown in listing)"
            maxLength={500}
            className="input"
          />
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
            Body *
          </label>
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            placeholder="Write article body (Markdown supported)"
            rows={15}
            required
            className="input resize-none font-mono text-sm"
          />
        </div>
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
              Visible in the article listing when checked
            </p>
          </div>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_notice"
            checked={form.is_notice}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Notice</span>
            <p className="text-xs text-gray-500">
              Shows a notice badge at the top when checked
            </p>
          </div>
        </label>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={
            saving ||
            !form.slug.trim() ||
            !form.title.trim() ||
            !form.body.trim()
          }
          className="btn-primary disabled:opacity-50"
        >
          {saving
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Article'
              : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/articles')}
          className="btn-ghost"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
