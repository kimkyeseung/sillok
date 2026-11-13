import type { Metadata } from 'next';
import FigureHubPage, { figureHubMetadata } from '@/components/person/FigureHubPage';

export const dynamic = 'force-dynamic';
// 'force-no-store' would also bypass the shared directory cache on every request
export const fetchCache = 'default-no-store';

interface Props {
  params: { era: string };
}

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return figureHubMetadata('era', params.era);
}

export default function Page({ params }: Props) {
  return <FigureHubPage kind="era" slug={params.era} />;
}
