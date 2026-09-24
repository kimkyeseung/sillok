import Link from 'next/link';
import Image from 'next/image';
import LikeButton from '@/components/thread/LikeButton';
import PersonAvatar from '@/components/common/PersonAvatar';
import { threadCategory } from '@/lib/community';
import { timeAgo } from '@/lib/feed';
import type { FeedItem } from '@/lib/feed-data';

/** Reddit-style thread card: heart column, figure "community" chips, flair, title, thumbnail */
export default function FeedCard({ item }: { item: FeedItem }) {
  const flair = threadCategory(item.category);
  const [primary, ...others] = item.figures;

  return (
    <article className="card-flat flex gap-3 p-3 transition-colors hover:border-gray-300 sm:p-4">
      <div className="flex w-10 shrink-0 flex-col items-center pt-0.5">
        <LikeButton targetType="thread" targetId={item.id} initialCount={item.like_count} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500">
          {primary && (
            <Link
              href={`/persons/${primary.slug}`}
              className="inline-flex items-center gap-1.5 font-semibold text-gray-800 hover:underline"
            >
              <span className="relative h-5 w-5 overflow-hidden rounded-full bg-gray-100">
                {primary.thumbnail ? (
                  <Image src={primary.thumbnail} alt="" fill sizes="20px" className="object-cover" />
                ) : (
                  <PersonAvatar name={primary.name_en} size="xs" />
                )}
              </span>
              {primary.name_en}
            </Link>
          )}
          {others.map((f) => (
            <Link key={f.slug} href={`/persons/${f.slug}`} className="text-gray-500 hover:text-gray-800 hover:underline">
              + {f.name_en}
            </Link>
          ))}
          <span aria-hidden="true">·</span>
          <span>{item.author ?? 'Member'}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={item.created_at} suppressHydrationWarning>
            {timeAgo(item.created_at)}
          </time>
        </div>

        <Link href={`/threads/${item.id}`} className="group mt-1.5 flex gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold leading-snug text-gray-900 group-hover:text-brand-700">
              {item.category !== 'DISCUSSION' && (
                <span className={`mr-1.5 inline-block rounded px-1.5 py-0.5 align-middle text-[10px] font-medium ${flair.badge}`}>
                  {flair.label}
                </span>
              )}
              {item.title}
            </h3>
            {item.preview && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.preview}</p>}
          </div>
          {item.image && (
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-32">
              <Image src={item.image} alt="" fill sizes="128px" className="object-cover" />
              {item.has_video && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-lg text-white">▶</span>
              )}
            </div>
          )}
        </Link>

        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <Link href={`/threads/${item.id}#comments`} className="inline-flex items-center gap-1 hover:text-gray-800">
            💬 {item.reply_count} {item.reply_count === 1 ? 'comment' : 'comments'}
          </Link>
        </div>
      </div>
    </article>
  );
}
