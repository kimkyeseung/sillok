'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import {
  FACE_VARIANTS,
  FORMAT_DEFS,
  HAT_TYPES,
  formatEntry,
  isTemplateFormat,
  memeThreadBody,
  type FaceVariant,
  type HatType,
  type MemeKind,
  type MemeStatus,
  type TextBox,
} from '@/lib/meme';
import MemeBoxEditor from './MemeBoxEditor';
import MemeFieldsForm, { cleanFields } from './MemeFieldsForm';
import { FORMAT_KO } from '@/lib/meme-formats-ko';

export interface AdminMeme {
  id: string;
  kind: MemeKind;
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

const FACE_LABELS: Record<FaceVariant, string> = {
  feels: '씁쓸 (feels)',
  crying: '울음',
  smug: '의기양양',
  angry: '화남',
  happy: '행복',
  npc: 'NPC',
};

const HAT_LABELS: Record<HatType, string> = {
  ikseongwan: '왕 (익선관)',
  gat: '선비 (갓)',
  helmet: '장수 (투구)',
  topknot: '상투',
  none: '없음 (민머리)',
};

/** Drop blank list lines / unused optional text before preview and save */
const cleanContent = (format: string, c: Record<string, unknown>) =>
  isTemplateFormat(format) ? cleanFields(formatEntry(format).fields, c) : c;

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
    () => `/api/og/meme/${meme.id}?content=${encodeURIComponent(JSON.stringify(cleanContent(meme.format, debounced)))}`,
    [meme.id, meme.format, debounced],
  );
  useEffect(() => setPreviewError(false), [previewUrl]);

  const set = (key: string, value: unknown) => setContent((c) => ({ ...c, [key]: value }));

  const save = async (status?: MemeStatus) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { content: cleanContent(meme.format, content), fact: fact.trim() || null };
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
      toast(status === 'published' || meme.status === 'published' ? '스레드를 게시/갱신했습니다' : '저장했습니다');
      onSaved(updated);
    } catch (err) {
      toast(err instanceof Error ? err.message : '저장하지 못했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Template fields ───
  const templateForm = () => {
    if (!isTemplateFormat(meme.format)) return null;
    const def = FORMAT_DEFS[meme.format];
    const faces = (content.faces as FaceVariant[] | undefined) ?? (def.faces as readonly FaceVariant[]);
    const hats = content.hats as (HatType | 'auto')[] | undefined;
    const figureSlots = Math.max(1, Math.min(2, meme.figures.length));

    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">{FORMAT_KO[meme.format].structure}</p>
        <MemeFieldsForm
          fields={def.fields}
          value={content}
          onChange={(next) => setContent((c) => ({ ...c, ...next }))}
          names={meme.figures.map((f) => f.name)}
          labels={FORMAT_KO[meme.format].fields}
        />

        <div className="grid grid-cols-2 gap-3">
          {def.faces.map((_, slot) => (
            <label key={`face-${slot}`} className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                {meme.format === 'drake' ? (slot === 0 ? '거부 표정' : '선호 표정') : `표정 ${slot + 1}`}
              </span>
              <select
                className="input"
                value={faces[slot]}
                onChange={(e) => {
                  const next = [...faces] as FaceVariant[];
                  next[slot] = e.target.value as FaceVariant;
                  set('faces', next);
                }}
              >
                {FACE_VARIANTS.map((v) => (
                  <option key={v} value={v}>
                    {FACE_LABELS[v]}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {Array.from({ length: figureSlots }, (_, slot) => (
            <label key={`hat-${slot}`} className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                모자 {figureSlots > 1 ? slot + 1 : ''} ({meme.figures[slot]?.name ?? '—'})
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
                <option value="auto">자동 (태그 기준)</option>
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
      <p className="text-xs text-gray-500">박스를 드래그해 옮기고, 모서리를 드래그해 크기를 조절하세요. 박스가 한국어 원문을 덮습니다.</p>
      <div className="space-y-3">
        {boxes.map((b, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 ${selectedBox === i ? 'border-brand-500 bg-brand-50/40' : 'border-gray-200'}`}
            onFocus={() => setSelectedBox(i)}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">박스 {i + 1}</span>
              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={() => {
                  setBoxes(boxes.filter((_, j) => j !== i));
                  setSelectedBox(null);
                }}
              >
                삭제
              </button>
            </div>
            {b.ko && (
              <p className="mb-2 text-xs text-gray-500" lang="ko">
                원문: {b.ko}
              </p>
            )}
            <textarea className="input min-h-[52px]" value={b.text} onChange={(e) => updateBox(i, { text: e.target.value })} />
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <label className="flex items-center gap-1.5">
                글자색
                <input type="color" value={b.color} onChange={(e) => updateBox(i, { color: e.target.value })} />
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={b.background !== null}
                  onChange={(e) => updateBox(i, { background: e.target.checked ? '#ffffff' : null })}
                />
                배경
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
          setBoxes([...boxes, { x: 0.3, y: 0.4, w: 0.4, h: 0.12, text: '새 텍스트', color: '#ffffff', background: null }]);
          setSelectedBox(boxes.length);
        }}
      >
        + 박스 추가
      </button>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">게시할 인물 (slug 쉼표 구분 — 첫 번째가 대표)</span>
        <input className="input" value={figureSlugs} onChange={(e) => setFigureSlugs(e.target.value)} placeholder="sejong-daewang" />
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
    </div>
  );

  const heading =
    meme.kind === 'story'
      ? `짧은 소설 · ${meme.figures.map((f) => f.name).join(' & ')}`
      : meme.kind === 'translated'
      ? '번역 짤'
      : `${isTemplateFormat(meme.format) ? FORMAT_KO[meme.format].label : meme.format} · ${meme.figures.map((f) => f.name).join(' & ')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-label="초안 수정" className="w-full max-w-6xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{heading}</h2>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            닫기
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">미리보기</p>
            {meme.kind === 'story' ? (
              // Text-only thread: preview what the post will read like
              <div className="rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900">{title || '제목 없음'}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {memeThreadBody({ kind: 'story', content: { body: (content.body as string) ?? '' }, fact, source_credit: null, source_url: null })}
                </p>
              </div>
            ) : previewError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                미리보기를 만들지 못했습니다 — 비어 있거나 너무 긴 캡션이 있을 수 있습니다.
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="밈 미리보기"
                className="w-full rounded-lg border border-gray-200"
                onError={() => setPreviewError(true)}
              />
            )}
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">스레드 제목</span>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </label>
            {meme.kind === 'story' ? (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">소설 본문 (반전은 마지막 줄에)</span>
                <textarea
                  className="input min-h-[220px]"
                  value={(content.body as string) ?? ''}
                  onChange={(e) => set('body', e.target.value)}
                  maxLength={1500}
                />
              </label>
            ) : meme.kind === 'translated' ? (
              translatedForm()
            ) : (
              templateForm()
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                {meme.kind === 'story'
                  ? '사실 설명 (소설 아래 "What’s real"로 표시)'
                  : `스레드 본문 ${meme.kind === 'translated' ? '(외국인 독자를 위한 맥락)' : '(농담의 역사적 배경)'}`}
              </span>
              <textarea className="input min-h-[60px]" value={fact} onChange={(e) => setFact(e.target.value)} maxLength={500} />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" className="btn-secondary text-sm" disabled={saving} onClick={() => save()}>
            초안 저장
          </button>
          <button type="button" className="btn-primary text-sm" disabled={saving} onClick={() => save('published')}>
            {meme.status === 'published' ? '저장 후 스레드 갱신' : '저장 후 스레드로 게시'}
          </button>
        </div>
      </div>
    </div>
  );
}
