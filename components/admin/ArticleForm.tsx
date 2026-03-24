'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

const TAGS = ['기획', '특집', '인물탐구', '현대', '공지', '안내'] as const;

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
        toast('아티클이 작성되었습니다');
      } else {
        await apiFetch(`/api/articles/${slug}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast('아티클이 수정되었습니다');
      }

      router.push('/admin/articles');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : '오류가 발생했습니다';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card-flat p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">기본 정보</h2>

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
              태그 *
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
            제목 *
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="아티클 제목"
            maxLength={300}
            required
            className="input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            요약
          </label>
          <input
            type="text"
            name="summary"
            value={form.summary}
            onChange={handleChange}
            placeholder="간단한 요약 (목록에 표시됩니다)"
            maxLength={500}
            className="input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            썸네일 URL
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
            본문 *
          </label>
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            placeholder="아티클 본문을 작성하세요 (Markdown 지원)"
            rows={15}
            required
            className="input resize-none font-mono text-sm"
          />
        </div>
      </div>

      {/* 옵션 */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">옵션</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_published"
            checked={form.is_published}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">공개</span>
            <p className="text-xs text-gray-500">
              체크하면 아티클 목록에 노출됩니다
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
            <span className="text-sm font-medium text-gray-900">공지</span>
            <p className="text-xs text-gray-500">
              체크하면 상단에 공지 배지가 표시됩니다
            </p>
          </div>
        </label>
      </div>

      {/* 제출 */}
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
            ? '저장 중...'
            : mode === 'create'
              ? '아티클 작성'
              : '수정 저장'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/articles')}
          className="btn-ghost"
        >
          취소
        </button>
      </div>
    </form>
  );
}
