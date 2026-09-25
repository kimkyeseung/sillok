// Admin reign editing (reigns table) — shared by /api/admin/reigns routes

import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const ReignSchema = z
  .object({
    person_slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    reign_start: z.number().int().min(-3000).max(2100),
    reign_end: z.number().int().min(-3000).max(2100),
  })
  .refine((r) => r.reign_end >= r.reign_start, { message: 'End year must be on or after start year.' });

/** person_slug → persons.id (null if missing or deleted) */
export async function findPersonId(slug: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .maybeSingle();
  return data?.id ?? null;
}
