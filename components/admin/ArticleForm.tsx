'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

const TAGS = [
  { value: '기획', label: 'Feature' },
  { value: '특집', label: 'Special' },
  { value: '인물탐구', label: 'Profile' },
  { value: '현대', label: 'Modern' },
  { value: '공지', label: 'Notice' },
  { value: '안내', label: 'Guide' },
] as const;

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
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    slug: initialData?.slug ?? '',
    title: initialData?.title ?? '',
    body: initialData?.body ?? '',
    summary: initialData?.summary ?? '',
    thumbnail: initialData?.thumbnail ?? '',
    tag: initialData?.tag ?? '기획',
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

  const uploadFile = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast('Only JPG, PNG, and WebP files are allowed', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('File size must be 5MB or less', 'error');
      return;
    }

    setUploading(true);
    try {
      const { upload_url, path } = await apiFetch<{
        upload_url: string;
        path: string;
      }>('/api/upload/presigned-url', {
        method: 'POST',
        body: JSON.stringify({
          bucket: 'articles',
          content_type: file.type,
          file_size: file.size,
        }),
      });

      await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/articles/${path}`;
      setForm((prev) => ({ ...prev, thumbnail: publicUrl }));
      toast('Thumbnail uploaded');
    } catch {
      toast('Upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
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
        toast('Article created');
      } else {
        await apiFetch(`/api/articles/${slug}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast('Article updated');
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
        <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>

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
              {TAGS.map((tag) => (
                <option key={tag.value} value={tag.value}>
                  {tag.label}
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
            placeholder="Short summary shown in lists"
            maxLength={500}
            className="input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Thumbnail
          </label>
          {form.thumbnail ? (
            <div className="relative inline-block">
              <img
                src={form.thumbnail}
                alt="Thumbnail preview"
                className="h-40 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, thumbnail: '' }))}
                className="absolute -right-2 -top-2 rounded-full bg-gray-800 p-1 text-white transition-colors hover:bg-gray-600"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 transition-colors ${
                dragging
                  ? 'border-brand-400 bg-brand-50/50'
                  : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/30'
              }`}
            >
              {uploading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
                  <span className="text-sm">Uploading...</span>
                </div>
              ) : (
                <>
                  <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <span className="mt-2 text-xs text-gray-400">
                    Click or drag to upload an image (JPG, PNG, WebP / 5MB)
                  </span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleThumbnailUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Body *
          </label>
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            placeholder="Write the article body (Markdown supported)"
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
              Show this article in public article lists
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
              Display a notice badge at the top
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
