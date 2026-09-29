'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import {
  FACE_VARIANTS,
  FORMAT_DEFS,
  HAT_TYPES,
  isTemplateFormat,
  type FaceVariant,
  type HatType,
  type MemeStatus,
  type TextBox,
} from '@/lib/meme';
import MemeBoxEditor from './MemeBoxEditor';

export interface AdminMeme {
  id: string;
  kind: 'template' | 'translated';
  format: string;
  title: string | null;
  content: Record<string, unknown>;
  fact: string | null;
  source_image_url: string | null;
  source_url: string | null;
  source_credit: string | null;
  is_ai_generated: boolean;
  status: MemeStatus;
  thread_id: string | null;
  updated_at: string;
  figures: { id: string; slug: string; name: string }[];
}

export const memeImageUrl = (m: Pick<AdminMeme, 'id' | 'updated_at'>) =>
  `/api/og/meme/${m.id}?v=${encodeURIComponent(m.updated_at)}`;

const TEXT_FIELDS: Record<string, { key: string; label: string; list?: boolean }[]> = {
  'feels-bro': [
    { key: 'left', label: 'Left caption (figure 1)' },
    { key: 'right', label: 'Right caption (figure 2)' },
    { key: 'bottom', label: 'Bottom punchline' },
  ],
  drake: [
    { key: 'reject', label: 'Rejects' },
    { key: 'prefer', label: 'Prefers' },
  ],
  'virgin-chad': [
    { key: 'virgin', label: 'Virgin traits (one per line)', list: true },
    { key: 'chad', label: 'Chad traits (one per line)', list: true },
  ],
  'its-over': [
    { key: 'top', label: 'Top caption' },
    { key: 'bottom', label: 'Bottom punchline' },
  ],
};

const HAT_LABELS: Record<HatType, string> = {
  ikseongwan: 'King (ikseongwan)',
  gat: 'Scholar (gat)',
  helmet: 'General (helmet)',
  topknot: 'Topknot',
  none: 'None (bald)',
};

/** Drop blank list lines (trait textareas) before preview/save */
const cleanContent = (c: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(c).map(([k, v]) =>
      Array.isArray(v) && v.every((x) => typeof x === 'string') && k !== 'faces' && k !== 'hats'
        ? [k, (v as string[]).map((s) => s.trim()).filter(Boolean)]
        : [k, v],
    ),
  );

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function MemeEditor({
  meme,
  onClose,
  onSaved,
}: {
  meme: AdminMeme;
  onClose: () => void;
  onSaved: (m: AdminMeme) => void;
}) {
  const { toast } = useToast();
  const [content, setContent] = useState<Record<string, unknown>>(meme.content);
  const [title, setTitle] = useState(meme.title ?? '');
  const [figureSlugs, setFigureSlugs] = useState(meme.figures.map((f) => f.slug).join(', '));
  const [fact, setFact] = useState(meme.fact ?? '');
  const [sourceUrl, setSourceUrl] = useState(meme.source_url ?? '');
  const [sourceCredit, setSourceCredit] = useState(meme.source_credit ?? '');
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const debounced = useDebounced(content, 600);
  const previewUrl = useMemo(
    () => `/api/og/meme/${meme.id}?content=${encodeURIComponent(JSON.stringify(cleanContent(debounced)))}`,
    [meme.id, debounced],
  );
  useEffect(() => setPreviewError(false), [previewUrl]);

  const set = (key: string, value: unknown) => setContent((c) => ({ ...c, [key]: value }));

  const save = async (status?: MemeStatus) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { content: cleanContent(content), fact: fact.trim() || null };
      if (title.trim()) body.title = title.trim();
      if (meme.kind === 'translated') {
        body.source_url = sourceUrl.trim() || null;
        body.source_credit = sourceCredit.trim() || null;
        body.person_slugs = figureSlugs
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);
      }
      if (status) body.status = status;
      const updated = await apiFetch<AdminMeme>(`/api/admin/memes/${meme.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      toast(status === 'published' || meme.status === 'published' ? 'Thread posted/updated' : 'Saved');
      onSaved(updated);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Template fields ───
  const templateForm = () => {
    if (!isTemplateFormat(meme.format)) return null;
    const def = FORMAT_DEFS[meme.format];
    const faces = (content.faces as FaceVariant[] | undefined) ?? def.faces;
    const hats = content.hats as (HatType | 'auto')[] | undefined;
    const figureSlots = meme.format === 'drake' || meme.format === 'its-over' ? 1 : 2;

    return (
      <div className="space-y-4">
        {TEXT_FIELDS[meme.format].map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{f.label}</span>
            {f.list ? (
              <textarea
                className="input min-h-[96px]"
                value={((content[f.key] as string[] | undefined) ?? []).join('\n')}
                onChange={(e) => set(f.key, e.target.value.split('\n').slice(0, 5))}
              />
            ) : (
              <textarea
                className="input min-h-[60px]"
                value={(content[f.key] as string | undefined) ?? ''}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
          </label>
        ))}

        <div className="grid grid-cols-2 gap-3">
          {def.faces.map((_, slot) => (
            <label key={`face-${slot}`} className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                {meme.format === 'drake' ? (slot === 0 ? 'Reject face' : 'Prefer face') : `Face ${slot + 1}`}
              </span>
              <select
                className="input"
                value={faces[slot]}
                onChange={(e) => {
                  const next = [...faces];
                  next[slot] = e.target.value as FaceVariant;
                  set('faces', next);
                }}
              >
                {FACE_VARIANTS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {Array.from({ length: figureSlots }, (_, slot) => (
            <label key={`hat-${slot}`} className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                Headwear {figureSlots > 1 ? slot + 1 : ''} ({meme.figures[slot]?.name ?? '—'})
              </span>
              <select
                className="input"
                value={hats?.[slot] ?? 'auto'}
                onChange={(e) => {
                  const next = Array.from({ length: figureSlots }, (_, i) => hats?.[i] ?? 'auto');
                  next[slot] = e.target.value as HatType | 'auto';
                  set('hats', next.every((h) => h === 'auto') ? undefined : next);
                }}
              >
                <option value="auto">Auto (from tags)</option>
                {HAT_TYPES.map((h) => (
                  <option key={h} value={h}>
                    {HAT_LABELS[h]}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
    );
  };

  // ─── Translated boxes ───
  const boxes = (content.boxes as TextBox[] | undefined) ?? [];
  const setBoxes = (next: TextBox[]) => set('boxes', next);
  const updateBox = (i: number, patch: Partial<TextBox>) => setBoxes(boxes.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  const translatedForm = () => (
    <div className="space-y-4">
      {meme.source_image_url && (
        <MemeBoxEditor
          imageUrl={meme.source_image_url}
          boxes={boxes}
          selected={selectedBox}
          onSelect={setSelectedBox}
          onChange={setBoxes}
        />
      )}
      <p className="text-xs text-gray-500">Drag a box to move it, drag its corner to resize. Boxes cover the Korean text.</p>
      <div className="space-y-3">
        {boxes.map((b, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 ${selectedBox === i ? 'border-brand-500 bg-brand-50/40' : 'border-gray-200'}`}
            onFocus={() => setSelectedBox(i)}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Box {i + 1}</span>
              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={() => {
                  setBoxes(boxes.filter((_, j) => j !== i));
                  setSelectedBox(null);
                }}
              >
                Remove
              </button>
            </div>
            {b.ko && (
              <p className="mb-2 text-xs text-gray-500" lang="ko">
                Original: {b.ko}
              </p>
            )}
            <textarea className="input min-h-[52px]" value={b.text} onChange={(e) => updateBox(i, { text: e.target.value })} />
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <label className="flex items-center gap-1.5">
                Text
                <input type="color" value={b.color} onChange={(e) => updateBox(i, { color: e.target.value })} />
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={b.background !== null}
                  onChange={(e) => updateBox(i, { background: e.target.checked ? '#ffffff' : null })}
                />
                Fill
              </label>
              {b.background !== null && (
                <input type="color" value={b.background} onChange={(e) => updateBox(i, { background: e.target.value })} />
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn-secondary text-sm"
        disabled={boxes.length >= 24}
        onClick={() => {
          setBoxes([...boxes, { x: 0.3, y: 0.4, w: 0.4, h: 0.12, text: 'New text', color: '#ffffff', background: null }]);
          setSelectedBox(boxes.length);
        }}
      >
        + Add box
      </button>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">Post under figures (slugs, comma-separated — first is primary)</span>
        <input className="input" value={figureSlugs} onChange={(e) => setFigureSlugs(e.target.value)} placeholder="sejong-daewang" />
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
    </div>
  );

  const heading =
    meme.kind === 'translated'
      ? 'Translated meme'
      : `${isTemplateFormat(meme.format) ? FORMAT_DEFS[meme.format].label : meme.format} · ${meme.figures.map((f) => f.name).join(' & ')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-label="Edit meme" className="w-full max-w-6xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{heading}</h2>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Close
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Preview</p>
            {previewError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                Preview failed — a caption may be empty or too long.
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Meme preview"
                className="w-full rounded-lg border border-gray-200"
                onError={() => setPreviewError(true)}
              />
            )}
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Thread title</span>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </label>
            {meme.kind === 'translated' ? translatedForm() : templateForm()}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                Thread body {meme.kind === 'translated' ? '(context for foreign readers)' : '(the history behind the joke)'}
              </span>
              <textarea className="input min-h-[60px]" value={fact} onChange={(e) => setFact(e.target.value)} maxLength={500} />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" className="btn-secondary text-sm" disabled={saving} onClick={() => save()}>
            Save draft
          </button>
          <button type="button" className="btn-primary text-sm" disabled={saving} onClick={() => save('published')}>
            {meme.status === 'published' ? 'Save & update thread' : 'Save & post as thread'}
          </button>
        </div>
      </div>
    </div>
  );
}
