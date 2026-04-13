import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Metadata } from 'next';
import ExploreNodesClient from '@/components/nodes/ExploreNodesClient';

export const metadata: Metadata = {
  title: 'Explore — Artifacts, Events, Media & Groups',
  description:
    'Discover Korean historical artifacts, events, media, and groups. Explore national treasures, pivotal moments, and cultural heritage.',
  alternates: { canonical: '/nodes' },
  openGraph: {
    title: 'Explore Nodes | Sillok',
    description:
      'Discover Korean historical artifacts, events, media, and groups.',
  },
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export interface NodeItem {
  id: string;
  slug: string;
  node_type: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  metadata: Record<string, unknown> | null;
  view_count: number;
  follow_count: number;
  person_node_links: Array<{
    persons: {
      id: string;
      slug: string;
      name_ko: string;
      name_en: string | null;
      thumbnail: string | null;
    } | null;
  }>;
}

export default async function NodesPage() {
  const { data } = await supabaseAdmin
    .from('nodes')
    .select(
      `id, slug, node_type, title, description, thumbnail, metadata, view_count, follow_count,
       person_node_links ( persons:person_id ( id, slug, name_ko, name_en, thumbnail ) )`
    )
    .eq('is_deleted', false)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const nodes: NodeItem[] = (data ?? []) as unknown as NodeItem[];

  return <ExploreNodesClient nodes={nodes} />;
}
