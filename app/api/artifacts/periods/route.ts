import { apiError, apiSuccess } from '@/lib/api-helpers';
import { countByPeriod } from '@/lib/artifacts';
import { ArtifactFilterSchema, artifactQuery } from '@/lib/artifacts-query';

// ─── GET /api/artifacts/periods — Artifact count per period for the current filters (public) ───
// The period filter itself is ignored so every bar stays clickable.

const PAGE = 1000; // PostgREST max rows per request

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = ArtifactFilterSchema.safeParse(
    Object.fromEntries(searchParams)
  );
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  // Only one short column per row (~3k rows) — no GROUP BY in the query builder
  const periods: Array<string | null> = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await artifactQuery(
      'period:metadata->>created_period',
      parsed.data,
      {
        ignorePeriod: true,
      }
    )
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error)
      return apiError(
        'SERVER_ERROR',
        'An error occurred while processing.',
        500
      );
    const rows = (data ?? []) as unknown as { period: string | null }[];
    periods.push(...rows.map((r) => r.period));
    if (rows.length < PAGE) break;
  }

  return apiSuccess({ periods: countByPeriod(periods), total: periods.length });
}
