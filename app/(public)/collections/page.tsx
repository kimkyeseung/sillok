import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Curated collections of Korean historical figures — explore themed groups and custom lists.',
  alternates: { canonical: '/collections' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Collections | Sillok',
    description: 'Curated collections of Korean historical figures.',
  },
  twitter: {
    images: [DEFAULT_OG_IMAGE],
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
  return (
    <>
      <h1 className="sr-only">Collections of Korean Historical Figures</h1>
      <CollectionsClient />
    </>
  );
}
