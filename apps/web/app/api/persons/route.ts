import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/persons — Person list (public) ───

const ListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  era: z.string().optional(),
  field: z.string().optional(),
  sort: z.enum(['name', 'popular', 'recent']).default('recent'),
  q: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { limit, cursor, era, field, sort, q } = parsed.data;

  let query = supabaseAdmin
    .from('persons')
    .select(
      `
      id, slug, name_ko, name_hanja, name_en,
      birth_year, death_year, summary, thumbnail,
      is_controversial, is_alive, view_count, follow_count,
      created_at
    `
    )
    .eq('is_deleted', false)
    .eq('is_published', true);

  // Search
  if (q) {
    query = query.or(`name_ko.ilike.%${q}%,name_hanja.ilike.%${q}%,name_en.ilike.%${q}%`);
  }

  // Tag filter (era / field) — person_tags join
  if (era || field) {
    const tagNames: string[] = [];
    if (era) tagNames.push(era);
    if (field) tagNames.push(field);

    const { data: tagIds } = await supabaseAdmin
      .from('tags')
      .select('id')
      .in('name', tagNames);

    if (tagIds && tagIds.length > 0) {
      const { data: personIds } = await supabaseAdmin
        .from('person_tags')
        .select('person_id')
        .in(
          'tag_id',
          tagIds.map((t) => t.id)
        );

      if (personIds && personIds.length > 0) {
        query = query.in(
          'id',
          personIds.map((p) => p.person_id)
        );
      } else {
        return apiSuccess({
          items: [],
          has_next: false,
          next_cursor: null,
          pagination: { limit },
        });
      }
    }
  }

  // Sort + cursor
  if (sort === 'name') {
    query = query.order('name_ko', { ascending: true });
    if (cursor) query = query.gt('name_ko', cursor);
  } else if (sort === 'popular') {
    query = query.order('view_count', { ascending: false });
    if (cursor) query = query.lt('view_count', Number(cursor));
  } else {
    // recent (default)
    query = query.order('created_at', { ascending: false });
    if (cursor) query = query.lt('created_at', cursor);
  }

  query = query.limit(limit + 1);

  const { data, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const hasNext = (data?.length ?? 0) > limit;
  const items = hasNext ? data!.slice(0, limit) : (data ?? []);
  const lastItem = items[items.length - 1];

  let nextCursor: string | null = null;
  if (hasNext && lastItem) {
    if (sort === 'name') nextCursor = lastItem.name_ko;
    else if (sort === 'popular') nextCursor = String(lastItem.view_count);
    else nextCursor = lastItem.created_at;
  }

  return apiSuccess({
    items,
    has_next: hasNext,
    next_cursor: nextCursor,
    pagination: { limit },
  });
}

// ─── POST /api/persons — Create person [ADMIN] ───

const CreatePersonSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  name_ko: z.string().min(1).max(100),
  name_hanja: z.string().max(100).optional(),
  name_en: z.string().max(200).optional(),
  birth_year: z.number().int().optional(),
  birth_date: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .optional(),
  death_year: z.number().int().optional(),
  death_date: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .optional(),
  birth_place: z.string().max(200).optional(),
  summary: z.string().max(5000).optional(),
  thumbnail: z.string().url().optional(),
  is_controversial: z.boolean().default(false),
  is_alive: z.boolean().default(false),
  is_published: z.boolean().default(false),
  tag_ids: z.array(z.string().uuid()).optional(),
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

  const result = CreatePersonSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  const { tag_ids, ...personData } = result.data;

  const { data: person, error } = await supabaseAdmin
    .from('persons')
    .insert(personData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', 'Slug already exists.', 409);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  // Link tags
  if (tag_ids && tag_ids.length > 0) {
    const tagLinks = tag_ids.map((tag_id) => ({
      person_id: person.id,
      tag_id,
    }));
    await supabaseAdmin.from('person_tags').insert(tagLinks);
  }

  return apiSuccess(person);
}
