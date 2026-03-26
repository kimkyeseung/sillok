import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/admin/persons/bulk — Bulk register persons [ADMIN] ───

const TimelineItemSchema = z.object({
  year: z.number().int(),
  title: z.string().min(1),
  description: z.string().optional(),
});

const BulkPersonSchema = z.object({
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
  tag_names: z.array(z.string()).optional(),
  timeline: z.array(TimelineItemSchema).optional(),
});

const BulkUploadSchema = z.array(BulkPersonSchema).min(1).max(100);

interface BulkResult {
  slug: string;
  name_ko: string;
  success: boolean;
  error?: string;
}

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

  const parsed = BulkUploadSchema.safeParse(body);
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, parsed.error.issues);

  const persons = parsed.data;
  const results: BulkResult[] = [];

  for (const person of persons) {
    const { tag_names, timeline, ...personData } = person;

    try {
      // 1. Register person
      const { data: created, error: insertError } = await supabaseAdmin
        .from('persons')
        .insert(personData)
        .select()
        .single();

      if (insertError) {
        const msg =
          insertError.code === '23505'
            ? 'Slug already exists.'
            : insertError.message;
        results.push({ slug: person.slug, name_ko: person.name_ko, success: false, error: msg });
        continue;
      }

      // 2. Link tags (lookup tag_id from tag_names)
      if (tag_names && tag_names.length > 0) {
        const { data: tags } = await supabaseAdmin
          .from('tags')
          .select('id, name_ko')
          .in('name_ko', tag_names);

        if (tags && tags.length > 0) {
          const tagLinks = tags.map((tag) => ({
            person_id: created.id,
            tag_id: tag.id,
          }));
          await supabaseAdmin.from('person_tags').insert(tagLinks);
        }
      }

      // 3. Register timeline
      if (timeline && timeline.length > 0) {
        const timelineRows = timeline.map((item, idx) => ({
          person_id: created.id,
          year: item.year,
          title: item.title,
          description: item.description ?? null,
          sort_order: idx,
        }));
        await supabaseAdmin.from('person_timeline').insert(timelineRows);
      }

      results.push({ slug: person.slug, name_ko: person.name_ko, success: true });
    } catch {
      results.push({ slug: person.slug, name_ko: person.name_ko, success: false, error: 'Unknown error' });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return apiSuccess({
    total: results.length,
    success_count: successCount,
    fail_count: failCount,
    results,
  });
}
