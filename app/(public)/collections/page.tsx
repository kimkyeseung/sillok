import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Curated collections of Korean historical figures — explore themed groups and custom lists.',
  alternates: { canonical: '/collections' },
  openGraph: {
    title: 'Collections | Sillok',
    description: 'Curated collections of Korean historical figures.',
  },
  twitter: {
    card: 'summary',
    title: 'Collections | Sillok',
    description: 'Curated collections of Korean historical figures.',
  },
};

const CollectionsClient = dynamic(
  () => import('@/components/collection/CollectionsClient'),
  { ssr: false }
);

export default function CollectionsPage() {
  return <CollectionsClient />;
}
