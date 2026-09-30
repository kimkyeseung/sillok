'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import { FORMAT_DEFS, TEMPLATE_FORMATS, type MemeStatus, type TemplateFormat } from '@/lib/meme';
import { toJpeg, uploadMemeImage } from '@/lib/upload';
import { FORMAT_KO } from '@/lib/meme-formats-ko';
import MemeEditor, { memeImageUrl, type AdminMeme } from '@/components/admin/MemeEditor';

interface MemePage {
  items: AdminMeme[];
  has_next: boolean;
  next_cursor: string | null;
}

interface CreateResult {
  created: AdminMeme[];
  skipped: number;
}

const STATUS_TABS: { value: MemeStatus; label: string }[] = [
  { value: 'draft', label: '초안' },
  { value: 'published', label: '게시됨' },
  { value: 'rejected', label: '반려됨' },
];

const MAX_UPLOAD = 5 * 1024 * 1024;

export default function AdminMemesPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<MemeStatus>('draft');
  const { data: pages, isLoading, mutate, size, setSize } = useSWRInfinite<MemePage>(
    (index, prev: MemePage | null) => {
      if (prev && !prev.has_next) return null;
      const cursor = prev?.next_cursor ? `&cursor=${encodeURIComponent(prev.next_cursor)}` : '';
      return `/api/admin/memes?status=${status}&limit=24${cursor}`;
    },
    fetcher,
  );
  const memes = pages?.flatMap((p) => p.items) ?? [];
  const hasMore = pages?.[pages.length - 1]?.has_next ?? false;

  const [editing, setEditing] = useState<AdminMeme | null>(null);
  const closeEditor = useCallback(() => setEditing(null), []);

  // ─── Generate form ───
  // 'story' = text-only short fiction; the rest are wojak templates
  const [format, setFormat] = useState<TemplateFormat | 'story'>('feels-bro');
  const [slug1, setSlug1] = useState('');
  const [slug2, setSlug2] = useState('');
  const [eventSlug, setEventSlug] = useState('');
  const [autoCount, setAutoCount] = useState(3);
  const [generating, setGenerating] = useState<'manual' | 'auto' | null>(null);

  // ─── Translate form ───
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceCredit, setSourceCredit] = useState('');
  const [translateSlugs, setTranslateSlugs] = useState('');
  const [translating, setTranslating] = useState(false);

  const afterCreate = (res: CreateResult, what: string) => {
    toast(`${what} ${res.created.length}개 생성${res.skipped ? ` · ${res.skipped}개 건너뜀` : ''}`);
    if (status !== 'draft') setStatus('draft');
    else mutate();
    if (res.created.length === 1) setEditing(res.created[0]);
  };

  const generate = async (mode: 'manual' | 'auto') => {
    setGenerating(mode);
    try {
      const body =
        mode === 'auto'
          ? { mode, count: autoCount }
          : {
              ...(format === 'story' ? { mode: 'story' } : { mode, format }),
              person_slugs: [slug1, slug2].map((s) => s.trim()).filter(Boolean),
              ...(eventSlug.trim() && { event_slug: eventSlug.trim() }),
            };
      const res = await apiFetch<CreateResult>('/api/admin/memes', { method: 'POST', body: JSON.stringify(body) });
      afterCreate(res, format === 'story' && mode === 'manual' ? '짧은 소설' : '밈');
    } catch (err) {
      toast(err instanceof Error ? err.message : '생성하지 못했습니다', 'error');
    } finally {
      setGenerating(null);
    }
  };

  const translate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setTranslating(true);
    try {
      const { blob, width, height } = await toJpeg(file);
      if (blob.size > MAX_UPLOAD) throw new Error('압축 후에도 이미지가 5MB를 넘습니다.');
      const imageUrl = await uploadMemeImage(blob);
      const res = await apiFetch<CreateResult>('/api/admin/memes/translate', {
        method: 'POST',
        body: JSON.stringify({
          image_url: imageUrl,
          width,
          height,
          ...(sourceUrl.trim() && { source_url: sourceUrl.trim() }),
          ...(sourceCredit.trim() && { source_credit: sourceCredit.trim() }),
          ...(translateSlugs.trim() && {
            person_slugs: translateSlugs
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean),
          }),
        }),
      });
      setFile(null);
      setSourceUrl('');
      setSourceCredit('');
      setTranslateSlugs('');
      (document.getElementById('meme-file') as HTMLInputElement | null)?.form?.reset();
      afterCreate(res, '번역');
    } catch (err) {
      toast(err instanceof Error ? err.message : '번역하지 못했습니다', 'error');
    } finally {
      setTranslating(false);
    }
  };

  const setMemeStatus = async (m: AdminMeme, next: MemeStatus) => {
    try {
      await apiFetch(`/api/admin/memes/${m.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      toast(next === 'published' ? '스레드로 게시했습니다' : next === 'rejected' ? '반려됨' : '스레드를 숨기고 초안으로 옮겼습니다');
      mutate();
    } catch (err) {
      toast(err instanceof Error ? err.message : '수정하지 못했습니다', 'error');
    }
  };

  const remove = async (m: AdminMeme) => {
    if (!confirm('이 초안을 삭제할까요?')) return;
    try {
      await apiFetch(`/api/admin/memes/${m.id}`, { method: 'DELETE' });
      toast('삭제했습니다');
      mutate();
    } catch (err) {
      toast(err instanceof Error ? err.message : '삭제하지 못했습니다', 'error');
    }
  };

  const twoFigures = format !== 'story' && FORMAT_DEFS[format].figures.min === 2;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI 초안</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Claude가 쓴 워작 밈·짧은 소설·한국 짤 영어 번역 초안입니다. 초안은 비공개이고, 게시하면 해당 인물의 일반 스레드가 됩니다.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Wojak generator ─── */}
        <section className="card-flat space-y-4 p-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">밈 또는 짧은 소설 생성</h2>
            <p className="text-xs text-gray-500">게시된 근대 이전 인물만 가능합니다. Claude가 DB의 사실을 바탕으로 씁니다.</p>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">형식</span>
            <select className="input" value={format} onChange={(e) => setFormat(e.target.value as TemplateFormat | 'story')}>
              {TEMPLATE_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {FORMAT_KO[f].label} — {FORMAT_KO[f].description}
                </option>
              ))}
              <option value="story">짧은 소설 — 반전으로 끝나는 글만 있는 스레드</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">인물 1 slug</span>
              <input className="input" value={slug1} onChange={(e) => setSlug1(e.target.value)} placeholder="yi-sun-sin" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                인물 2 slug {twoFigures ? '' : '(선택, 맥락용)'}
              </span>
              <input className="input" value={slug2} onChange={(e) => setSlug2(e.target.value)} placeholder="won-gyun" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">사건 slug (선택)</span>
            <input className="input" value={eventSlug} onChange={(e) => setEventSlug(e.target.value)} placeholder="imjin-war" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={!!generating || !slug1.trim() || (twoFigures && !slug2.trim())}
              onClick={() => generate('manual')}
            >
              {generating === 'manual' ? '생성 중…' : '생성'}
            </button>
            <span className="mx-1 text-xs text-gray-400">또는</span>
            <select
              className="input w-auto"
              value={autoCount}
              onChange={(e) => setAutoCount(Number(e.target.value))}
              aria-label="자동 생성할 개수"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button type="button" className="btn-secondary text-sm" disabled={!!generating} onClick={() => generate('auto')}>
              {generating === 'auto' ? '생성 중…' : '인물 관계로 자동 생성'}
            </button>
          </div>
        </section>

        {/* ─── Korean meme translator ─── */}
        <form className="card-flat space-y-4 p-5" onSubmit={translate}>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">한국 짤 번역</h2>
            <p className="text-xs text-gray-500">
              Claude가 한국어 위치를 찾아 번역하고 그 위에 영어 박스를 얹습니다. 게시 전에 박스를 조정할 수 있습니다.
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">이미지 (JPEG, PNG, WebP)</span>
            <input
              id="meme-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">출처 URL</span>
              <input className="input" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">원작자 표기</span>
              <input className="input" value={sourceCredit} onChange={(e) => setSourceCredit(e.target.value)} placeholder="원작자" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">게시할 인물 (선택, slug를 쉼표로 구분)</span>
            <input className="input" value={translateSlugs} onChange={(e) => setTranslateSlugs(e.target.value)} placeholder="sejong-daewang" />
          </label>
          <p className="text-xs text-amber-700">
            공유 권리가 있는 짤만 게시하고, 원작자를 표기하세요.
          </p>
          <button type="submit" className="btn-primary text-sm" disabled={!file || translating}>
            {translating ? '번역 중…' : '업로드 후 번역'}
          </button>
        </form>
      </div>

      {/* ─── List ─── */}
      <section>
        <div className="mb-4 flex gap-1 border-b border-gray-200">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatus(t.value)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                status === t.value ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-12 text-gray-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : memes.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">아직 초안이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {memes.map((m) => (
              <div key={m.id} className="card-flat flex flex-col overflow-hidden">
                <button type="button" onClick={() => setEditing(m)} className="block bg-gray-50 text-left" aria-label="수정">
                  {m.kind === 'story' ? (
                    <p className="line-clamp-[10] aspect-square whitespace-pre-wrap p-4 text-sm leading-relaxed text-gray-700">
                      {(m.content.body as string) ?? ''}
                    </p>
                  ) : (
                    <img src={memeImageUrl(m)} alt="" loading="lazy" className="aspect-square w-full object-contain" />
                  )}
                </button>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                      {m.kind === 'translated'
                        ? '번역 짤'
                        : m.kind === 'story'
                          ? '짧은 소설'
                          : FORMAT_KO[m.format as TemplateFormat]?.label ?? m.format}
                    </span>
                    {m.is_ai_generated && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">AI</span>}
                    {m.figures.length > 0 && <span className="text-gray-500">{m.figures.map((f) => f.name).join(' · ')}</span>}
                  </div>
                  {m.title && <p className="line-clamp-2 text-sm font-medium text-gray-900">{m.title}</p>}
                  {m.fact && <p className="line-clamp-2 text-xs text-gray-500">{m.fact}</p>}
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => setEditing(m)}>
                      수정
                    </button>
                    {m.status !== 'published' && (
                      <button type="button" className="btn-primary px-2.5 py-1 text-xs" onClick={() => setMemeStatus(m, 'published')}>
                        게시
                      </button>
                    )}
                    {m.status === 'published' && (
                      <>
                        {m.thread_id && (
                          <a href={`/threads/${m.thread_id}`} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1 text-xs">
                            스레드 보기
                          </a>
                        )}
                        {m.thread_id && (
                          <a href={`/admin/promo/${m.thread_id}`} className="btn-ghost px-2.5 py-1 text-xs">
                            공유 키트
                          </a>
                        )}
                        <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setMemeStatus(m, 'draft')}>
                          스레드 숨기기
                        </button>
                      </>
                    )}
                    {m.status === 'draft' && (
                      <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setMemeStatus(m, 'rejected')}>
                        반려
                      </button>
                    )}
                    <button type="button" className="btn-ghost px-2.5 py-1 text-xs text-red-600" onClick={() => remove(m)}>
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-6 text-center">
            <button type="button" className="btn-secondary text-sm" onClick={() => setSize(size + 1)}>
              더 보기
            </button>
          </div>
        )}
      </section>

      {editing && (
        <MemeEditor
          key={editing.id}
          meme={editing}
          onClose={closeEditor}
          onSaved={(updated) => {
            setEditing(null);
            if (updated.status !== status) setStatus(updated.status);
            mutate();
          }}
        />
      )}
    </div>
  );
}
