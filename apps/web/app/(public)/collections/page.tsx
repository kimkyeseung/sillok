import dynamic from 'next/dynamic';

const CollectionsClient = dynamic(
  () => import('@/components/collection/CollectionsClient'),
  { ssr: false }
);

export default function CollectionsPage() {
  return <CollectionsClient />;
}
