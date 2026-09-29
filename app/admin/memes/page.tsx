'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import { FORMAT_DEFS, TEMPLATE_FORMATS, type MemeStatus, type TemplateFormat } from '@/lib/meme';
import { toJpeg, uploadMemeImage } from '@/lib/upload';
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
  { value: 'draft', label: 'Drafts' },
  { value: 'published', label: 'Posted' },
  { value: 'rejected', label: 'Rejected' },
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
    toast(`${res.created.length} ${what} created${res.skipped ? ` · ${res.skipped} skipped` : ''}`);
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
      afterCreate(res, format === 'story' && mode === 'manual' ? 'story' : res.created.length === 1 ? 'meme' : 'memes');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Generation failed', 'error');
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
      if (blob.size > MAX_UPLOAD) throw new Error('Image is larger than 5MB even after compression.');
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
      afterCreate(res, 'translation');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Translation failed', 'error');
    } finally {
      setTranslating(false);
    }
  };

  const setMemeStatus = async (m: AdminMeme, next: MemeStatus) => {
    try {
      await apiFetch(`/api/admin/memes/${m.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      toast(next === 'published' ? 'Posted as a thread' : next === 'rejected' ? 'Rejected' : 'Thread hidden, moved to drafts');
      mutate();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  const remove = async (m: AdminMeme) => {
    if (!confirm('Delete this meme?')) return;
    try {
      await apiFetch(`/api/admin/memes/${m.id}`, { method: 'DELETE' });
      toast('Deleted');
      mutate();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const twoFigures = format !== 'story' && FORMAT_DEFS[format].figures.min === 2;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Drafts</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          AI-written wojak memes, short stories and English versions of Korean memes. Drafts are private; posting turns a draft
          into a regular thread under its figures.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Wojak generator ─── */}
        <section className="card-flat space-y-4 p-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Generate meme or short story</h2>
            <p className="text-xs text-gray-500">Pre-modern, published figures only. Written by Claude from DB facts.</p>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Format</span>
            <select className="input" value={format} onChange={(e) => setFormat(e.target.value as TemplateFormat | 'story')}>
              {TEMPLATE_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {FORMAT_DEFS[f].label} — {FORMAT_DEFS[f].description}
                </option>
              ))}
              <option value="story">Short story — text-only post with a twist ending</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Figure 1 slug</span>
              <input className="input" value={slug1} onChange={(e) => setSlug1(e.target.value)} placeholder="yi-sun-sin" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                Figure 2 slug {twoFigures ? '' : '(optional context)'}
              </span>
              <input className="input" value={slug2} onChange={(e) => setSlug2(e.target.value)} placeholder="won-gyun" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Event slug (optional)</span>
            <input className="input" value={eventSlug} onChange={(e) => setEventSlug(e.target.value)} placeholder="imjin-war" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={!!generating || !slug1.trim() || (twoFigures && !slug2.trim())}
              onClick={() => generate('manual')}
            >
              {generating === 'manual' ? 'Generating…' : 'Generate'}
            </button>
            <span className="mx-1 text-xs text-gray-400">or</span>
            <select
              className="input w-auto"
              value={autoCount}
              onChange={(e) => setAutoCount(Number(e.target.value))}
              aria-label="Number of memes to auto-generate"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button type="button" className="btn-secondary text-sm" disabled={!!generating} onClick={() => generate('auto')}>
              {generating === 'auto' ? 'Generating…' : 'Auto-generate from relations'}
            </button>
          </div>
        </section>

        {/* ─── Korean meme translator ─── */}
        <form className="card-flat space-y-4 p-5" onSubmit={translate}>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Translate Korean meme</h2>
            <p className="text-xs text-gray-500">
              Claude finds the Korean text, translates it, and places English boxes over it. You can adjust boxes before publishing.
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Image (JPEG, PNG or WebP)</span>
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
              <span className="mb-1 block text-xs font-medium text-gray-600">Source URL</span>
              <input className="input" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Credit</span>
              <input className="input" value={sourceCredit} onChange={(e) => setSourceCredit(e.target.value)} placeholder="Original creator" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Post under figures (optional, comma-separated slugs)</span>
            <input className="input" value={translateSlugs} onChange={(e) => setTranslateSlugs(e.target.value)} placeholder="sejong-daewang" />
          </label>
          <p className="text-xs text-amber-700">
            Only publish memes you have the right to share. Credit the original creator.
          </p>
          <button type="submit" className="btn-primary text-sm" disabled={!file || translating}>
            {translating ? 'Translating…' : 'Upload & translate'}
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
            <span className="text-sm">Loading...</span>
          </div>
        ) : memes.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No drafts here yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {memes.map((m) => (
              <div key={m.id} className="card-flat flex flex-col overflow-hidden">
                <button type="button" onClick={() => setEditing(m)} className="block bg-gray-50 text-left" aria-label="Edit">
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
                        ? 'Translated'
                        : m.kind === 'story'
                          ? 'Short story'
                          : FORMAT_DEFS[m.format as TemplateFormat]?.label ?? m.format}
                    </span>
                    {m.is_ai_generated && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">AI</span>}
                    {m.figures.length > 0 && <span className="text-gray-500">{m.figures.map((f) => f.name).join(' · ')}</span>}
                  </div>
                  {m.title && <p className="line-clamp-2 text-sm font-medium text-gray-900">{m.title}</p>}
                  {m.fact && <p className="line-clamp-2 text-xs text-gray-500">{m.fact}</p>}
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => setEditing(m)}>
                      Edit
                    </button>
                    {m.status !== 'published' && (
                      <button type="button" className="btn-primary px-2.5 py-1 text-xs" onClick={() => setMemeStatus(m, 'published')}>
                        Post
                      </button>
                    )}
                    {m.status === 'published' && (
                      <>
                        {m.thread_id && (
                          <a href={`/threads/${m.thread_id}`} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1 text-xs">
                            View thread
                          </a>
                        )}
                        <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setMemeStatus(m, 'draft')}>
                          Hide thread
                        </button>
                      </>
                    )}
                    {m.status === 'draft' && (
                      <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setMemeStatus(m, 'rejected')}>
                        Reject
                      </button>
                    )}
                    <button type="button" className="btn-ghost px-2.5 py-1 text-xs text-red-600" onClick={() => remove(m)}>
                      Delete
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
              Load more
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
