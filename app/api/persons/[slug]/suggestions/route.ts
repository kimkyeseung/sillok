import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireActiveUser } from '@/lib/auth';
import { suggestionLimiter } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findPublishedPerson } from '@/lib/person-api';
import { SUGGESTION_KIND_VALUES } from '@/lib/community';

// ─── POST /api/persons/:slug/suggestions — Suggest a fact / correction for review [USER] ───

const SuggestionSchema = z.object({
  kind: z.enum(SUGGESTION_KIND_VALUES),
  content: z.string().trim().min(10, 'Please add a little more detail.').max(2000),
  source_url: z
    .string()
    .trim()
    .url()
    .refine((u) => /^https?:\/\//.test(u), 'Only http(s) URLs are allowed.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const { user, error: authError } = await requireActiveUser(request);
  if (authError) return authError;

  const { success } = await suggestionLimiter.check(user.id);
  if (!success) return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }
  const parsed = SuggestionSchema.safeParse(body);
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, parsed.error.issues);

  const person = await findPublishedPerson(params.slug);
  if (!person) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const { error } = await supabaseAdmin.from('person_suggestions').insert({
    person_id: person.id,
    user_id: user.id,
    kind: parsed.data.kind,
    content: parsed.data.content,
    source_url: parsed.data.source_url ?? null,
  });
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ submitted: true }, 201);
}
