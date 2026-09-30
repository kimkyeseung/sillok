import Link from 'next/link';
import Image from 'next/image';
import PersonAvatar from '@/components/common/PersonAvatar';
import FeedSidebar from '@/components/feed/FeedSidebar';
import type { RelatedThread } from '@/lib/feed-data';
import type { ThreadFigure } from '@/lib/thread-figures';

interface Topic {
  slug: string;
  label: string;
  icon: string;
}

interface Props {
  figures: ThreadFigure[];
  byFigure: RelatedThread[];
  byTopic: RelatedThread[];
  topic: Topic | null;
}

function RelatedThreadList({ title, href, threads }: { title: string; href?: string; threads: RelatedThread[] }) {
  if (!threads.length) return null;
  return (
    <section className="card-flat p-4">
      <h2 className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        <span className="truncate">{title}</span>
        {href && (
          <Link href={href} className="shrink-0 normal-case tracking-normal text-brand-600 hover:text-brand-700">
            See all
          </Link>
        )}
      </h2>
      <ul className="divide-y divide-gray-100">
        {threads.map((t) => (
          <li key={t.id}>
            <Link href={`/threads/${t.id}`} className="group block py-2">
              <span className="line-clamp-2 text-sm font-medium text-gray-800 group-hover:text-brand-700">{t.title}</span>
              <span className="mt-0.5 block text-[11px] text-gray-400">
                ♥ {t.like_count} · 💬 {t.reply_count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "More about {figure}" + "More in {topic}" — sidebar on desktop, below comments on mobile */
export function RelatedThreads({ figures, byFigure, byTopic, topic }: Props) {
  const primary = figures.find((f) => f.is_primary) ?? figures[0];
  return (
    <>
      <RelatedThreadList
        title={primary ? `More about ${primary.name_en ?? primary.name_ko}` : 'Related threads'}
        href={primary ? `/persons/${primary.slug}/threads` : undefined}
        threads={byFigure}
      />
      <RelatedThreadList
        title={topic ? `More in ${topic.icon} ${topic.label}` : 'More threads'}
        href={topic ? `/t/${topic.slug}` : undefined}
        threads={byTopic}
      />
    </>
  );
}

/** Right sidebar for thread detail: tagged figures, related threads, then the shared feed sidebar */
export default function ThreadSidebar(props: Props) {
  const { figures } = props;
  return (
    <FeedSidebar>
      {figures.length > 0 && (
        <section className="card-flat p-4">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Figures in this thread
          </h2>
          <ul className="space-y-2.5">
            {figures.map((f) => (
              <li key={f.id}>
                <Link href={`/persons/${f.slug}`} className="flex items-center gap-2.5 text-sm hover:text-brand-700">
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {f.thumbnail ? (
                      <Image src={f.thumbnail} alt="" fill sizes="36px" className="object-cover" />
                    ) : (
                      <PersonAvatar name={f.name_en ?? f.name_ko ?? '?'} size="xs" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-800">{f.name_en ?? f.name_ko}</span>
                    {f.name_en && f.name_ko && (
                      <span lang="ko" className="block truncate text-xs text-gray-400">
                        {f.name_ko}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <RelatedThreads {...props} />
    </FeedSidebar>
  );
}
