'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface Tag {
  id: string;
  name_ko: string;
  name_en: string | null;
  type: string;
}

const TYPE_LABELS: Record<string, string> = {
  ERA: '시대',
  FIELD: '분야',
  CUSTOM: '커스텀',
};

const TYPE_COLORS: Record<string, string> = {
  ERA: 'bg-blue-50 text-blue-700',
  FIELD: 'bg-green-50 text-green-700',
  CUSTOM: 'bg-gray-100 text-gray-600',
};

export default function AdminTagsPage() {
  const { toast } = useToast();
  const { data: tags, isLoading, mutate } = useSWR<Tag[]>(
    '/api/admin/tags',
    fetcher
  );

  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form, setForm] = useState({ name_ko: '', name_en: '', type: 'FIELD' });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({ name_ko: '', name_en: '', type: 'FIELD' });
    setEditingTag(null);
    setShowForm(false);
  };

  const startEdit = (tag: Tag) => {
    setForm({
      name_ko: tag.name_ko,
      name_en: tag.name_en ?? '',
      type: tag.type,
    });
    setEditingTag(tag);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name_ko.trim()) return;

    setSaving(true);
    try {
      const body = {
        name_ko: form.name_ko.trim(),
        name_en: form.name_en.trim() || undefined,
        type: form.type,
      };

      if (editingTag) {
        await apiFetch(`/api/admin/tags/${editingTag.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast('태그가 수정되었습니다');
      } else {
        await apiFetch('/api/admin/tags', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast('태그가 추가되었습니다');
      }

      resetForm();
      mutate();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : '오류가 발생했습니다';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`"${tag.name_ko}" 태그를 삭제하시겠습니까? 연결된 인물 태그도 해제됩니다.`))
      return;

    try {
      await apiFetch(`/api/admin/tags/${tag.id}`, { method: 'DELETE' });
      toast('태그가 삭제되었습니다');
      mutate();
    } catch {
      toast('삭제에 실패했습니다', 'error');
    }
  };

  const grouped = (tags ?? []).reduce<Record<string, Tag[]>>((acc, tag) => {
    const t = tag.type;
    if (!acc[t]) acc[t] = [];
    acc[t].push(tag);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">태그 관리</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            인물에 부여하는 시대/분야 태그를 관리합니다
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary text-sm"
        >
          <svg
            className="mr-1.5 inline h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          태그 추가
        </button>
      </div>

      {/* 태그 추가/수정 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-flat p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {editingTag ? '태그 수정' : '새 태그 추가'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                이름 (한글) *
              </label>
              <input
                type="text"
                value={form.name_ko}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name_ko: e.target.value }))
                }
                placeholder="장군"
                required
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                이름 (영문)
              </label>
              <input
                type="text"
                value={form.name_en}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name_en: e.target.value }))
                }
                placeholder="General"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                유형 *
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, type: e.target.value }))
                }
                className="input"
              >
                <option value="ERA">시대 (ERA)</option>
                <option value="FIELD">분야 (FIELD)</option>
                <option value="CUSTOM">커스텀 (CUSTOM)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !form.name_ko.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? '저장 중...' : editingTag ? '수정' : '추가'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-ghost text-sm"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 태그 목록 */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">로딩 중...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {['ERA', 'FIELD', 'CUSTOM'].map((type) => {
            const typeTags = grouped[type];
            if (!typeTags || typeTags.length === 0) return null;
            return (
              <div key={type} className="card-flat overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {TYPE_LABELS[type] ?? type}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    {typeTags.length}개
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {typeTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {tag.name_ko}
                        </span>
                        {tag.name_en && (
                          <span className="ml-2 text-xs text-gray-400">
                            {tag.name_en}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => startEdit(tag)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        title="수정"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="삭제"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {(tags ?? []).length === 0 && (
            <div className="card-flat py-12 text-center text-gray-400">
              <p className="text-sm">태그가 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
