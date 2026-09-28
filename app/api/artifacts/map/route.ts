import { apiError, apiSuccess } from '@/lib/api-helpers';
import { ArtifactFilterSchema, artifactQuery } from '@/lib/artifacts-query';

// ─── GET /api/artifacts/map — Located artifacts as GeoJSON points (public) ───
// Same filters as the list. Designation sets are NOT collapsed: members can sit in
// different places (e.g. the Joseon Sillok archive editions).

const PAGE = 1000; // PostgREST max rows per request

interface Row {
  slug: string;
  title: string;
  thumbnail: string | null;
  lat: number | null;
  lng: number | null;
  kind: string | null;
  period: string | null;
  designation: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = ArtifactFilterSchema.safeParse(
    Object.fromEntries(searchParams)
  );
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await artifactQuery(
      `slug, title, thumbnail, lat:metadata->latitude, lng:metadata->longitude,
       kind:metadata->>heritage_kind, period:metadata->>created_period, designation:metadata->>designation`,
      parsed.data,
      { expandGroups: true }
    )
      .not('metadata->latitude', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error)
      return apiError(
        'SERVER_ERROR',
        'An error occurred while processing.',
        500
      );
    const page = (data ?? []) as unknown as Row[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }

  return apiSuccess({
    type: 'FeatureCollection',
    features: rows
      .filter((r) => typeof r.lat === 'number' && typeof r.lng === 'number')
      .map(({ lat, lng, ...props }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: props,
      })),
  });
}
