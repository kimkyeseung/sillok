import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/timelines?person_id=... — List timeline entries [ADMIN] ───

const ListQuerySchema = z.object({
  person_id: z.string().uuid(),
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'person_id is required.', 422);

  const { data, error } = await supabaseAdmin
    .from('person_timeline')
    .select('id, person_id, year, month, title, description, sort_order')
    .eq('person_id', parsed.data.person_id)
    .order('sort_order', { ascending: true })
    .order('year', { ascending: true });

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(data ?? []);
}

// ─── POST /api/admin/timelines — Create timeline entry [ADMIN] ───

const CreateTimelineSchema = z.object({
  person_id: z.string().uuid(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12).optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  sort_order: z.number().int().default(0),
});

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

  const result = CreateTimelineSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  const { data, error } = await supabaseAdmin
    .from('person_timeline')
    .insert(result.data)
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(data);
}
