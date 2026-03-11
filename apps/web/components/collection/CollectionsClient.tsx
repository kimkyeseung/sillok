'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import Modal from '@/components/common/Modal';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  item_count: number;
  created_at: string;
}

interface CollectionsResponse {
  items: Collection[];
  has_next: boolean;
}

export default function CollectionsClient() {
  const { data, isLoading, mutate } = useSWR<CollectionsResponse>(
    '/api/collections?limit=30',
    fetcher
  );
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/collections', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          ...(desc ? { description: desc.trim() } : {}),
        }),
      });
      toast('컬렉션이 생성되었습니다');
      setShowCreate(false);
      setName('');
      setDesc('');
      mutate();
    } catch {
      toast('로그인이 필요합니다', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">컬렉션</h1>
          <p className="mt-0.5 text-sm text-gray-500">관심있는 인물을 모아보세요</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">
          새 컬렉션
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">로딩 중...</span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(data?.items ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.id}`}
              className="card p-4"
            >
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                {!c.is_public && (
                  <span className="badge-gray text-[10px]">비공개</span>
                )}
              </div>
              {c.description && (
                <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{c.description}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">인물 {c.item_count}명</p>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && (data?.items ?? []).length === 0 && (
        <div className="card-flat flex flex-col items-center py-16">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">컬렉션이 없습니다</p>
          <p className="text-xs text-gray-400">첫 컬렉션을 만들어보세요!</p>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="새 컬렉션 만들기">
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="컬렉션 이름"
            maxLength={100}
            className="input"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="설명 (선택)"
            rows={3}
            className="input resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-xs">
              취소
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting || !name.trim()}
              className="btn-primary text-xs disabled:opacity-50"
            >
              {submitting ? '생성 중...' : '만들기'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
