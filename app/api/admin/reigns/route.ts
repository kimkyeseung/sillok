import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidateAgeFlow } from '@/lib/age-flow-data';
import { ReignSchema, ReignListSchema, findPersonId, parseReignCursor } from '@/lib/reigns';

// Reign periods for the Age Flow "current king" (reigns table)

// ─── GET /api/admin/reigns — Reigns, cursor-paginated [ADMIN] ───

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { searchParams } = new URL(request.url);
  const parsed = ReignListSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);
  const { cursor, limit } = parsed.data;

  let query = supabaseAdmin
    .from('reigns')
    .select('id, reign_start, reign_end, persons:person_id ( id, slug, name_en, name_ko )')
    .order('reign_start')
    .order('id')
    .limit(limit + 1);

  if (cursor) {
    const c = parseReignCursor(cursor);
    query = query.or(`reign_start.gt.${c.start},and(reign_start.eq.${c.start},id.gt.${c.id})`);
  }

  const { data, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const rows = data ?? [];
  const has_next = rows.length > limit;
  const items = has_next ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return apiSuccess({
    items,
    has_next,
    next_cursor: has_next && last ? `${last.reign_start}_${last.id}` : null,
  });
}

// ─── POST /api/admin/reigns — Create reign [ADMIN] ───

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = ReignSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  const personId = await findPersonId(result.data.person_slug);
  if (!personId) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const { data, error } = await supabaseAdmin
    .from('reigns')
    .insert({ person_id: personId, reign_start: result.data.reign_start, reign_end: result.data.reign_end })
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', 'This reign already exists.', 409);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  revalidateAgeFlow();
  return apiSuccess(data);
}
