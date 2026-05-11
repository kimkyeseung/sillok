import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';

const RankingQuerySchema = z.object({
  tag: z.string().optional(),
  cursor: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(100),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = RankingQuerySchema.safeParse({
    tag: searchParams.get('tag') || undefined,
    cursor: searchParams.get('cursor') || 0,
    limit: searchParams.get('limit') || 100,
  });

  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);
  }

  const { tag, cursor, limit } = parsed.data;
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const GRAVITY = 1.5; // decay exponent — higher = faster decay

  // 1) 태그 필터가 있으면 해당 태그의 person_id 목록 조회
  let personIds: string[] | null = null;

  if (tag) {
    const { data: tagRow } = await supabaseAdmin
      .from('tags')
      .select('id')
      .eq('name_ko', tag)
      .eq('type', 'ERA')
      .single();

    if (!tagRow) {
      return apiSuccess({ persons: [], has_next: false });
    }

    const { data: ptRows } = await supabaseAdmin
      .from('person_tags')
      .select('person_id')
      .eq('tag_id', tagRow.id);

    personIds = (ptRows ?? []).map((r) => r.person_id);
    if (personIds.length === 0) {
      return apiSuccess({ persons: [], has_next: false });
    }
  }

  // 2) 최근 30일 스레드 조회 (gravity decay에서 자연 감소하므로 넉넉히)
  let threadsQuery = supabaseAdmin
    .from('threads')
    .select('id, person_id, reply_count, like_count, created_at')
    .eq('is_deleted', false)
    .gte('created_at', thirtyDaysAgo);

  if (personIds) {
    threadsQuery = threadsQuery.in('person_id', personIds);
  }

  const { data: threads } = await threadsQuery;

  // 3) Gravity decay scoring
  // Formula per thread: (1 + reply_count * 0.5 + like_count) / (age_days + 2) ^ GRAVITY
  // - Newer threads score much higher than older ones
  // - No hard cutoff; old threads naturally approach 0
  // - like_count on thread is cumulative, which is fine for decay
  const scoreMap = new Map<
    string,
    { score: number; threadCount: number; hotCount: number; likeCount: number; latestAt: string }
  >();

  for (const thread of threads ?? []) {
    const pid = thread.person_id;
    if (!scoreMap.has(pid)) {
      scoreMap.set(pid, {
        score: 0,
        threadCount: 0,
        hotCount: 0,
        likeCount: 0,
        latestAt: '',
      });
    }
    const entry = scoreMap.get(pid)!;

    const ageDays = (now - new Date(thread.created_at).getTime()) / (24 * 60 * 60 * 1000);
    const replyCount = thread.reply_count ?? 0;
    const likeCount = thread.like_count ?? 0;
    const points = 1 + replyCount * 0.5 + likeCount;
    const decay = Math.pow(ageDays + 2, GRAVITY);
    const threadScore = points / decay;

    entry.score += threadScore;
    entry.threadCount += 1;
    if (replyCount >= 10) entry.hotCount += 1;
    entry.likeCount += likeCount;
    if (thread.created_at > entry.latestAt) entry.latestAt = thread.created_at;
  }

  // Filter out near-zero scores, sort descending
  const ranked = Array.from(scoreMap.entries())
    .filter(([, v]) => v.score > 0.01)
    .sort((a, b) => b[1].score - a[1].score);

  const hasNext = ranked.length > cursor + limit;
  const page = ranked.slice(cursor, cursor + limit);
  const rankedPersonIds = page.map(([pid]) => pid);

  if (rankedPersonIds.length === 0) {
    return apiSuccess({ persons: [], has_next: false });
  }

  // 5) 인물 정보 + 태그 조회
  const { data: persons } = await supabaseAdmin
    .from('persons')
    .select(
      'id, slug, name_ko, name_en, name_hanja, birth_year, death_year, thumbnail, summary, person_tags ( tags ( name_en, name_ko, type ) )'
    )
    .in('id', rankedPersonIds)
    .eq('is_deleted', false)
    .eq('is_published', true);

  // 랭킹 순서대로 정렬 + 점수 정보 병합
  const personMap = new Map((persons ?? []).map((p) => [p.id, p]));
  const result = page
    .map(([pid, stats], idx) => {
      const person = personMap.get(pid);
      if (!person) return null;
      const { person_tags, ...personData } = person as typeof person & {
        person_tags: { tags: { name_en: string | null; name_ko: string; type: string } | null }[];
      };
      const tags = (person_tags ?? [])
        .map((pt) => (pt.tags as unknown as { name_en: string | null; name_ko: string; type: string } | null)?.name_en || (pt.tags as unknown as { name_en: string | null; name_ko: string } | null)?.name_ko)
        .filter(Boolean) as string[];
      return {
        rank: cursor + idx + 1,
        ...personData,
        tags,
        thread_count: stats.threadCount,
        hot_thread_count: stats.hotCount,
        like_count: stats.likeCount,
      };
    })
    .filter(Boolean);

  return apiSuccess({ persons: result, has_next: hasNext });
}
