import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/persons/all — All persons with tags (no pagination) [ADMIN] ───
// Query params:
//   era    — filter by ERA tag name_en (e.g. Joseon, Goryeo, Modern)
//   field  — filter by FIELD tag name_en (e.g. Scholar, Royalty, General)
//   q      — search by name

const QuerySchema = z.object({
  era: z.string().optional(),
  field: z.string().optional(),
  q: z.string().optional(),
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { era, field, q } = parsed.data;

  // Build tag filter: find person IDs that match the requested tags
  let filteredPersonIds: string[] | null = null;

  if (era || field) {
    const tagNames: string[] = [];
    if (era) tagNames.push(era);
    if (field) tagNames.push(field);

    const { data: matchingTags } = await supabaseAdmin
      .from('tags')
      .select('id')
      .in('name_en', tagNames);

    if (matchingTags && matchingTags.length > 0) {
      // If both era and field specified, person must have BOTH tags
      if (era && field && matchingTags.length === 2) {
        const tagIdA = matchingTags[0].id;
        const tagIdB = matchingTags[1].id;

        const { data: linksA } = await supabaseAdmin
          .from('person_tags')
          .select('person_id')
          .eq('tag_id', tagIdA);
        const { data: linksB } = await supabaseAdmin
          .from('person_tags')
          .select('person_id')
          .eq('tag_id', tagIdB);

        const setA = new Set((linksA ?? []).map((l) => l.person_id));
        filteredPersonIds = (linksB ?? [])
          .map((l) => l.person_id)
          .filter((id) => setA.has(id));
      } else {
        const tagIds = matchingTags.map((t) => t.id);
        const { data: links } = await supabaseAdmin
          .from('person_tags')
          .select('person_id')
          .in('tag_id', tagIds);

        filteredPersonIds = (links ?? []).map((l) => l.person_id);
      }

      if (filteredPersonIds.length === 0) {
        return apiSuccess({ items: [], total: 0 });
      }
    }
  }

  let query = supabaseAdmin
    .from('persons')
    .select(
      `
      id, slug, name_ko, name_hanja, name_en,
      birth_year, death_year, is_published,
      person_tags ( tags ( id, name_ko, name_en, type ) )
    `
    )
    .eq('is_deleted', false);

  if (filteredPersonIds) {
    query = query.in('id', filteredPersonIds);
  }

  if (q) {
    query = query.or(
      `name_ko.ilike.%${q}%,name_hanja.ilike.%${q}%,name_en.ilike.%${q}%`
    );
  }

  query = query.order('name_ko', { ascending: true });

  const { data, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const items = (data ?? []).map(({ person_tags, ...person }) => ({
    ...person,
    tags: (person_tags as unknown as { tags: { id: string; name_ko: string; name_en: string | null; type: string } | null }[])
      .map((pt) => pt.tags)
      .filter(Boolean),
  }));

  return apiSuccess({ items, total: items.length });
}
