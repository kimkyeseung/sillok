import Link from 'next/link';
import Image from 'next/image';
import PersonAvatar from '@/components/common/PersonAvatar';
import type { TriviaCard } from '@/lib/feed-data';

/** "Did you know?" cards in a horizontal row inside the feed */
export default function TriviaStrip({ items }: { items: TriviaCard[] }) {
  if (!items.length) return null;
  return (
    <section className="card-flat p-4">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-amber-600">💡 Did you know?</h2>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {items.map((t) => (
          <Link
            key={t.id}
            href={`/persons/${t.person.slug}/legacy`}
            className="flex w-64 shrink-0 snap-start flex-col rounded-xl border border-amber-100 bg-amber-50/50 p-3 transition-colors hover:border-amber-300"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <span className="relative h-6 w-6 overflow-hidden rounded-full bg-gray-100">
                {t.person.thumbnail ? (
                  <Image src={t.person.thumbnail} alt="" fill sizes="24px" className="object-cover" />
                ) : (
                  <PersonAvatar name={t.person.name_en} size="xs" />
                )}
              </span>
              {t.person.name_en}
            </span>
            <span className="mt-2 text-sm font-semibold text-gray-900">{t.title}</span>
            {t.body && <span className="mt-1 line-clamp-3 text-xs text-gray-600">{t.body}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
