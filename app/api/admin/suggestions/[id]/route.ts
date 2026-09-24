import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PATCH /api/admin/suggestions/:id — Approve / reject { status, admin_note? } [ADMIN] ───
// Approving only marks the suggestion; the editor adds the content via the page content editor.

const ReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  admin_note: z.string().trim().max(500).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);
  if (!z.string().uuid().safeParse(params.id).success)
    return apiError('VALIDATION_ERROR', 'Invalid suggestion id.', 422);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data, error } = await supabaseAdmin
    .from('person_suggestions')
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.admin_note ?? null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select('id, status')
    .maybeSingle();
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  if (!data) return apiError('NOT_FOUND', 'Suggestion not found.', 404);

  return apiSuccess(data);
}
