import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { FORMAT_DEFS, GenerateMemeSchema, MemeListSchema, parseMemeCursor } from '@/lib/meme';
import { generateCaptions } from '@/lib/meme-ai';
import { loadEventBySlug, loadFiguresBySlugs, loadRelation, pickAutoCandidates } from '@/lib/meme-data';
import { MEME_COLUMNS, insertMeme, memeAiErrorResponse, withFigures, type MemeRow } from '@/lib/meme-server';

// Claude calls take a while; auto mode runs up to 5 in parallel
export const maxDuration = 120;

// ─── GET /api/admin/memes — Memes, cursor-paginated [ADMIN] ───

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { searchParams } = new URL(request.url);
  const parsed = MemeListSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422);
  const { status, cursor, limit } = parsed.data;

  let query = supabaseAdmin
    .from('memes')
    .select(MEME_COLUMNS)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);
  if (status) query = query.eq('status', status);
  if (cursor) {
    const c = parseMemeCursor(cursor);
    if (!c) return apiError('VALIDATION_ERROR', 'Invalid cursor.', 422);
    // Quoted: timestamps contain ':' and '+'
    query = query.or(`created_at.lt."${c.createdAt}",and(created_at.eq."${c.createdAt}",id.lt.${c.id})`);
  }

  const { data, error } = await query;
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const rows = (data ?? []) as unknown as MemeRow[];
  const has_next = rows.length > limit;
  const items = has_next ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return apiSuccess({
    items: await withFigures(items),
    has_next,
    next_cursor: has_next && last ? `${last.created_at}_${last.id}` : null,
  });
}

// ─── POST /api/admin/memes — Generate wojak meme draft(s) with AI [ADMIN] ───
// manual: chosen format + figures (+ optional event) → 1 draft
// auto:   random RIVAL/ALLY/FAMILY pairs → up to `count` drafts

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }
  const parsed = GenerateMemeSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422, parsed.error.issues);
  const input = parsed.data;

  if (input.mode === 'manual') {
    const def = FORMAT_DEFS[input.format];
    // drake / its-over take one subject; a second figure is optional context
    const minFigures = def.figures;
    const maxFigures = 2;
    if (input.person_slugs.length < minFigures || input.person_slugs.length > maxFigures)
      return apiError('VALIDATION_ERROR', `"${def.label}" needs ${minFigures === 2 ? 'two figures' : 'one or two figures'}.`, 422);

    const [found, event] = await Promise.all([
      loadFiguresBySlugs(input.person_slugs),
      input.event_slug ? loadEventBySlug(input.event_slug) : Promise.resolve(null),
    ]);
    const missing = input.person_slugs.filter((_, i) => !found[i]);
    if (missing.length) return apiError('PERSON_NOT_FOUND', `Figure not found: ${missing.join(', ')}`, 404);
    if (input.event_slug && !event) return apiError('NODE_NOT_FOUND', 'Event not found.', 404);
    const figures = found.filter((f) => !!f);
    const ineligible = figures.filter((f) => !f.eligible).map((f) => f.name);
    if (ineligible.length)
      return apiError('MEME_INELIGIBLE', `Only published, pre-modern figures can be used: ${ineligible.join(', ')}`, 422);

    const relation = figures.length === 2 ? await loadRelation(figures[0].id, figures[1].id) : null;

    try {
      const { content, fact, title } = await generateCaptions({ format: input.format, figures, relation, event });
      const meme = await insertMeme({
        kind: 'template',
        format: input.format,
        title: title || null,
        person_ids: figures.map((f) => f.id),
        event_node_id: event?.id ?? null,
        content,
        fact: fact || null,
        created_by: admin.id,
      });
      return apiSuccess({ created: await withFigures([meme]), skipped: 0 });
    } catch (err) {
      return memeAiErrorResponse(err);
    }
  }

  // auto
  let candidates;
  try {
    candidates = await pickAutoCandidates(input.count);
  } catch (err) {
    return memeAiErrorResponse(err);
  }
  if (candidates.length === 0)
    return apiError('NO_CANDIDATES', 'No unused RIVAL/ALLY/FAMILY pairs of pre-modern figures left.', 422);

  const results = await Promise.allSettled(
    candidates.map(async (c) => {
      const { content, fact, title } = await generateCaptions({ format: c.format, figures: c.figures, relation: c.relation });
      return insertMeme({
        kind: 'template',
        format: c.format,
        title: title || null,
        person_ids: c.figures.map((f) => f.id),
        content,
        fact: fact || null,
        created_by: admin.id,
      });
    }),
  );
  const created = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  const failures = results.flatMap((r) => (r.status === 'rejected' ? [r.reason] : []));
  if (created.length === 0) return memeAiErrorResponse(failures[0]);
  return apiSuccess({ created: await withFigures(created), skipped: failures.length });
}
