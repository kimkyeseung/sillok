import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { searchLimiter } from '@/lib/rate-limit';
import { getFeedPage } from '@/lib/feed-data';
import { BOARDS, FEED_SORTS, TOPICS, TOP_WINDOWS } from '@/lib/feed';

// ─── GET /api/feed — Thread feed (hot / new / top) with keyset cursor [PUBLIC] ───

const QuerySchema = z.object({
  sort: z.enum(FEED_SORTS).default('hot'),
  t: z.enum(TOP_WINDOWS).default('all'),
  board: z.enum(BOARDS.map((b) => b.slug) as [string, ...string[]]).optional(),
  topic: z.enum(TOPICS.map((t) => t.slug) as [string, ...string[]]).optional(),
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success } = await searchLimiter.check(`feed:${ip}`);
  if (!success) return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests.', 429);

  const page = await getFeedPage(parsed.data);
  return apiSuccess(page);
}
