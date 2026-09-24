import Link from 'next/link';
import type { FeedSort, TopWindow } from '@/lib/feed';

const SORTS: { value: FeedSort; label: string; icon: string }[] = [
  { value: 'hot', label: 'Hot', icon: '🔥' },
  { value: 'new', label: 'New', icon: '🆕' },
  { value: 'top', label: 'Top', icon: '🏆' },
];
const WINDOWS: { value: TopWindow; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
];

/** Sort tabs as links (server-rendered first page for every sort) */
export default function SortTabs({ basePath, sort, t }: { basePath: string; sort: FeedSort; t: TopWindow }) {
  const href = (s: FeedSort, w?: TopWindow) => `${basePath}?sort=${s}${s === 'top' ? `&t=${w ?? t}` : ''}`;
  return (
    <div className="card-flat flex flex-wrap items-center gap-1 p-1.5">
      {SORTS.map((s) => (
        <Link
          key={s.value}
          href={href(s.value, 'all')}
          scroll={false}
          aria-current={sort === s.value ? 'page' : undefined}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            sort === s.value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span aria-hidden="true">{s.icon}</span>
          {s.label}
        </Link>
      ))}
      {sort === 'top' && (
        <div className="ml-auto flex flex-wrap gap-1">
          {WINDOWS.map((w) => (
            <Link
              key={w.value}
              href={href('top', w.value)}
              scroll={false}
              aria-current={t === w.value ? 'page' : undefined}
              className={`rounded-full px-2.5 py-1 text-xs ${
                t === w.value ? 'bg-brand-50 font-semibold text-brand-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {w.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
