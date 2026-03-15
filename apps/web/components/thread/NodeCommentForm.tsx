'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface NodeCommentFormProps {
  nodeSlug: string;
}

export default function NodeCommentForm({ nodeSlug }: NodeCommentFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await apiFetch(`/api/nodes/${nodeSlug}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      });
      setContent('');
      toast('Comment posted');
      router.refresh();
    } catch {
      toast('Login required', 'error');
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
        placeholder="Write a comment..."
        maxLength={2000}
        className="input flex-1"
      />
      <button
        type="submit"
        disabled={submitting || !content.trim()}
        className="btn-primary shrink-0 disabled:opacity-50"
      >
        {submitting ? '...' : 'Post'}
      </button>
    </form>
  );
}
