'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiFetch, fetcher } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import { uploadPersonImage } from '@/lib/upload';
import ImageCropModal from '@/components/admin/ImageCropModal';
import useSWR from 'swr';

interface Tag {
  id: string;
  name_ko: string;
  name_en: string | null;
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
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.thumbnail ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Upload thumbnail file if pending
      let thumbnailUrl = form.thumbnail.trim() || undefined;
      if (pendingFile) {
        // For create mode, we need the person ID after creation
        // For edit mode, we can use the existing slug to find the person
        if (mode === 'edit' && slug) {
          // Get person ID from slug
          const personData = await fetcher<{ id: string }>(`/api/persons/${slug}`);
          setUploading(true);
          thumbnailUrl = await uploadPersonImage(pendingFile, personData.id);
          setUploading(false);
        }
        // For create mode, we'll upload after creation below
      }

      const body: Record<string, unknown> = {
        slug: form.slug.trim(),
        name_ko: form.name_ko.trim(),
        name_hanja: form.name_hanja.trim() || undefined,
        name_en: form.name_en.trim() || undefined,
        birth_year: form.birth_year ? parseInt(form.birth_year) : undefined,
        death_year: form.death_year ? parseInt(form.death_year) : undefined,
        birth_place: form.birth_place.trim() || undefined,
        summary: form.summary.trim() || undefined,
        is_controversial: form.is_controversial,
        is_alive: form.is_alive,
        is_published: form.is_published,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      };

      if (thumbnailUrl) body.thumbnail = thumbnailUrl;
      if (!previewUrl) body.thumbnail = null;

      if (mode === 'create') {
        const created = await apiFetch<{ id: string }>('/api/persons', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        // Upload thumbnail after creation (now we have the ID)
        if (pendingFile && created.id) {
          setUploading(true);
          const url = await uploadPersonImage(pendingFile, created.id);
          await apiFetch(`/api/persons/${form.slug.trim()}`, {
            method: 'PUT',
            body: JSON.stringify({ thumbnail: url }),
          });
          setUploading(false);
        }
        toast('Person created');
      } else {
        await apiFetch(`/api/persons/${slug}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast('Person updated');
      }

      router.push('/admin/persons');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : '오류가 발생했습니다';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Group tags by type
  const tagsByType = allTags.reduce<Record<string, Tag[]>>((acc, tag) => {
    const t = tag.type || '기타';
    if (!acc[t]) acc[t] = [];
    acc[t].push(tag);
    return acc;
  }, {});

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
              placeholder="sejong-daewang"
              pattern="[a-z0-9\-]+"
              required
              className="input"
            />
            <p className="mt-1 text-xs text-gray-400">
              영문 소문자, 숫자, 하이픈만 사용
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              이름 (한글) *
            </label>
            <input
              type="text"
              name="name_ko"
              value={form.name_ko}
              onChange={handleChange}
              placeholder="세종대왕"
              required
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              이름 (한자)
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
              이름 (영문)
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
              출생 연도
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
              사망 연도
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
              출생지
            </label>
            <input
              type="text"
              name="birth_place"
              value={form.birth_place}
              onChange={handleChange}
              placeholder="한양"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-gray-600">
            Thumbnail
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-gray-300 transition-colors hover:border-brand-400"
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Thumbnail"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400 group-hover:text-brand-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                  toast('File must be 10MB or less', 'error');
                  return;
                }
                // Open crop modal
                setCropSrc(URL.createObjectURL(file));
                e.target.value = '';
              }}
            />
            <div className="text-xs text-gray-400">
              <p>Click to upload image</p>
              <p>JPEG, PNG, WebP / Max 5MB</p>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setPendingFile(null);
                    setForm((prev) => ({ ...prev, thumbnail: '' }));
                  }}
                  className="mt-1 text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            소개
          </label>
          <textarea
            name="summary"
            value={form.summary}
            onChange={handleChange}
            placeholder="인물에 대한 소개를 작성하세요"
            rows={5}
            maxLength={5000}
            className="input resize-none"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {form.summary.length}/5000
          </p>
        </div>
      </div>

      {/* 태그 선택 */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">태그</h2>
        {Object.keys(tagsByType).length > 0 ? (
          Object.entries(tagsByType).map(([type, typeTags]) => (
            <div key={type}>
              <p className="mb-2 text-xs font-medium text-gray-500">
                {type === 'ERA' ? '시대' : type === 'FIELD' ? '분야' : type}
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
                    {tag.name_en || tag.name_ko}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400">태그가 없습니다</p>
        )}
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
              체크하면 목록에 노출됩니다
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
            <span className="text-sm font-medium text-gray-900">논란 인물</span>
            <p className="text-xs text-gray-500">
              체크하면 논란 배지가 표시됩니다
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
            <span className="text-sm font-medium text-gray-900">생존 인물</span>
            <p className="text-xs text-gray-500">
              현재 살아있는 인물
            </p>
          </div>
        </label>
      </div>

      {/* 제출 */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !form.slug.trim() || !form.name_ko.trim()}
          className="btn-primary disabled:opacity-50"
        >
          {saving
            ? '저장 중...'
            : mode === 'create'
              ? '인물 등록'
              : '수정 저장'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/persons')}
          className="btn-ghost"
        >
          취소
        </button>
      </div>
      {/* Crop modal */}
      {cropSrc && (
        <ImageCropModal
          open={!!cropSrc}
          imageSrc={cropSrc}
          onClose={() => {
            setCropSrc(null);
          }}
          onComplete={(croppedFile) => {
            setPendingFile(croppedFile);
            setPreviewUrl(URL.createObjectURL(croppedFile));
            setCropSrc(null);
          }}
        />
      )}
    </form>
  );
}
