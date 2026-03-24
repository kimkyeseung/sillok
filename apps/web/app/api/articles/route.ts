import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/articles — Article list (public / admin) ───

const ListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  tag: z.string().optional(),
  is_notice: z.coerce.boolean().optional(),
  include_unpublished: z.coerce.boolean().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { limit, cursor, tag, is_notice, include_unpublished } = parsed.data;

  // 비공개 포함 요청 시 어드민 인증 필요
  let showAll = false;
  if (include_unpublished) {
    const admin = await requireAdmin(request);
    if (admin) showAll = true;
  }

  let query = supabaseAdmin
    .from('articles')
    .select(
      'id, slug, title, summary, thumbnail, tag, is_notice, is_published, view_count, created_at'
    )
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (!showAll) query = query.eq('is_published', true);
  if (tag) query = query.eq('tag', tag);
  if (is_notice !== undefined) query = query.eq('is_notice', is_notice);
  if (cursor) query = query.lt('created_at', cursor);
  query = query.limit(limit + 1);

  const { data, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const hasNext = (data?.length ?? 0) > limit;
  const items = hasNext ? data!.slice(0, limit) : (data ?? []);
  const lastItem = items[items.length - 1];

  return apiSuccess({
    items,
    has_next: hasNext,
    next_cursor: hasNext && lastItem ? lastItem.created_at : null,
  });
}

// ─── POST /api/articles — Create article [ADMIN] ───

const CreateArticleSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(300),
  body: z.string().min(1),
  summary: z.string().max(500).optional(),
  thumbnail: z.string().url().optional(),
  tag: z.enum(['기획', '특집', '인물탐구', '현대', '공지', '안내']),
  is_notice: z.boolean().default(false),
  is_published: z.boolean().default(false),
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

  const result = CreateArticleSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  const { data, error } = await supabaseAdmin
    .from('articles')
    .insert({ ...result.data, author_id: admin.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', 'Slug already exists.', 409);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  return apiSuccess(data);
}
