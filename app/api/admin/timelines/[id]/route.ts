import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/admin/timelines/:id — Update timeline entry [ADMIN] ───

const UpdateTimelineSchema = z.object({
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional().nullable(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional().nullable(),
  sort_order: z.number().int().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = UpdateTimelineSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data, error } = await supabaseAdmin
    .from('person_timeline')
    .update(result.data)
    .eq('id', params.id)
    .select()
    .single();

  if (error || !data)
    return apiError('NODE_NOT_FOUND', 'Timeline entry not found.', 404);

  return apiSuccess(data);
}

// ─── DELETE /api/admin/timelines/:id — Delete timeline entry [ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { error } = await supabaseAdmin
    .from('person_timeline')
    .delete()
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ deleted: true });
}
