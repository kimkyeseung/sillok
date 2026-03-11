'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface ReplyFormProps {
  threadId: string;
  parentId?: string;
  onSuccess?: () => void;
}

export default function ReplyForm({ threadId, parentId, onSuccess }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await apiFetch(`/api/threads/${threadId}/replies`, {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          ...(parentId ? { parent_id: parentId } : {}),
        }),
      });
      setContent('');
      toast('댓글이 작성되었습니다');
      onSuccess?.();
      router.refresh();
    } catch {
      toast('로그인이 필요합니다', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
        maxLength={2000}
        className="input flex-1"
      />
      <button
        type="submit"
        disabled={submitting || !content.trim()}
        className="btn-primary shrink-0 disabled:opacity-50"
      >
        {submitting ? '...' : '등록'}
      </button>
    </form>
  );
}
