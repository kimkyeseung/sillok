import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sillok.kr';

  const [
    { data: persons },
    { data: nodes },
    { data: articles },
    { data: threads },
  ] = await Promise.all([
    supabaseAdmin
      .from('persons')
      .select('slug, updated_at')
      .eq('is_deleted', false)
      .eq('is_published', true),
    supabaseAdmin
      .from('nodes')
      .select('slug, updated_at')
      .eq('is_deleted', false),
    supabaseAdmin
      .from('articles')
      .select('slug, updated_at')
      .eq('is_deleted', false)
      .eq('is_published', true),
    supabaseAdmin
      .from('threads')
      .select('id, updated_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1000),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/persons`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  const personPages: MetadataRoute.Sitemap = (persons ?? []).map((p) => ({
    url: `${baseUrl}/persons/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const nodePages: MetadataRoute.Sitemap = (nodes ?? []).map((n) => ({
    url: `${baseUrl}/nodes/${n.slug}`,
    lastModified: new Date(n.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${baseUrl}/articles/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const threadPages: MetadataRoute.Sitemap = (threads ?? []).map((t) => ({
    url: `${baseUrl}/threads/${t.id}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...personPages,
    ...nodePages,
    ...articlePages,
    ...threadPages,
  ];
}
