'use client';

import type { FieldSpec } from '@/lib/meme-formats';

// Editor inputs generated from a catalog format's field specs (lib/meme-formats.ts).
// Lists are one item per line; rows are repeatable groups.

type Value = Record<string, unknown>;

/** Empty value for a field (new rows, missing keys) */
function emptyFor(f: FieldSpec): unknown {
  switch (f.kind) {
    case 'text':
      return '';
    case 'list':
      return [];
    case 'int':
      return f.min;
    case 'rows':
      return [];
  }
}

export function emptyRow(fields: Record<string, FieldSpec>): Value {
  return Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, emptyFor(f)]));
}

/** Drop blank list lines and unused optional text before preview/save (recursive) */
export function cleanFields(fields: Record<string, FieldSpec>, value: Value): Value {
  const out: Value = { ...value };
  for (const [k, f] of Object.entries(fields)) {
    const v = value[k];
    if (f.kind === 'list' && Array.isArray(v)) out[k] = (v as string[]).map((s) => s.trim()).filter(Boolean);
    if (f.kind === 'text' && f.optional && typeof v === 'string' && !v.trim()) delete out[k];
    if (f.kind === 'rows' && Array.isArray(v)) out[k] = (v as Value[]).map((row) => cleanFields(f.fields, row));
  }
  return out;
}

export default function MemeFieldsForm({
  fields,
  value,
  onChange,
  names = [],
  labels = {},
}: {
  fields: Record<string, FieldSpec>;
  value: Value;
  onChange: (next: Value) => void;
  /** Figure names, shown for "from" pickers in chat formats */
  names?: string[];
  /** Field key → display label (admin UI is Korean; spec labels are English) */
  labels?: Record<string, string>;
}) {
  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-3">
      {Object.entries(fields).map(([key, f]) => {
        const label = (
          <span className="mb-1 block text-xs font-medium text-gray-600">
            {labels[key] ?? f.label}
            {f.kind === 'text' && <span className="text-gray-400"> · 최대 {f.max}자{f.optional ? ' · 선택' : ''}</span>}
            {f.kind === 'list' && <span className="text-gray-400"> · 한 줄에 하나, {f.min}–{f.max}개</span>}
          </span>
        );

        if (f.kind === 'text') {
          return (
            <label key={key} className="block">
              {label}
              <textarea
                className={`input ${f.max > 80 ? 'min-h-[72px]' : 'min-h-[44px]'}`}
                value={(value[key] as string | undefined) ?? ''}
                maxLength={f.max}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          );
        }

        if (f.kind === 'list') {
          return (
            <label key={key} className="block">
              {label}
              <textarea
                className="input min-h-[96px]"
                value={((value[key] as string[] | undefined) ?? []).join('\n')}
                onChange={(e) => set(key, e.target.value.split('\n').slice(0, f.max + 1))}
              />
            </label>
          );
        }

        if (f.kind === 'int') {
          // A 1–2 "from" field in a chat reads better as a name picker
          if (key === 'from' && f.min === 1 && f.max === 2) {
            return (
              <label key={key} className="block">
                {label}
                <select className="input" value={Number(value[key] ?? 1)} onChange={(e) => set(key, Number(e.target.value))}>
                  <option value={1}>{names[0] ?? '인물 1'} (오른쪽)</option>
                  <option value={2}>{names[1] ?? '인물 2'} (왼쪽)</option>
                </select>
              </label>
            );
          }
          return (
            <label key={key} className="block">
              {label}
              <input
                type="number"
                className="input"
                min={f.min}
                max={f.max}
                value={Number(value[key] ?? f.min)}
                onChange={(e) => set(key, Math.round(Number(e.target.value)))}
              />
            </label>
          );
        }

        // rows
        const rows = ((value[key] as Value[] | undefined) ?? []) as Value[];
        const setRow = (i: number, row: Value) => set(key, rows.map((r, j) => (j === i ? row : r)));
        const move = (i: number, d: -1 | 1) => {
          const next = [...rows];
          [next[i], next[i + d]] = [next[i + d], next[i]];
          set(key, next);
        };
        return (
          <div key={key}>
            {label}
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                    <span className="font-semibold">#{i + 1}</span>
                    <span className="flex gap-2">
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="hover:text-gray-900 disabled:opacity-30">
                        위로
                      </button>
                      <button type="button" disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="hover:text-gray-900 disabled:opacity-30">
                        아래로
                      </button>
                      <button
                        type="button"
                        disabled={rows.length <= f.min}
                        onClick={() => set(key, rows.filter((_, j) => j !== i))}
                        className="text-red-600 hover:underline disabled:opacity-30"
                      >
                        삭제
                      </button>
                    </span>
                  </div>
                  <MemeFieldsForm fields={f.fields} value={row} onChange={(r) => setRow(i, r)} names={names} labels={labels} />
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-secondary mt-2 text-xs"
              disabled={rows.length >= f.max}
              onClick={() => set(key, [...rows, emptyRow(f.fields)])}
            >
              + 추가
            </button>
          </div>
        );
      })}
    </div>
  );
}
