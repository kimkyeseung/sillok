import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/reports/:id/resolve — Resolve report [ADMIN] ───

const ResolveSchema = z.object({
  action: z.enum(['warn', 'delete', 'ban']),
  ban_duration: z.number().min(1).max(8760).optional(),
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

  const result = ResolveSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data: report, error: fetchError } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'PENDING')
    .single();

  if (fetchError || !report)
    return apiError('NODE_NOT_FOUND', 'Report not found.', 404);

  const { action, ban_duration } = result.data;

  // Soft delete reported content
  if (action === 'delete' || action === 'ban') {
    const tableMap: Record<string, string> = {
      thread: 'threads',
      reply: 'thread_replies',
      node_comment: 'node_comments',
    };
    const table = tableMap[report.target_type];
    if (table) {
      await supabaseAdmin
        .from(table)
        .update({ is_deleted: true })
        .eq('id', report.target_id);
    }
  }

  // Update report status
  const { error: updateError } = await supabaseAdmin
    .from('reports')
    .update({ status: 'RESOLVED', resolved_action: action })
    .eq('id', params.id);

  if (updateError)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ resolved: true, action });
}
