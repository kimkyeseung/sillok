import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search Korean historical figures, artifacts, events, and threads on Sillok.',
  alternates: { canonical: '/search' },
  openGraph: {
    title: 'Search | Sillok',
    description: 'Search Korean historical figures, artifacts, events, and threads.',
  },
  twitter: {
    card: 'summary',
    title: 'Search | Sillok',
    description: 'Search Korean historical figures, artifacts, events, and threads.',
  },
};

const SearchClient = dynamic(() => import('@/components/search/SearchClient'), {
  ssr: false,
});

export default function SearchPage() {
  return <SearchClient />;
}
