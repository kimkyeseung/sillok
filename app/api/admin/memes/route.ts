import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { FORMAT_DEFS, GenerateMemeSchema, MemeListSchema, parseMemeCursor } from '@/lib/meme';
import { generateCaptions, generateStory } from '@/lib/meme-ai';
import { FORMAT_KO } from '@/lib/meme-formats-ko';
import { loadEventBySlug, loadFiguresBySlugs, loadRelation, pickAutoCandidates } from '@/lib/meme-data';
import { MEME_COLUMNS, insertMeme, memeAiErrorResponse, withFigures, type MemeRow } from '@/lib/meme-server';

// Claude calls take a while; auto mode runs up to 5 in parallel
export const maxDuration = 120;

// ─── GET /api/admin/memes — Memes, cursor-paginated [ADMIN] ───

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { searchParams } = new URL(request.url);
  const parsed = MemeListSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422);
  const { status, cursor, limit } = parsed.data;

  let query = supabaseAdmin
    .from('ai_drafts')
    .select(MEME_COLUMNS)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);
  if (status) query = query.eq('status', status);
  if (cursor) {
    const c = parseMemeCursor(cursor);
    if (!c) return apiError('VALIDATION_ERROR', '커서 값이 올바르지 않습니다.', 422);
    // Quoted: timestamps contain ':' and '+'
    query = query.or(`created_at.lt."${c.createdAt}",and(created_at.eq."${c.createdAt}",id.lt.${c.id})`);
  }

  const { data, error } = await query;
  if (error) return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

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

// ─── POST /api/admin/memes — Generate draft(s) with AI [ADMIN] ───
// manual: wojak meme, chosen format + figures (+ optional event) → 1 draft
// story:  twist-ending short fiction about figures (+ optional event) → 1 draft
// auto:   random RIVAL/ALLY/FAMILY pairs → up to `count` drafts

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'JSON 형식이 올바르지 않습니다.', 422);
  }
  const parsed = GenerateMemeSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422, parsed.error.issues);
  const input = parsed.data;

  if (input.mode === 'manual' || input.mode === 'story') {
    if (input.mode === 'manual') {
      const def = FORMAT_DEFS[input.format];
      // drake / its-over take one subject; a second figure is optional context
      if (input.person_slugs.length < def.figures.min || input.person_slugs.length > def.figures.max)
        return apiError(
          'VALIDATION_ERROR',
          `"${FORMAT_KO[input.format].label}"에는 인물 ${def.figures.min === def.figures.max ? def.figures.min : `${def.figures.min}–${def.figures.max}`}명이 필요합니다.`,
          422,
        );
    }

    const [found, event] = await Promise.all([
      loadFiguresBySlugs(input.person_slugs),
      input.event_slug ? loadEventBySlug(input.event_slug) : Promise.resolve(null),
    ]);
    const missing = input.person_slugs.filter((_, i) => !found[i]);
    if (missing.length) return apiError('PERSON_NOT_FOUND', `인물을 찾을 수 없습니다: ${missing.join(', ')}`, 404);
    if (input.event_slug && !event) return apiError('NODE_NOT_FOUND', '사건을 찾을 수 없습니다.', 404);
    const figures = found.filter((f) => !!f);
    const ineligible = figures.filter((f) => !f.eligible).map((f) => f.name);
    if (ineligible.length)
      return apiError('MEME_INELIGIBLE', `게시된 근대 이전 인물만 쓸 수 있습니다: ${ineligible.join(', ')}`, 422);

    const relation = figures.length === 2 ? await loadRelation(figures[0].id, figures[1].id) : null;

    try {
      const { content, fact, title } =
        input.mode === 'story'
          ? await generateStory({ figures, relation, event })
          : await generateCaptions({ format: input.format, figures, relation, event });
      const meme = await insertMeme({
        kind: input.mode === 'story' ? 'story' : 'template',
        format: input.mode === 'story' ? 'story' : input.format,
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
    return apiError('NO_CANDIDATES', '아직 밈으로 만들지 않은 근대 이전 인물 관계(RIVAL/ALLY/FAMILY)가 남아 있지 않습니다.', 422);

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
