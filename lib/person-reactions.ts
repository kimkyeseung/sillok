import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getGallery, getPersonBySlug } from '@/lib/person-page';

/** Hearts and comments on person page items (server-only helpers) */

export const ITEM_TARGET_TYPES = ['HIGHLIGHT', 'GALLERY', 'PORTRAYAL'] as const;
export type ItemTargetType = (typeof ITEM_TARGET_TYPES)[number];

export const ItemTargetSchema = z.object({
  target_type: z.enum(ITEM_TARGET_TYPES),
  target_key: z.string().trim().min(1).max(100),
});

export const targetId = (type: string, key: string) => `${type}:${key}`;

/** Published person by slug */
export async function findReactablePerson(slug: string) {
  const person = await getPersonBySlug(slug);
  return person && person.is_published ? person : null;
}

/** The target must belong to this person's page */
export async function targetExists(
  person: NonNullable<Awaited<ReturnType<typeof findReactablePerson>>>,
  type: ItemTargetType,
  key: string
): Promise<boolean> {
  if (type === 'HIGHLIGHT') {
    if (!z.string().uuid().safeParse(key).success) return false;
    const { data } = await supabaseAdmin
      .from('person_highlights')
      .select('id')
      .eq('id', key)
      .eq('person_id', person.id)
      .eq('is_deleted', false)
      .maybeSingle();
    return !!data;
  }
  if (type === 'PORTRAYAL') {
    if (!z.string().uuid().safeParse(key).success) return false;
    const { data } = await supabaseAdmin
      .from('person_node_links')
      .select('id')
      .eq('person_id', person.id)
      .eq('node_id', key)
      .maybeSingle();
    return !!data;
  }
  const gallery = await getGallery(person);
  return gallery.some((img) => img.id === key);
}
