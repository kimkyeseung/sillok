import { supabaseAdmin } from './supabase-admin';
import { memeName, type MemeKind } from './meme';

// ─── Share kit loaders (server only) ───

export interface PromoThread {
  id: string;
  title: string;
  content: string;
  created_at: string;
  like_count: number;
  reply_count: number;
  view_count: number;
  is_deleted: boolean;
  image: { url: string; alt: string | null } | null;
  figures: { slug: string; name: string }[];
  /** ERA tag slugs of the figures (joseon, goryeo, …) */
  eras: string[];
  /** Set when the thread was posted from AI Drafts */
  draftKind: MemeKind | null;
}

interface Row {
  id: string;
  title: string;
  content: string;
  created_at: string;
  like_count: number | null;
  reply_count: number | null;
  view_count: number | null;
  is_deleted: boolean | null;
  thread_images: { url: string; alt?: string | null; sort_order: number }[] | null;
  thread_persons:
    | {
        is_primary: boolean;
        sort_order: number;
        persons: {
          slug: string;
          name_en: string | null;
          name_ko: string;
          person_tags: { tags: { name_en: string | null; type: string } | null }[] | null;
        } | null;
      }[]
    | null;
}

export async function loadPromoThread(id: string): Promise<PromoThread | null> {
  const [{ data }, { data: draft }] = await Promise.all([
    supabaseAdmin
      .from('threads')
      .select(
        `id, title, content, created_at, like_count, reply_count, view_count, is_deleted,
         thread_images ( * ),
         thread_persons ( is_primary, sort_order, persons ( slug, name_en, name_ko, person_tags ( tags ( name_en, type ) ) ) )`,
      )
      .eq('id', id)
      .maybeSingle(),
    supabaseAdmin.from('ai_drafts').select('kind').eq('thread_id', id).eq('is_deleted', false).maybeSingle(),
  ]);
  if (!data) return null;
  const r = data as unknown as Row;

  const people = [...(r.thread_persons ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((tp) => tp.persons)
    .filter((p): p is NonNullable<typeof p> => !!p);
  const firstImage = [...(r.thread_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];

  return {
    id: r.id,
    title: r.title,
    content: r.content,
    created_at: r.created_at,
    like_count: r.like_count ?? 0,
    reply_count: r.reply_count ?? 0,
    view_count: r.view_count ?? 0,
    is_deleted: r.is_deleted === true,
    image: firstImage ? { url: firstImage.url, alt: firstImage.alt ?? null } : null,
    figures: people.map((p) => ({ slug: p.slug, name: memeName(p.name_en || p.name_ko) })),
    eras: Array.from(
      new Set(people.flatMap((p) => (p.person_tags ?? []).filter((t) => t.tags?.type === 'ERA').map((t) => t.tags!.name_en ?? ''))),
    ).filter(Boolean),
    draftKind: (draft?.kind as MemeKind | undefined) ?? null,
  };
}

export const PROMO_POST_COLUMNS =
  'id, thread_id, platform, target, title, body, hashtags, alt_text, is_ai_generated, status, posted_url, posted_at, created_at, updated_at';

export interface PromoPostRow {
  id: string;
  thread_id: string;
  platform: 'instagram' | 'reddit' | 'x' | 'threads';
  target: string | null;
  title: string | null;
  body: string;
  hashtags: string[];
  alt_text: string | null;
  is_ai_generated: boolean;
  status: 'draft' | 'posted';
  posted_url: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function loadPromoPosts(threadId: string): Promise<PromoPostRow[]> {
  const { data, error } = await supabaseAdmin
    .from('promo_posts')
    .select(PROMO_POST_COLUMNS)
    .eq('thread_id', threadId)
    .eq('is_deleted', false)
    .order('created_at');
  if (error) throw new Error(`[promo] posts fetch failed: ${error.message}`);
  return (data ?? []) as PromoPostRow[];
}

/** Posted platforms per thread (list badges; avoid promoting a thread twice) */
export async function loadPostedSummary(threadIds: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (threadIds.length === 0) return out;
  const { data } = await supabaseAdmin
    .from('promo_posts')
    .select('thread_id, platform, target')
    .in('thread_id', threadIds)
    .eq('status', 'posted')
    .eq('is_deleted', false);
  for (const p of data ?? []) {
    const label = p.platform === 'reddit' && p.target ? `r/${p.target}` : p.platform;
    out.set(p.thread_id, [...(out.get(p.thread_id) ?? []), label]);
  }
  return out;
}
