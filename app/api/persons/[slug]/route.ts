import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/persons/:slug — Person detail (public) ───

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { data: person, error } = await supabaseAdmin
    .from('persons')
    .select(
      `
      *,
      person_tags ( tag_id, tags ( id, name_ko, name_en, type ) )
    `
    )
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (error || !person)
    return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  return apiSuccess(person);
}

// ─── PUT /api/persons/:slug — Update person [ADMIN] ───
// NOTE: Find by slug, update by id

const UpdatePersonSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  name_ko: z.string().min(1).max(100).optional(),
  name_hanja: z.string().max(100).optional().nullable(),
  name_en: z.string().max(200).optional().nullable(),
  birth_year: z.number().int().optional().nullable(),
  birth_date: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  death_year: z.number().int().optional().nullable(),
  death_date: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  birth_place: z.string().max(200).optional().nullable(),
  summary: z.string().max(5000).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  is_controversial: z.boolean().optional(),
  is_alive: z.boolean().optional(),
  is_published: z.boolean().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
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

  const result = UpdatePersonSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  // Find person by slug
  const { data: existing } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (!existing)
    return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const { tag_ids, ...updateData } = result.data;

  // Only update if there are fields to change
  if (Object.keys(updateData).length > 0) {
    const { error } = await supabaseAdmin
      .from('persons')
      .update(updateData)
      .eq('id', existing.id);

    if (error) {
      if (error.code === '23505')
        return apiError('VALIDATION_ERROR', 'Slug already exists.', 409);
      return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
    }
  }

  // Replace tags
  if (tag_ids !== undefined) {
    await supabaseAdmin
      .from('person_tags')
      .delete()
      .eq('person_id', existing.id);

    if (tag_ids.length > 0) {
      const tagLinks = tag_ids.map((tag_id) => ({
        person_id: existing.id,
        tag_id,
      }));
      await supabaseAdmin.from('person_tags').insert(tagLinks);
    }
  }

  // Return updated data
  const { data: updated } = await supabaseAdmin
    .from('persons')
    .select('*')
    .eq('id', existing.id)
    .single();

  return apiSuccess(updated);
}

// ─── DELETE /api/persons/:slug — Soft delete person [ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { data: existing } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (!existing)
    return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const { error } = await supabaseAdmin
    .from('persons')
    .update({ is_deleted: true })
    .eq('id', existing.id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ deleted: true });
}
