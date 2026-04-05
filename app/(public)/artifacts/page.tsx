import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Metadata } from 'next';
import ArtifactsClient from '@/components/artifacts/ArtifactsClient';

export const metadata: Metadata = {
  title: 'Artifacts — Korean National Treasures',
  description:
    'Explore Korea\'s national treasures and cultural heritage artifacts from ancient times to the Joseon Dynasty.',
  alternates: { canonical: '/artifacts' },
  openGraph: {
    title: 'Artifacts — Korean National Treasures | Sillok',
    description:
      'Explore Korea\'s national treasures and cultural heritage artifacts.',
  },
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export interface ArtifactItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  metadata: {
    designation?: string;
    designation_ko?: string;
    location?: string;
    location_ko?: string;
    created_period?: string;
    created_year?: number;
    material?: string;
    category?: string;
  } | null;
  view_count: number;
  person_node_links: Array<{
    persons: {
      id: string;
      slug: string;
      name_ko: string;
      name_en: string | null;
    } | null;
  }>;
}

export default async function ArtifactsPage() {
  const { data } = await supabaseAdmin
    .from('nodes')
    .select(
      `id, slug, title, description, thumbnail, metadata, view_count,
       person_node_links ( persons:person_id ( id, slug, name_ko, name_en ) )`
    )
    .eq('node_type', 'ARTIFACT')
    .eq('is_deleted', false)
    .eq('is_published', true)
    .order('created_at', { ascending: true });

  const artifacts: ArtifactItem[] = (data ?? []) as unknown as ArtifactItem[];

  return <ArtifactsClient artifacts={artifacts} />;
}
