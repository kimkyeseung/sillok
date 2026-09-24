import Link from 'next/link';
import { timeAgo } from '@/lib/feed';
import type { ActivityItem } from '@/lib/feed-data';

/** Recent comments on person pages, surfaced as community activity */
export default function ActivityModule({ items }: { items: ActivityItem[] }) {
  if (!items.length) return null;
  return (
    <section className="card-flat p-4">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">💬 Latest from figure pages</h2>
      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a.id} className="text-sm">
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-gray-800">{a.author ?? 'Member'}</span> commented on{' '}
              <Link href={a.href} className="font-medium text-brand-700 hover:underline">
                {a.person.name_en}
              </Link>
              {a.target !== 'an item' && <> · {a.target}</>}
              <span className="ml-1 text-gray-400" suppressHydrationWarning>
                {timeAgo(a.created_at)}
              </span>
            </p>
            <p className="mt-0.5 line-clamp-2 text-gray-700">{a.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
