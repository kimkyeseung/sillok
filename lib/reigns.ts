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

export const ReignIdSchema = z.string().uuid();

/** Cursor = "<reign_start>_<id>" of the last row (list is ordered by reign_start, id) */
export const ReignListSchema = z.object({
  cursor: z.string().regex(/^-?\d+_[0-9a-f-]{36}$/).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export function parseReignCursor(cursor: string): { start: number; id: string } {
  const i = cursor.indexOf('_');
  return { start: parseInt(cursor.slice(0, i), 10), id: cursor.slice(i + 1) };
}
