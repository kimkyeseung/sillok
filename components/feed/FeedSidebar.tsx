import Link from 'next/link';
import Image from 'next/image';
import PersonAvatar from '@/components/common/PersonAvatar';
import TodayCard from '@/components/feed/TodayCard';
import {
  getDiscoverFigures,
  getSiteStats,
  getToday,
  getTrendingFigures,
} from '@/lib/feed-data';

/** Right sidebar for feed pages: today, trending/discover figures, about */
export default async function FeedSidebar({ children }: { children?: React.ReactNode }) {
  const [today, trending, discover, stats] = await Promise.all([
    getToday(),
    getTrendingFigures(),
    getDiscoverFigures(),
    getSiteStats(),
  ]);
  const figures = trending.length ? trending : discover;

  return (
    <div className="space-y-4">
      {children}
      <TodayCard date={today.date} figure={today.figure} history={today.history} variant="compact" />

      <section className="card-flat p-4">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {trending.length ? '📈 Trending figures' : '✨ Figures to discover'}
        </h2>
        <ol className="space-y-2.5">
          {figures.map((f, i) => (
            <li key={f.slug}>
              <Link href={`/persons/${f.slug}`} className="flex items-center gap-2.5 text-sm hover:text-brand-700">
                {trending.length > 0 && <span className="w-4 text-xs font-semibold text-gray-400">{i + 1}</span>}
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {f.thumbnail ? (
                    <Image src={f.thumbnail} alt="" fill sizes="32px" className="object-cover" />
                  ) : (
                    <PersonAvatar name={f.name_en} size="xs" />
                  )}
                </span>
                <span className="truncate font-medium text-gray-800">{f.name_en}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="card-flat p-4 text-sm">
        <h2 className="font-semibold text-gray-900">About Sillok</h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          A community for discussing Korea&apos;s historical figures — from Dangun to the present.
        </p>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ['Figures', stats.figures],
            ['Artifacts & events', stats.nodes],
            ['Threads', stats.threads],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg bg-gray-50 py-2">
              <dd className="text-base font-bold text-gray-900">{(value as number).toLocaleString()}</dd>
              <dt className="text-[10px] text-gray-500">{label}</dt>
            </div>
          ))}
        </dl>
        <ul className="mt-3 space-y-1 text-xs text-gray-500">
          <li>• Discuss history with evidence — cite sources when you can.</li>
          <li>• Hearts only: no downvotes on people or opinions.</li>
          <li>• Respect other members and the people we study.</li>
        </ul>
        <Link href="/threads/new" className="btn-primary mt-3 w-full justify-center text-sm">
          + Start a discussion
        </Link>
      </section>
    </div>
  );
}
