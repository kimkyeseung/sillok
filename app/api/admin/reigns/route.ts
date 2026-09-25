import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidateAgeFlow } from '@/lib/age-flow-data';
import { ReignSchema, findPersonId } from '@/lib/reigns';

// Reign periods for the Age Flow "current king" (reigns table)

// ─── GET /api/admin/reigns — All reigns [ADMIN] ───

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { data, error } = await supabaseAdmin
    .from('reigns')
    .select('id, reign_start, reign_end, persons:person_id ( id, slug, name_en, name_ko )')
    .order('reign_start');

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(data ?? []);
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
