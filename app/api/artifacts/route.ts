import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import {
  ARTIFACT_PAGE_SIZE,
  ARTIFACT_SORTS,
  cursorFilter,
  decodeArtifactCursor,
  encodeArtifactCursor,
  isDescending,
  sortColumn,
  sortValue,
} from '@/lib/artifacts';
import {
  ArtifactFilterSchema,
  artifactQuery,
  filterKeys,
} from '@/lib/artifacts-query';

// ─── GET /api/artifacts — Artifact list with filters (public) ───

const QuerySchema = ArtifactFilterSchema.extend({
  limit: z.coerce.number().min(1).max(60).default(ARTIFACT_PAGE_SIZE),
  cursor: z.string().max(200).optional(),
  sort: z.enum(filterKeys(ARTIFACT_SORTS)).default('featured'),
});

// Only the fields a card needs — metadata also holds the full Korean source text
const SELECT = `id, slug, node_type, title, description, thumbnail, view_count, follow_count,
  category:metadata->>category, period:metadata->>created_period, year:metadata->created_year,
  designation:metadata->>designation, rank:metadata->featured_rank, group_size:metadata->designation_group_size, kind:metadata->>heritage_kind, location:metadata->>location,
  person_node_links ( persons:person_id ( id, slug, name_ko, name_en, thumbnail ) )`;

interface Row {
  id: string;
  slug: string;
  node_type: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  view_count: number | null;
  follow_count: number | null;
  category: string | null;
  period: string | null;
  year: number | null;
  rank: number | null;
  group_size: number | null;
  designation: string | null;
  kind: string | null;
  location: string | null;
  person_node_links: unknown[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { limit, cursor: rawCursor, sort, ...filters } = parsed.data;
  const cursor = rawCursor ? decodeArtifactCursor(rawCursor) : null;
  if (rawCursor && !cursor)
    return apiError('VALIDATION_ERROR', 'Invalid cursor.', 422);

  // Total only on the first page — shown as "N artifacts" for the current filters
  let query = artifactQuery(
    SELECT,
    filters,
    cursor ? undefined : { count: 'exact' }
  );
  if (cursor) query = query.or(cursorFilter(sort, cursor));

  const { data, count, error } = await query
    .order(sortColumn(sort), {
      ascending: !isDescending(sort),
      nullsFirst: false,
    })
    .order('id', { ascending: true })
    .limit(limit + 1);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const rows = (data ?? []) as unknown as Row[];
  const hasNext = rows.length > limit;
  const page = hasNext ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return apiSuccess({
    items: page.map(
      ({
        category,
        period,
        year,
        rank: _,
        group_size,
        designation,
        kind,
        location,
        ...node
      }) => ({
        ...node,
        view_count: node.view_count ?? 0,
        follow_count: node.follow_count ?? 0,
        metadata: {
          category,
          created_period: period,
          created_year: year,
          designation,
          heritage_kind: kind,
          location,
          designation_group_size: group_size,
        },
      })
    ),
    total: count ?? null,
    has_next: hasNext,
    next_cursor:
      hasNext && last
        ? encodeArtifactCursor({ v: sortValue(sort, last), id: last.id })
        : null,
  });
}
