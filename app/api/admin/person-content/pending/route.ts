import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/person-content/pending — Persons with unreviewed AI drafts [ADMIN] ───

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const tables = ['person_facts', 'person_highlights', 'person_sources'] as const;
  const results = await Promise.all(
    tables.map((t) =>
      supabaseAdmin
        .from(t)
        .select('person_id')
        .eq('is_ai_generated', true)
        .eq('is_deleted', false)
        .limit(5000)
    )
  );
  const error = results.find((r) => r.error)?.error;
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const counts = new Map<string, number>();
  results.forEach((r) =>
    (r.data ?? []).forEach((row) => counts.set(row.person_id, (counts.get(row.person_id) ?? 0) + 1))
  );
  if (!counts.size) return apiSuccess({ persons: [] });

  const { data: persons } = await supabaseAdmin
    .from('persons')
    .select('id, slug, name_en, name_ko, birth_year')
    .in('id', Array.from(counts.keys()));

  return apiSuccess({
    persons: (persons ?? [])
      .map((p) => ({ ...p, pending: counts.get(p.id) ?? 0 }))
      .sort((a, b) => (a.birth_year ?? 0) - (b.birth_year ?? 0)),
  });
}
