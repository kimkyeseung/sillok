import { apiError, apiSuccess } from '@/lib/api-helpers';
import { countFacets, type FacetRow } from '@/lib/artifacts';
import { ArtifactFilterSchema, artifactQuery } from '@/lib/artifacts-query';

// ─── GET /api/artifacts/facets — Period, collection and century counts for the current filters (public) ───
// Each facet ignores its own selection so every option stays clickable (see countFacets).

const PAGE = 1000; // PostgREST max rows per request

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = ArtifactFilterSchema.safeParse(
    Object.fromEntries(searchParams)
  );
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  // Three short columns per row (~3k rows) — no GROUP BY in the query builder
  const rows: FacetRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await artifactQuery(
      'period:metadata->>created_period, collection:metadata->>collection, year:metadata->created_year',
      parsed.data,
      { ignoreFacets: true }
    )
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error)
      return apiError(
        'SERVER_ERROR',
        'An error occurred while processing.',
        500
      );
    const page = (data ?? []) as unknown as FacetRow[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }

  const { period, collection } = parsed.data;
  return apiSuccess(countFacets(rows, { period, collection }));
}
