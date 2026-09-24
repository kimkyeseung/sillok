import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CONTENT_SCHEMAS, CONTENT_TABLES, type ContentKind } from '@/lib/person-content-schemas';
import { getPersonIdBySlug, toContentRow } from '@/lib/person-content-server';

// ─── GET  /api/admin/persons/:slug/content — Facts, highlights, sources (incl. AI drafts) [ADMIN] ───
// ─── POST /api/admin/persons/:slug/content — Add one item { kind, data } [ADMIN] ───


export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const personId = await getPersonIdBySlug(params.slug);
  if (!personId) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const [facts, highlights, sources] = await Promise.all([
    supabaseAdmin
      .from('person_facts')
      .select('id, label, value, linked_person_id, sort_order, is_ai_generated, persons!person_facts_linked_person_id_fkey ( slug, name_en )')
      .eq('person_id', personId)
      .eq('is_deleted', false)
      .order('sort_order'),
    supabaseAdmin
      .from('person_highlights')
      .select('id, kind, title, body, year, sort_order, is_ai_generated')
      .eq('person_id', personId)
      .eq('is_deleted', false)
      .order('sort_order'),
    supabaseAdmin
      .from('person_sources')
      .select('id, kind, title, url, citation, sort_order, is_ai_generated')
      .eq('person_id', personId)
      .eq('is_deleted', false)
      .order('sort_order'),
  ]);

  const error = facts.error ?? highlights.error ?? sources.error;
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({
    facts: (facts.data ?? []).map(({ persons, ...f }) => ({
      ...f,
      linked_person: persons ?? null,
    })),
    highlights: highlights.data ?? [],
    sources: sources.data ?? [],
  });
}

const CreateSchema = z.object({
  kind: z.enum(['fact', 'highlight', 'source']),
  data: z.record(z.unknown()),
});

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }
  const envelope = CreateSchema.safeParse(body);
  if (!envelope.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const kind = envelope.data.kind as ContentKind;
  const parsed = CONTENT_SCHEMAS[kind].safeParse(envelope.data.data);
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, parsed.error.issues);

  const personId = await getPersonIdBySlug(params.slug);
  if (!personId) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const row = await toContentRow(kind, parsed.data);
  if ('error' in row) return row.error;

  const { data, error } = await supabaseAdmin
    .from(CONTENT_TABLES[kind])
    // Items added by an editor are reviewed by definition
    .insert({ ...row.value, person_id: personId, is_ai_generated: row.value.is_ai_generated ?? false })
    .select()
    .single();
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(data, 201);
}
