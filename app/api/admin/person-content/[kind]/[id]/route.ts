import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CONTENT_SCHEMAS, CONTENT_TABLES, type ContentKind } from '@/lib/person-content-schemas';
import { toContentRow } from '@/lib/person-content-server';

// ─── PATCH  /api/admin/person-content/:kind/:id — Edit / mark reviewed [ADMIN] ───
// ─── DELETE /api/admin/person-content/:kind/:id — Soft delete [ADMIN] ───

const ParamsSchema = z.object({
  kind: z.enum(['fact', 'highlight', 'source']),
  id: z.string().uuid(),
});

export async function PATCH(request: Request, { params }: { params: { kind: string; id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const p = ParamsSchema.safeParse(params);
  if (!p.success) return apiError('VALIDATION_ERROR', 'Invalid content reference.', 422);
  const kind = p.data.kind as ContentKind;

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }
  const parsed = CONTENT_SCHEMAS[kind].partial().safeParse(body);
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, parsed.error.issues);
  if (!Object.keys(parsed.data).length)
    return apiError('VALIDATION_ERROR', 'Nothing to update.', 422);

  const row = await toContentRow(kind, parsed.data);
  if ('error' in row) return row.error;

  const { data, error } = await supabaseAdmin
    .from(CONTENT_TABLES[kind])
    .update(row.value)
    .eq('id', p.data.id)
    .eq('is_deleted', false)
    .select()
    .maybeSingle();
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  if (!data) return apiError('NOT_FOUND', 'Content not found.', 404);

  return apiSuccess(data);
}

export async function DELETE(request: Request, { params }: { params: { kind: string; id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const p = ParamsSchema.safeParse(params);
  if (!p.success) return apiError('VALIDATION_ERROR', 'Invalid content reference.', 422);

  const { data, error } = await supabaseAdmin
    .from(CONTENT_TABLES[p.data.kind as ContentKind])
    .update({ is_deleted: true })
    .eq('id', p.data.id)
    .select('id')
    .maybeSingle();
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  if (!data) return apiError('NOT_FOUND', 'Content not found.', 404);

  return apiSuccess({ deleted: true });
}
