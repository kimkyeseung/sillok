import Link from 'next/link';
import Image from 'next/image';
import PersonAvatar from '@/components/common/PersonAvatar';
import type { FigureOfDay } from '@/lib/feed-data';
import type { HistoryItem } from '@/lib/feed';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const KIND_ICON = { born: '🎂', died: '🕯', event: '📜' } as const;

interface Props {
  date: { month: number; day: number };
  figure: FigureOfDay | null;
  history: { scope: 'day' | 'month'; items: HistoryItem[] };
  /** compact = sidebar */
  variant?: 'feed' | 'compact';
}

/** "Today in Korean History": figure of the day + on this day / this month */
export default function TodayCard({ date, figure, history, variant = 'feed' }: Props) {
  const compact = variant === 'compact';
  const dateLabel = `${MONTHS[date.month - 1]} ${date.day}`;

  return (
    <section className="card-flat overflow-hidden">
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 px-4 py-2.5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-100">Today in Korean History</p>
        <p className="text-sm font-semibold">{dateLabel}</p>
      </div>

      {figure && (
        <Link href={`/persons/${figure.slug}`} className="flex gap-3 p-4 transition-colors hover:bg-gray-50">
          <div className={`relative shrink-0 overflow-hidden rounded-xl bg-gray-100 ${compact ? 'h-16 w-16' : 'h-24 w-24'}`}>
            {figure.thumbnail ? (
              <Image src={figure.thumbnail} alt={figure.name_en} fill sizes="96px" className="object-cover" />
            ) : (
              <PersonAvatar name={figure.name_en} size="md" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Figure of the Day</p>
            <p className="font-semibold text-gray-900">{figure.name_en}</p>
            <p className="text-xs text-gray-500">
              {[figure.name_hanja, figure.birth_year || figure.death_year ? `${figure.birth_year ?? '?'}–${figure.death_year ?? '?'}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {!compact && figure.summary && <p className="mt-1.5 line-clamp-2 text-sm text-gray-600">{figure.summary}</p>}
            {!compact && figure.trivia && (
              <p className="mt-1.5 text-xs text-gray-600">
                <span className="font-semibold text-amber-600">💡 Did you know? </span>
                {figure.trivia.body ?? figure.trivia.title}
              </p>
            )}
          </div>
        </Link>
      )}

      {history.items.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {history.scope === 'day' ? 'On this day' : `This month in history`}
          </p>
          <ul className="space-y-1.5">
            {history.items.slice(0, compact ? 3 : 5).map((h, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="w-10 shrink-0 text-xs font-semibold text-brand-600">{h.year ?? ''}</span>
                <Link href={h.href} className="min-w-0 text-gray-700 hover:text-brand-700 hover:underline">
                  <span aria-hidden="true">{KIND_ICON[h.kind]} </span>
                  {h.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
