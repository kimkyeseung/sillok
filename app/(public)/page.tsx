import type { Metadata } from 'next';
import { websiteJsonLd } from '@/lib/jsonld';
import Feed from '@/components/feed/Feed';
import FeedShell from '@/components/feed/FeedShell';
import FeedSidebar from '@/components/feed/FeedSidebar';
import FeedComposer from '@/components/feed/FeedComposer';
import SortTabs from '@/components/feed/SortTabs';
import TodayCard from '@/components/feed/TodayCard';
import PollModule from '@/components/feed/PollModule';
import TriviaStrip from '@/components/feed/TriviaStrip';
import ActivityModule from '@/components/feed/ActivityModule';
import EditorsPick from '@/components/feed/EditorsPick';
import {
  getDefaultFeedSort,
  getFeedPage,
  getPollOfDaySlug,
  getRecentActivity,
  getToday,
  getTriviaOfDay,
} from '@/lib/feed-data';
import { FEED_SORTS, TOP_WINDOWS, type FeedSort, type TopWindow } from '@/lib/feed';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  searchParams: { sort?: string; t?: string };
}

export default async function HomePage({ searchParams }: Props) {
  // No explicit sort → Top while the community is quiet, Hot once it is active
  const fallback = await getDefaultFeedSort();
  const sort = (FEED_SORTS as readonly string[]).includes(searchParams.sort ?? '')
    ? (searchParams.sort as FeedSort)
    : fallback.sort;
  const t = (TOP_WINDOWS as readonly string[]).includes(searchParams.t ?? '') ? (searchParams.t as TopWindow) : fallback.t;

  const [page, today, pollSlug, trivia, activity] = await Promise.all([
    getFeedPage({ sort, t }),
    getToday(),
    getPollOfDaySlug(),
    getTriviaOfDay(),
    getRecentActivity(),
  ]);

  const modules = [
    // Desktop shows "Today" in the sidebar; on smaller screens it lives in the feed
    {
      after: 2,
      node: (
        <div className="lg:hidden">
          <TodayCard date={today.date} figure={today.figure} history={today.history} />
        </div>
      ),
    },
    ...(pollSlug ? [{ after: 4, node: <PollModule slug={pollSlug} /> }] : []),
    { after: 7, node: <TriviaStrip items={trivia} /> },
    { after: 10, node: <ActivityModule items={activity} /> },
  ];

  return (
    <FeedShell
      active={{ kind: 'home' }}
      sidebar={
        <FeedSidebar>
          <EditorsPick />
        </FeedSidebar>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
      <h1 className="sr-only">Sillok — Korean history community</h1>
      <FeedComposer />
      <SortTabs basePath="/" sort={page.sort} t={t} />
      <Feed initialItems={page.items} initialCursor={page.next_cursor} sort={page.sort} t={t} modules={modules} />
    </FeedShell>
  );
}
