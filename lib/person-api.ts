import { supabaseAdmin } from '@/lib/supabase-admin';

/** Published, non-deleted person by slug (for public person APIs) */
export async function findPublishedPerson(slug: string) {
  const { data } = await supabaseAdmin
    .from('persons')
    .select('id, slug, name_en, is_controversial')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .eq('is_published', true)
    .maybeSingle();
  return data as { id: string; slug: string; name_en: string; is_controversial: boolean | null } | null;
}
