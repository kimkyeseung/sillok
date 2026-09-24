import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Feed from '@/components/feed/Feed';
import FeedShell from '@/components/feed/FeedShell';
import FeedSidebar from '@/components/feed/FeedSidebar';
import FeedComposer from '@/components/feed/FeedComposer';
import SortTabs from '@/components/feed/SortTabs';
import PersonAvatar from '@/components/common/PersonAvatar';
import { getBoardInfo, getDefaultFeedSort, getFeedPage } from '@/lib/feed-data';
import { FEED_SORTS, TOP_WINDOWS, findBoard, type FeedSort, type TopWindow } from '@/lib/feed';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { board: string };
  searchParams: { sort?: string; t?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const board = findBoard(params.board);
  if (!board) return {};
  const title = `${board.label} — Discussions`;
  const description = `Discussions, stories and debates about the people of ${board.label} on Sillok.`;
  return {
    title,
    description,
    alternates: { canonical: `/b/${board.slug}` },
    openGraph: { title: `${title} | Sillok`, description, images: [DEFAULT_OG_IMAGE] },
  };
}

export default async function BoardPage({ params, searchParams }: Props) {
  const board = findBoard(params.board);
  if (!board) notFound();

  const fallback = await getDefaultFeedSort();
  const sort = (FEED_SORTS as readonly string[]).includes(searchParams.sort ?? '')
    ? (searchParams.sort as FeedSort)
    : fallback.sort;
  const t = (TOP_WINDOWS as readonly string[]).includes(searchParams.t ?? '') ? (searchParams.t as TopWindow) : fallback.t;

  const [page, info] = await Promise.all([getFeedPage({ sort, t, board: board.slug }), getBoardInfo(board.slug)]);

  return (
    <FeedShell active={{ kind: 'board', slug: board.slug }} sidebar={<FeedSidebar />}>
      <header className="card-flat overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-brand-500 to-brand-700" />
        <div className="px-4 pb-4">
          <div className="-mt-7 flex items-end gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-white text-3xl shadow">
              {board.icon}
            </span>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-gray-900">{board.label}</h1>
              <p className="text-xs text-gray-500">
                b/{board.slug} · {info.figureCount} figures · {info.threadCount} threads
              </p>
            </div>
          </div>
          {info.figures.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {info.figures.map((f) => (
                <Link
                  key={f.slug}
                  href={`/persons/${f.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 py-0.5 pl-0.5 pr-2.5 text-xs text-gray-700 hover:border-brand-300"
                >
                  <span className="relative h-5 w-5 overflow-hidden rounded-full bg-gray-100">
                    {f.thumbnail ? (
                      <Image src={f.thumbnail} alt="" fill sizes="20px" className="object-cover" />
                    ) : (
                      <PersonAvatar name={f.name_en} size="xs" />
                    )}
                  </span>
                  {f.name_en}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>
      <FeedComposer hint={`Start a discussion about ${board.label}…`} />
      <SortTabs basePath={`/b/${board.slug}`} sort={page.sort} t={t} />
      <Feed
        initialItems={page.items}
        initialCursor={page.next_cursor}
        sort={page.sort}
        t={t}
        board={board.slug}
        emptyState={
          <div className="card-flat py-12 text-center text-sm text-gray-500">
            No discussions in {board.label} yet — be the first to start one.
          </div>
        }
      />
    </FeedShell>
  );
}
