'use client';

import Link from 'next/link';
import useSWR, { useSWRConfig } from 'swr';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, fetcher } from '@/lib/fetcher';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/components/common/Toast';

export type ItemTargetType = 'HIGHLIGHT' | 'GALLERY' | 'PORTRAYAL';

interface ItemSummary {
  likes: number;
  comments: number;
  liked: boolean;
}

const summaryKey = (slug: string) => `/api/persons/${slug}/reactions`;
const EMPTY: ItemSummary = { likes: 0, comments: 0, liked: false };

interface Props {
  slug: string;
  targetType: ItemTargetType;
  targetKey: string;
  /** Light text on dark backgrounds (gallery viewer) */
  tone?: 'light' | 'dark';
}

/** ♥ and 💬 for one item on a person page; comments open inline below */
export default function ItemReactions({ slug, targetType, targetKey, tone = 'dark' }: Props) {
  // One summary request per page, shared by every item
  const { data, mutate } = useSWR<{ items: Record<string, ItemSummary> }>(summaryKey(slug), fetcher);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const id = `${targetType}:${targetKey}`;
  const summary = data?.items[id] ?? EMPTY;
  const muted = tone === 'light' ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700';

  const toggleHeart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Optimistic update
    const optimistic = {
      ...summary,
      liked: !summary.liked,
      likes: summary.likes + (summary.liked ? -1 : 1),
    };
    mutate((d) => ({ items: { ...(d?.items ?? {}), [id]: optimistic } }), { revalidate: false });
    try {
      const res = await apiFetch<{ liked: boolean; likes: number }>(summaryKey(slug), {
        method: 'POST',
        body: JSON.stringify({ target_type: targetType, target_key: targetKey }),
      });
      mutate((d) => ({ items: { ...(d?.items ?? {}), [id]: { ...optimistic, ...res } } }), { revalidate: false });
    } catch (err) {
      mutate();
      toast(err instanceof Error ? err.message : 'Could not update', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={toggleHeart}
          aria-pressed={summary.liked}
          aria-label={summary.liked ? 'Remove heart' : 'Add heart'}
          className={`inline-flex items-center gap-1 transition-colors ${
            summary.liked ? 'text-rose-500' : muted
          }`}
        >
          <span aria-hidden="true">{summary.liked ? '♥' : '♡'}</span>
          {summary.likes > 0 && summary.likes}
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1 transition-colors ${open ? 'text-brand-600' : muted}`}
        >
          <span aria-hidden="true">💬</span>
          {summary.comments > 0 ? summary.comments : 'Comment'}
        </button>
      </div>
      {open && <ItemComments slug={slug} targetType={targetType} targetKey={targetKey} tone={tone} />}
    </div>
  );
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: { id: string; nickname: string | null; avatar_url: string | null };
}

function ItemComments({ slug, targetType, targetKey, tone }: Required<Omit<Props, 'tone'>> & { tone: 'light' | 'dark' }) {
  const listKey = `/api/persons/${slug}/comments?target_type=${targetType}&target_key=${encodeURIComponent(targetKey)}`;
  const { data, mutate } = useSWR<{ items: Comment[]; has_next: boolean; next_cursor: string | null }>(listKey, fetcher);
  const [more, setMore] = useState<Comment[]>([]);
  // null until "Show more" is used; afterwards holds the next cursor (null = no more pages)
  const [pager, setPager] = useState<{ cursor: string | null } | null>(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const { mutate: mutateGlobal } = useSWRConfig();
  const { user } = useAuth();
  const { toast } = useToast();

  const comments = [...(data?.items ?? []), ...more];
  const nextCursor = pager ? pager.cursor : data?.has_next ? data.next_cursor : null;
  const hasNext = !!nextCursor;
  const dark = tone === 'light';

  const refresh = async () => {
    setMore([]);
    setPager(null);
    await Promise.all([mutate(), mutateGlobal(summaryKey(slug))]);
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    const res = await apiFetch<{ items: Comment[]; has_next: boolean; next_cursor: string | null }>(
      `${listKey}&cursor=${encodeURIComponent(nextCursor)}`
    );
    setMore((m) => [...m, ...res.items]);
    setPager({ cursor: res.has_next ? res.next_cursor : null });
  };

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`/api/persons/${slug}/comments`, {
        method: 'POST',
        body: JSON.stringify({ target_type: targetType, target_key: targetKey, content: text.trim() }),
      });
      setText('');
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not post your comment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await apiFetch(`/api/person-item-comments/${id}`, { method: 'DELETE' });
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete', 'error');
    }
  };

  const report = async (id: string) => {
    if (!confirm('Report this comment to the moderators?')) return;
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({ target_type: 'PERSON_ITEM_COMMENT', target_id: id, reason: 'OTHER' }),
      });
      toast('Thanks — moderators will take a look.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not report', 'error');
    }
  };

  return (
    <div
      className={`mt-2 space-y-2 rounded-lg p-3 text-sm ${
        dark ? 'bg-white/10 text-white' : 'bg-gray-50 text-gray-800'
      }`}
    >
      {comments.length === 0 && (
        <p className={`text-xs ${dark ? 'text-white/60' : 'text-gray-400'}`}>No comments yet.</p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="group">
          <p className="text-xs">
            <span className="font-semibold">{c.author.nickname ?? 'Member'}</span>
            <span className={`ml-2 ${dark ? 'text-white/50' : 'text-gray-400'}`}>
              {new Date(c.created_at).toLocaleDateString()}
            </span>
            {user &&
              (user.id === c.author.id ? (
                <button type="button" onClick={() => remove(c.id)} className="ml-2 text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100">
                  Delete
                </button>
              ) : (
                <button type="button" onClick={() => report(c.id)} className={`ml-2 opacity-0 group-hover:opacity-100 focus:opacity-100 ${dark ? 'text-white/60' : 'text-gray-400'}`}>
                  Report
                </button>
              ))}
          </p>
          <p className="whitespace-pre-wrap break-words">{c.content}</p>
        </div>
      ))}
      {hasNext && (
        <button type="button" onClick={loadMore} className="text-xs font-medium text-brand-500 hover:underline">
          Show more comments
        </button>
      )}
      {user ? (
        <div className="flex gap-2 pt-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && submit()}
            maxLength={1000}
            placeholder="Write a comment…"
            className={`min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-sm ${
              dark ? 'border-white/20 bg-white/10 text-white placeholder-white/50' : 'border-gray-200 bg-white'
            }`}
          />
          <button
            type="button"
            onClick={submit}
            disabled={saving || !text.trim()}
            className="rounded-md bg-brand-600 px-3 text-xs font-medium text-white disabled:opacity-50"
          >
            Post
          </button>
        </div>
      ) : (
        <Link href="/login" className="block text-xs font-medium text-brand-500 hover:underline">
          Log in to comment
        </Link>
      )}
    </div>
  );
}
