import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/persons/all — All persons with tags (no pagination) [ADMIN] ───

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { data, error } = await supabaseAdmin
    .from('persons')
    .select(
      `
      id, slug, name_ko, name_hanja, name_en,
      birth_year, death_year, is_published,
      person_tags ( tags ( id, name_ko, name_en, type ) )
    `
    )
    .eq('is_deleted', false)
    .order('name_ko', { ascending: true });

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
