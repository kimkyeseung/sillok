import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Feed from '@/components/feed/Feed';
import FeedShell from '@/components/feed/FeedShell';
import FeedSidebar from '@/components/feed/FeedSidebar';
import FeedComposer from '@/components/feed/FeedComposer';
import SortTabs from '@/components/feed/SortTabs';
import { getDefaultFeedSort, getFeedPage } from '@/lib/feed-data';
import { FEED_SORTS, TOP_WINDOWS, findTopic, type FeedSort, type TopWindow } from '@/lib/feed';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { topic: string };
  searchParams: { sort?: string; t?: string };
}

const DESCRIPTIONS: Record<string, string> = {
  discussion: 'Open discussions about Korean historical figures.',
  trivia: 'Surprising facts and little-known stories about Korean historical figures.',
  qna: 'Questions and answers about Korean history and its people.',
  sources: 'Primary records, books and references shared by the community.',
  'film-tv': 'Films and dramas about Korean historical figures — how they compare with history.',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = findTopic(params.topic);
  if (!topic) return {};
  const title = `${topic.label} — Discussions`;
  const description = DESCRIPTIONS[topic.slug];
  return {
    title,
    description,
    alternates: { canonical: `/t/${topic.slug}` },
    openGraph: { title: `${title} | Sillok`, description, images: [DEFAULT_OG_IMAGE] },
  };
}

export default async function TopicPage({ params, searchParams }: Props) {
  const topic = findTopic(params.topic);
  if (!topic) notFound();

  const fallback = await getDefaultFeedSort();
  const sort = (FEED_SORTS as readonly string[]).includes(searchParams.sort ?? '')
    ? (searchParams.sort as FeedSort)
    : fallback.sort;
  const t = (TOP_WINDOWS as readonly string[]).includes(searchParams.t ?? '') ? (searchParams.t as TopWindow) : fallback.t;
  const page = await getFeedPage({ sort, t, topic: topic.slug });

  return (
    <FeedShell active={{ kind: 'topic', slug: topic.slug }} sidebar={<FeedSidebar />}>
      <header className="card-flat flex items-center gap-3 p-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-2xl">{topic.icon}</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{topic.label}</h1>
          <p className="text-xs text-gray-500">t/{topic.slug} · {DESCRIPTIONS[topic.slug]}</p>
        </div>
      </header>
      <FeedComposer hint={`Post in ${topic.label}…`} />
      <SortTabs basePath={`/t/${topic.slug}`} sort={page.sort} t={t} />
      <Feed
        initialItems={page.items}
        initialCursor={page.next_cursor}
        sort={page.sort}
        t={t}
        topic={topic.slug}
        emptyState={
          <div className="card-flat py-12 text-center text-sm text-gray-500">
            No {topic.label.toLowerCase()} posts yet — pick the {topic.label} category when you write a thread.
          </div>
        }
      />
    </FeedShell>
  );
}
