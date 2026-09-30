'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import { PLATFORM_INFO, SUBREDDITS, composePost, findSubreddit, promoLength, type PromoPlatform } from '@/lib/promo';

export interface PromoPost {
  id: string;
  platform: PromoPlatform;
  target: string | null;
  title: string | null;
  body: string;
  hashtags: string[];
  alt_text: string | null;
  is_ai_generated: boolean;
  status: 'draft' | 'posted';
  posted_url: string | null;
  posted_at: string | null;
  updated_at?: string;
  utm_url: string;
}

async function copy(text: string, toast: (m: string, t?: 'error') => void, what = '복사했습니다') {
  try {
    await navigator.clipboard.writeText(text);
    toast(what);
  } catch {
    toast('복사하지 못했습니다 — 직접 선택해서 복사하세요', 'error');
  }
}

export default function PromoPostCard({ post, onChanged }: { post: PromoPost; onChanged: () => void }) {
  const { toast } = useToast();
  const info = PLATFORM_INFO[post.platform];
  const [title, setTitle] = useState(post.title ?? '');
  const [body, setBody] = useState(post.body);
  const [tags, setTags] = useState(post.hashtags.join(' '));
  const [alt, setAlt] = useState(post.alt_text ?? '');
  const [target, setTarget] = useState(post.target ?? '');
  const [postedUrl, setPostedUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const hashtags = tags.split(/[\s,]+/).map((t) => t.replace(/^#/, '')).filter(Boolean);
  const composed = composePost(post.platform, { body, hashtags }, post.utm_url);
  const length = promoLength(post.platform, composed);
  const sub = findSubreddit(target);
  const dirty =
    title !== (post.title ?? '') ||
    body !== post.body ||
    tags !== post.hashtags.join(' ') ||
    alt !== (post.alt_text ?? '') ||
    target !== (post.target ?? '');

  const patch = async (payload: Record<string, unknown>, done: string) => {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/promo/posts/${post.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      toast(done);
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : '수정하지 못했습니다', 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    patch(
      {
        body,
        ...(post.platform === 'reddit' && { title: title.trim() || null, target: target.trim() || null }),
        ...(post.platform === 'instagram' && { hashtags, alt_text: alt.trim() || null }),
      },
      '저장했습니다',
    );

  const remove = async () => {
    if (!confirm('이 초안을 삭제할까요?')) return;
    try {
      await apiFetch(`/api/admin/promo/posts/${post.id}`, { method: 'DELETE' });
      onChanged();
    } catch {
      toast('삭제하지 못했습니다', 'error');
    }
  };

  const posted = post.status === 'posted';

  return (
    <div className={`rounded-xl border p-4 ${posted ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 bg-white'}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-gray-900">
          {info.label}
          {post.platform === 'reddit' && target ? ` · r/${target}` : ''}
        </span>
        {post.is_ai_generated && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">AI 초안</span>}
        {posted && <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-700">게시함</span>}
        <span className={`ml-auto ${length > info.max ? 'font-semibold text-red-600' : 'text-gray-400'}`}>
          {length}/{info.max}
        </span>
      </div>

      {post.platform === 'reddit' && (
        <div className="mb-3 grid gap-2 sm:grid-cols-[160px_1fr]">
          <input
            className="input"
            list="subreddits"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/^r\//i, ''))}
            placeholder="서브레딧"
            aria-label="서브레딧"
          />
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="게시물 제목" aria-label="게시물 제목" maxLength={300} />
          <datalist id="subreddits">
            {SUBREDDITS.map((s) => (
              <option key={s.name} value={s.name} />
            ))}
          </datalist>
          {sub && <p className="text-xs text-amber-700 sm:col-span-2">{sub.notesKo} ({sub.postType} 게시물)</p>}
        </div>
      )}

      <textarea
        className="input min-h-[140px] text-sm"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={post.platform === 'reddit' ? '본문 (이미지 게시물이면 비워 두기)' : '본문'}
        aria-label="게시물 본문"
      />

      {post.platform === 'instagram' && (
        <div className="mt-2 grid gap-2">
          <input className="input text-sm" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="해시태그 (공백으로 구분)" aria-label="해시태그" />
          <textarea className="input min-h-[56px] text-xs" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="이미지 대체 텍스트" aria-label="대체 텍스트" />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {post.platform === 'reddit' ? (
          <>
            <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => copy(title, toast, '제목을 복사했습니다')}>
              제목 복사
            </button>
            <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => copy(body, toast, '본문을 복사했습니다')}>
              본문 복사
            </button>
          </>
        ) : (
          <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => copy(composed, toast)}>
            게시물 복사
          </button>
        )}
        <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => copy(post.utm_url, toast, '링크를 복사했습니다')}>
          링크 복사
        </button>
        {post.platform === 'instagram' && alt && (
          <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => copy(alt, toast, '대체 텍스트를 복사했습니다')}>
            대체 텍스트 복사
          </button>
        )}
        <button type="button" className="btn-primary px-2.5 py-1 text-xs" disabled={!dirty || busy} onClick={save}>
          저장
        </button>
        <button type="button" className="ml-auto text-xs text-red-600 hover:underline" onClick={remove}>
          삭제
        </button>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3">
        {posted ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span>게시일 {post.posted_at ? new Date(post.posted_at).toLocaleDateString('ko-KR') : ''}</span>
            {post.posted_url && (
              <a href={post.posted_url} target="_blank" rel="noopener noreferrer" className="truncate text-brand-700 underline">
                {post.posted_url}
              </a>
            )}
            <button type="button" className="ml-auto text-gray-500 hover:underline" disabled={busy} onClick={() => patch({ posted_url: null }, '초안으로 되돌렸습니다')}>
              되돌리기
            </button>
          </div>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (postedUrl.trim()) patch({ posted_url: postedUrl.trim() }, '게시함으로 기록했습니다');
            }}
          >
            <input
              className="input flex-1 text-xs"
              type="url"
              value={postedUrl}
              onChange={(e) => setPostedUrl(e.target.value)}
              placeholder="게시한 뒤 게시물 URL을 붙여 넣으세요"
              aria-label="게시물 URL"
            />
            <button type="submit" className="btn-secondary px-2.5 py-1 text-xs" disabled={!postedUrl.trim() || busy}>
              게시함으로 기록
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
