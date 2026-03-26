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
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);
  }

  const { tag, cursor, limit } = parsed.data;
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // 1) 태그 필터가 있으면 해당 태그의 person_id 목록 조회
  let personIds: string[] | null = null;

  if (tag) {
    const { data: tagRow } = await supabaseAdmin
      .from('tags')
      .select('id')
      .eq('name', tag)
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

  // 2) 최근 7일 스레드 조회 (person_id, reply_count, like_count)
  let threadsQuery = supabaseAdmin
    .from('threads')
    .select('id, person_id, reply_count, like_count')
    .eq('is_deleted', false)
    .gte('created_at', sevenDaysAgo);

  if (personIds) {
    threadsQuery = threadsQuery.in('person_id', personIds);
  }

  const { data: threads } = await threadsQuery;

  // 3) 최근 7일 스레드 좋아요 추가 집계 (스레드 자체 like_count는 전체 기간이므로, 7일 내 좋아요만 별도 집계)
  // threads 테이블의 like_count는 누적값이라 7일 필터 불가 → likes 테이블에서 직접 집계
  const threadIds = (threads ?? []).map((t) => t.id);

  let recentLikesByThread: Record<string, number> = {};

  if (threadIds.length > 0) {
    const { data: likes } = await supabaseAdmin
      .from('likes')
      .select('target_id')
      .eq('target_type', 'thread')
      .in('target_id', threadIds)
      .gte('created_at', sevenDaysAgo);

    for (const like of likes ?? []) {
      recentLikesByThread[like.target_id] =
        (recentLikesByThread[like.target_id] || 0) + 1;
    }
  }

  // 4) 인물별 점수 계산
  const scoreMap = new Map<
    string,
    { score: number; threadCount: number; hotCount: number; likeCount: number }
  >();

  for (const thread of threads ?? []) {
    const pid = thread.person_id;
    if (!scoreMap.has(pid)) {
      scoreMap.set(pid, {
        score: 0,
        threadCount: 0,
        hotCount: 0,
        likeCount: 0,
      });
    }
    const entry = scoreMap.get(pid)!;

    const isHot = (thread.reply_count ?? 0) >= 10;
    const threadScore = isHot ? 10 : 3;
    const likeScore = recentLikesByThread[thread.id] || 0;

    entry.score += threadScore + likeScore;
    entry.threadCount += 1;
    if (isHot) entry.hotCount += 1;
    entry.likeCount += likeScore;
  }

  // 0점 인물 제외, 점수 내림차순 정렬
  const ranked = Array.from(scoreMap.entries())
    .filter(([, v]) => v.score > 0)
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
      'id, slug, name_ko, name_en, name_hanja, birth_year, death_year, thumbnail, summary, person_tags ( tags ( name, type ) )'
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
        person_tags: { tags: { name: string; type: string } | null }[];
      };
      const tags = (person_tags ?? [])
        .map((pt) => (pt.tags as unknown as { name: string; type: string } | null)?.name)
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
