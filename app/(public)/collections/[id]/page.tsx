import dynamic from 'next/dynamic';

const CollectionDetail = dynamic(
  () => import('@/components/collection/CollectionDetail'),
  { ssr: false }
);

interface Props {
  params: { id: string };
}

export default function CollectionDetailPage({ params }: Props) {
  return <CollectionDetail collectionId={params.id} />;
}
