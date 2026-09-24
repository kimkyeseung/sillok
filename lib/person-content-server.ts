import { apiError } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ContentKind } from '@/lib/person-content-schemas';

/** Server-only helpers for admin person-content routes */

export async function getPersonIdBySlug(slug: string) {
  const { data } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .maybeSingle();
  return data?.id as string | undefined;
}

/** Resolve linked_person_slug → linked_person_id for facts */
export async function toContentRow(
  kind: ContentKind,
  data: Record<string, unknown>
): Promise<{ value: Record<string, unknown> } | { error: Response }> {
  if (kind !== 'fact' || !('linked_person_slug' in data)) return { value: data };
  const { linked_person_slug, ...rest } = data as { linked_person_slug?: string | null };
  if (!linked_person_slug) return { value: { ...rest, linked_person_id: null } };

  const linkedId = await getPersonIdBySlug(linked_person_slug);
  if (!linkedId) return { error: apiError('PERSON_NOT_FOUND', 'Linked person not found.', 404) };
  return { value: { ...rest, linked_person_id: linkedId } };
}
