import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/suggestions — Review queue (cursor pagination) [ADMIN] ───

const QuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422);
  const { status, limit, cursor } = parsed.data;

  let query = supabaseAdmin
    .from('person_suggestions')
    .select(
      `id, kind, content, source_url, status, admin_note, created_at, user_id,
       persons ( slug, name_en )`
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit + 1);
  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const rows = (data ?? []).slice(0, limit);
  // user_id references auth.users (no FK to profiles) — look nicknames up separately
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await supabaseAdmin.from('profiles').select('id, nickname').in('id', userIds)
    : { data: [] };
  const nickname = new Map((profiles ?? []).map((p) => [p.id, p.nickname]));
  const items = rows.map(({ user_id, ...r }) => ({ ...r, author: nickname.get(user_id) ?? null }));

  return apiSuccess({
    items,
    has_next: (data?.length ?? 0) > limit,
    next_cursor: rows.at(-1)?.created_at ?? null,
  });
}
