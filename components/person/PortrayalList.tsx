import Link from 'next/link';
import Image from 'next/image';
import type { LinkedNode } from '@/lib/person-page';
import ItemReactions from '@/components/person/ItemReactions';

/** Films and dramas depicting a person, with the actor who played them when known */
export default function PortrayalList({
  items,
  personName,
  slug,
}: {
  items: LinkedNode[];
  personName: string;
  slug: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((m) => (
        <div key={m.id} className="card-flat p-3">
          <Link href={`/nodes/${m.slug}`} className="flex gap-3 rounded-md transition-colors hover:bg-gray-50">
            {m.thumbnail ? (
              <Image
                src={m.thumbnail}
                alt={m.title}
                width={64}
                height={88}
                className="h-[88px] w-16 shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-[88px] w-16 shrink-0 items-center justify-center rounded-md bg-gray-100 text-2xl">
                {m.media_kind === 'drama' ? '📺' : '🎬'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold text-gray-900">{m.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {[m.year, m.media_kind === 'drama' ? 'TV drama' : m.media_kind === 'film' ? 'Film' : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {m.portrayed_by ? (
                <p className="mt-1.5 text-xs text-gray-700">
                  <span className="font-medium text-brand-700">{m.portrayed_by}</span> as {personName}
                </p>
              ) : (
                m.cast.length > 0 && (
                  <p className="mt-1.5 line-clamp-1 text-xs text-gray-500">Starring {m.cast.slice(0, 3).join(', ')}</p>
                )
              )}
            </div>
          </Link>
          <div className="mt-2 border-t border-gray-100 pt-2">
            <ItemReactions slug={slug} targetType="PORTRAYAL" targetKey={m.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
