import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search Korean historical figures, artifacts, events, and threads on Sillok.',
  alternates: { canonical: '/search' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Search | Sillok',
    description: 'Search Korean historical figures, artifacts, events, and threads.',
  },
  twitter: {
    images: [DEFAULT_OG_IMAGE],
    card: 'summary',
    title: 'Search | Sillok',
    description: 'Search Korean historical figures, artifacts, events, and threads.',
  },
};

const SearchClient = dynamic(() => import('@/components/search/SearchClient'), {
  ssr: false,
});

export default function SearchPage() {
  return (
    <>
      <h1 className="sr-only">Search Korean Historical Figures</h1>
      <SearchClient />
    </>
  );
}
