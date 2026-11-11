import { supabaseAdmin } from '@/lib/supabase-admin';
import { sharedCache } from '@/lib/shared-cache';
import type { Metadata } from 'next';
import ExploreNodesClient from '@/components/nodes/ExploreNodesClient';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';
import { CURATED_NODES_FILTER } from '@/lib/heritage';
import { GROUP_PRIMARY_FILTER } from '@/lib/artifacts';

export const metadata: Metadata = {
  title: 'Explore — Artifacts, Events, Media & Groups',
  description:
    'Discover Korean historical artifacts, events, media, and groups. Explore national treasures, pivotal moments, and cultural heritage.',
  alternates: { canonical: '/nodes' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Explore Nodes | Sillok',
    description:
      'Discover Korean historical artifacts, events, media, and groups.',
  },
};

// Rendered per request (ExploreNodesClient reads the query string), but the list itself is
// shared through getExploreNodes. 'force-no-store' would bypass that cache on every request.
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';

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

const getExploreNodes = sharedCache(
  'nodes-explore',
  // Node writes call revalidateAgeFlow() (same tag); the TTL is only a safety net
  async (): Promise<{ nodes: NodeItem[]; artifactTotal: number }> => {
  // Bulk-imported heritage artifacts (~2,800) are paged in by ArtifactBrowser — only count them here
  const [{ data, error }, { count: artifactTotal, error: countError }] = await Promise.all([
    supabaseAdmin
      .from('nodes')
      .select(
        `id, slug, node_type, title, description, thumbnail, metadata, view_count, follow_count,
         person_node_links ( persons:person_id ( id, slug, name_ko, name_en, thumbnail ) )`
      )
      .eq('is_deleted', false)
      .eq('is_published', true)
      .or(CURATED_NODES_FILTER)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('nodes')
      .select('id', { count: 'exact', head: true })
      .eq('node_type', 'ARTIFACT')
      .eq('is_deleted', false)
      .eq('is_published', true)
      // Same count as the Artifacts list — designation sets count once
      .or(GROUP_PRIMARY_FILTER),
  ]);
  // Throw so an outage is not cached as an empty list
  if (error || countError) throw new Error(`[nodes] explore list: ${(error ?? countError)!.message}`);

  // Drop the Korean source text (heritage metadata) — never rendered in cards
  const nodes: NodeItem[] = ((data ?? []) as unknown as NodeItem[]).map((n) => {
    if (!n.metadata?.content_ko) return n;
    const { content_ko: _, ...metadata } = n.metadata;
    return { ...n, metadata };
  });

  return { nodes, artifactTotal: artifactTotal ?? 0 };
  },
  { revalidate: 300, tags: ['age-flow'] },
  () => ({ nodes: [], artifactTotal: 0 })
);

export default async function NodesPage() {
  const { nodes, artifactTotal } = await getExploreNodes();

  return (
    <ExploreNodesClient nodes={nodes} artifactTotal={artifactTotal} />
  );
}
