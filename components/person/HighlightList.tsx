import AiDraftBadge from '@/components/person/AiDraftBadge';
import type { PersonHighlight } from '@/lib/person-page';

/** Achievement cards (year + title + body) */
export function AchievementList({ items }: { items: PersonHighlight[] }) {
  return (
    <ol className="card-flat divide-y divide-gray-100">
      {items.map((h) => (
        <li key={h.id} className="flex gap-4 px-4 py-3.5">
          <span className="w-12 shrink-0 pt-0.5 text-sm font-semibold text-brand-600">
            {h.year ?? '—'}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
              {h.title}
              {h.is_ai_generated && <AiDraftBadge />}
            </p>
            {h.body && <p className="mt-1 text-sm leading-relaxed text-gray-600">{h.body}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** "Did you know?" trivia cards */
export function TriviaList({ items }: { items: PersonHighlight[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((h) => (
        <div key={h.id} className="card-flat border-l-4 border-l-amber-300 p-4">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
            {h.title}
            {h.is_ai_generated && <AiDraftBadge />}
          </p>
          {h.body && <p className="mt-1 text-sm leading-relaxed text-gray-600">{h.body}</p>}
        </div>
      ))}
    </div>
  );
}

/** Quotations with attribution line */
export function QuoteList({ items, speaker }: { items: PersonHighlight[]; speaker: string }) {
  return (
    <div className="space-y-3">
      {items.map((h) => (
        <figure key={h.id} className="card-flat p-5">
          <blockquote className="border-l-4 border-brand-200 pl-4 text-sm italic leading-relaxed text-gray-700">
            “{h.body}”
          </blockquote>
          <figcaption className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            — {speaker}, {h.title}
            {h.year ? ` (${h.year})` : ''}
            {h.is_ai_generated && <AiDraftBadge />}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
