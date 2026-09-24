'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { apiFetch, fetcher } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

type Kind = 'fact' | 'highlight' | 'source';

interface Field {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  options?: string[];
  required?: boolean;
}

const FIELDS: Record<Kind, Field[]> = {
  fact: [
    { name: 'label', label: 'Label', type: 'text', required: true },
    { name: 'value', label: 'Value', type: 'text' },
    { name: 'linked_person_slug', label: 'Linked person slug', type: 'text' },
    { name: 'sort_order', label: 'Order', type: 'number' },
  ],
  highlight: [
    { name: 'kind', label: 'Type', type: 'select', options: ['ACHIEVEMENT', 'QUOTE', 'TRIVIA'], required: true },
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'body', label: 'Body', type: 'textarea' },
    { name: 'year', label: 'Year', type: 'number' },
    { name: 'sort_order', label: 'Order', type: 'number' },
  ],
  source: [
    { name: 'kind', label: 'Type', type: 'select', options: ['PRIMARY', 'ENCYCLOPEDIA', 'BOOK', 'ARTICLE', 'WEB'], required: true },
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'url', label: 'URL', type: 'text' },
    { name: 'citation', label: 'Citation', type: 'text' },
    { name: 'sort_order', label: 'Order', type: 'number' },
  ],
};

const SECTION_TITLES: Record<Kind, string> = {
  fact: 'At a Glance (facts)',
  highlight: 'Highlights (achievements · quotes · trivia)',
  source: 'Sources',
};

type Item = Record<string, unknown> & { id: string; is_ai_generated: boolean };

interface ContentResponse {
  facts: (Item & { linked_person: { slug: string; name_en: string } | null })[];
  highlights: Item[];
  sources: Item[];
}

/** Convert a form (all strings) into the API payload for a kind */
function toPayload(kind: Kind, values: Record<string, string>) {
  const payload: Record<string, unknown> = {};
  for (const f of FIELDS[kind]) {
    const raw = values[f.name] ?? '';
    if (f.type === 'number') payload[f.name] = raw === '' ? (f.name === 'sort_order' ? undefined : null) : Number(raw);
    else payload[f.name] = raw === '' && !f.required ? null : raw;
  }
  return payload;
}

function toFormValues(kind: Kind, item?: Item & { linked_person?: { slug: string } | null }) {
  const values: Record<string, string> = {};
  for (const f of FIELDS[kind]) {
    const v = f.name === 'linked_person_slug' ? item?.linked_person?.slug : item?.[f.name];
    values[f.name] = v == null ? (f.type === 'select' ? f.options![0] : '') : String(v);
  }
  return values;
}

export default function PersonContentEditor({ slug }: { slug: string }) {
  const key = `/api/admin/persons/${slug}/content`;
  const { data, mutate, isLoading } = useSWR<ContentResponse>(key, fetcher);
  const { toast } = useToast();

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      await mutate();
      toast(message);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    }
  };

  if (isLoading || !data) return <p className="py-8 text-sm text-gray-400">Loading...</p>;

  const sections: { kind: Kind; items: ContentResponse['facts'] | Item[] }[] = [
    { kind: 'fact', items: data.facts },
    { kind: 'highlight', items: data.highlights },
    { kind: 'source', items: data.sources },
  ];
  const pending = sections.flatMap((s) => s.items.filter((i) => i.is_ai_generated).map((i) => ({ kind: s.kind, id: i.id })));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm">
        <span className="text-violet-800">
          {pending.length
            ? `${pending.length} AI-drafted item(s) awaiting review. Approved items lose the "AI draft" label.`
            : 'All items are reviewed.'}
        </span>
        {pending.length > 0 && (
          <button
            className="btn-primary text-xs"
            onClick={() =>
              run(
                () =>
                  Promise.all(
                    pending.map((p) =>
                      apiFetch(`/api/admin/person-content/${p.kind}/${p.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ is_ai_generated: false }),
                      })
                    )
                  ),
                'All items approved'
              )
            }
          >
            Approve all
          </button>
        )}
      </div>

      {sections.map(({ kind, items }) => (
        <section key={kind}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            {SECTION_TITLES[kind]} · {items.length}
          </h2>
          <div className="card-flat divide-y divide-gray-100">
            {items.map((item) => (
              <ContentRow
                key={item.id}
                kind={kind}
                item={item}
                onSave={(values) =>
                  run(
                    () =>
                      apiFetch(`/api/admin/person-content/${kind}/${item.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify(toPayload(kind, values)),
                      }),
                    'Saved'
                  )
                }
                onApprove={() =>
                  run(
                    () =>
                      apiFetch(`/api/admin/person-content/${kind}/${item.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ is_ai_generated: false }),
                      }),
                    'Approved'
                  )
                }
                onDelete={() =>
                  confirm('Delete this item?') &&
                  run(
                    () => apiFetch(`/api/admin/person-content/${kind}/${item.id}`, { method: 'DELETE' }),
                    'Deleted'
                  )
                }
              />
            ))}
            <AddRow
              kind={kind}
              onAdd={(values) =>
                run(
                  () => apiFetch(key, { method: 'POST', body: JSON.stringify({ kind, data: toPayload(kind, values) }) }),
                  'Added'
                )
              }
            />
          </div>
        </section>
      ))}
    </div>
  );
}

function ContentRow({
  kind,
  item,
  onSave,
  onApprove,
  onDelete,
}: {
  kind: Kind;
  item: Item & { linked_person?: { slug: string; name_en: string } | null };
  onSave: (values: Record<string, string>) => Promise<void>;
  onApprove: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing)
    return (
      <div className="p-4">
        <ContentForm
          kind={kind}
          initial={toFormValues(kind, item)}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await onSave(values);
            setEditing(false);
          }}
        />
      </div>
    );

  const summary =
    kind === 'fact'
      ? `${item.label}: ${item.linked_person ? `→ ${item.linked_person.name_en}` : item.value}`
      : `${kind === 'highlight' ? `[${item.kind}] ` : `[${item.kind}] `}${item.year ? `${item.year} · ` : ''}${item.title}`;
  const detail = kind === 'highlight' ? (item.body as string | null) : kind === 'source' ? (item.url as string | null) : null;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">
          {summary}
          {item.is_ai_generated && (
            <span className="ml-2 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
              AI draft
            </span>
          )}
        </p>
        {detail && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{detail}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        {item.is_ai_generated && (
          <button className="btn-ghost text-xs text-green-700" onClick={onApprove}>
            Approve
          </button>
        )}
        <button className="btn-ghost text-xs" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button className="btn-ghost text-xs text-red-600" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

function AddRow({ kind, onAdd }: { kind: Kind; onAdd: (values: Record<string, string>) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-4 py-3">
      {open ? (
        <ContentForm
          kind={kind}
          initial={toFormValues(kind)}
          submitLabel="Add"
          onCancel={() => setOpen(false)}
          onSubmit={async (values) => {
            await onAdd(values);
            setOpen(false);
          }}
        />
      ) : (
        <button className="text-xs font-medium text-brand-600 hover:text-brand-700" onClick={() => setOpen(true)}>
          + Add item
        </button>
      )}
    </div>
  );
}

function ContentForm({
  kind,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  kind: Kind;
  initial: Record<string, string>;
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await onSubmit(values);
        } finally {
          setSaving(false);
        }
      }}
    >
      {FIELDS[kind].map((f) => (
        <label key={f.name} className={`block ${f.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
          <span className="mb-1 block text-xs font-medium text-gray-600">
            {f.label}
            {f.required && ' *'}
          </span>
          {f.type === 'select' ? (
            <select className="input" value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}>
              {f.options!.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : f.type === 'textarea' ? (
            <textarea
              className="input"
              rows={3}
              value={values[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
            />
          ) : (
            <input
              className="input"
              type={f.type === 'number' ? 'number' : 'text'}
              required={f.required}
              value={values[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
            />
          )}
        </label>
      ))}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="btn-primary text-xs" disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </button>
        <button type="button" className="btn-ghost text-xs" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
