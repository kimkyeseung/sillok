'use client';

import { useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface Reign {
  id: string;
  reign_start: number;
  reign_end: number;
  persons: { id: string; slug: string; name_en: string | null; name_ko: string } | null;
}

interface ReignPage {
  items: Reign[];
  has_next: boolean;
  next_cursor: string | null;
}

const EMPTY_FORM = { person_slug: '', reign_start: '', reign_end: '' };

const pageKey = (index: number, prev: ReignPage | null) => {
  if (prev && !prev.has_next) return null;
  const cursor = prev?.next_cursor ? `&cursor=${encodeURIComponent(prev.next_cursor)}` : '';
  return `/api/admin/reigns?limit=200${cursor}`;
};

export default function AdminReignsPage() {
  const { toast } = useToast();
  const { data: pages, isLoading, mutate, size, setSize } = useSWRInfinite<ReignPage>(pageKey, fetcher);
  const reigns = pages?.flatMap((p) => p.items);
  const hasMore = pages?.[pages.length - 1]?.has_next ?? false;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reign | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (reign: Reign) => {
    setForm({
      person_slug: reign.persons?.slug ?? '',
      reign_start: String(reign.reign_start),
      reign_end: String(reign.reign_end),
    });
    setEditing(reign);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = parseInt(form.reign_start, 10);
    const end = parseInt(form.reign_end, 10);
    if (!form.person_slug.trim() || isNaN(start) || isNaN(end)) return;
    if (end < start) {
      toast('종료 연도는 시작 연도와 같거나 이후여야 합니다', 'error');
      return;
    }

    setSaving(true);
    try {
      const body = JSON.stringify({
        person_slug: form.person_slug.trim(),
        reign_start: start,
        reign_end: end,
      });
      if (editing) {
        await apiFetch(`/api/admin/reigns/${editing.id}`, { method: 'PUT', body });
        toast('재위를 수정했습니다');
      } else {
        await apiFetch('/api/admin/reigns', { method: 'POST', body });
        toast('재위를 추가했습니다');
      }
      resetForm();
      mutate();
    } catch (err) {
      toast(err instanceof Error ? err.message : '오류가 발생했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reign: Reign) => {
    const name = reign.persons?.name_en || reign.persons?.name_ko || 'this reign';
    if (!confirm(`${name}의 ${reign.reign_start}–${reign.reign_end} 재위를 삭제할까요?`)) return;
    try {
      await apiFetch(`/api/admin/reigns/${reign.id}`, { method: 'DELETE' });
      toast('재위를 삭제했습니다');
      mutate();
    } catch {
      toast('삭제하지 못했습니다', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">재위</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Age Flow에 현재 왕으로 표시되는 재위 기간입니다. 복위한 왕은 재위마다 한 줄씩 등록합니다.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary text-sm"
        >
          재위 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-flat space-y-4 p-5">
          <h2 className="text-sm font-semibold text-gray-900">{editing ? 'Edit Reign' : 'Add New Reign'}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">인물 slug *</label>
              <input
                type="text"
                value={form.person_slug}
                onChange={(e) => setForm((p) => ({ ...p, person_slug: e.target.value }))}
                placeholder="sejong-daewang"
                required
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">시작 연도 *</label>
              <input
                type="number"
                value={form.reign_start}
                onChange={(e) => setForm((p) => ({ ...p, reign_start: e.target.value }))}
                placeholder="1418"
                required
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">종료 연도 *</label>
              <input
                type="number"
                value={form.reign_end}
                onChange={(e) => setForm((p) => ({ ...p, reign_end: e.target.value }))}
                placeholder="1450"
                required
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? '저장 중...' : editing ? '수정' : '추가'}
            </button>
            <button type="button" onClick={resetForm} className="btn-ghost text-sm">
              취소
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      ) : (reigns ?? []).length === 0 ? (
        <div className="card-flat py-12 text-center text-gray-400">
          <p className="text-sm">등록된 재위가 없습니다</p>
        </div>
      ) : (
        <div className="card-flat divide-y divide-gray-50 overflow-hidden">
          {(reigns ?? []).map((reign) => (
            <div key={reign.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
              <span className="w-24 shrink-0 font-mono text-sm text-gray-500">
                {reign.reign_start}–{reign.reign_end}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {reign.persons?.name_en || reign.persons?.name_ko || '알 수 없는 인물'}
                </span>
                {reign.persons && <span className="ml-2 text-xs text-gray-400">{reign.persons.slug}</span>}
              </div>
              <button
                onClick={() => startEdit(reign)}
                className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                수정
              </button>
              <button
                onClick={() => handleDelete(reign)}
                className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600"
              >
                삭제
              </button>
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => setSize(size + 1)}
              className="w-full py-3 text-center text-sm text-brand-600 hover:bg-gray-50"
            >
              더 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
