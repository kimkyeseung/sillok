import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { dynastiesOf, monarchName } from '@/lib/monarchs';
import { sharedCache, orThrow } from '@/lib/shared-cache';

// ─── GET /api/reigns — Reign periods of published rulers (public) ───
// Artifact Timeline shows who was on the throne at the scrolled year. ~70 rows, rarely changes.

// Not prerendered at build: a slow DB would time the build out (static generation
// limit 60s). Data cache + CDN header keep it as cheap as the old hourly ISR.
export const dynamic = 'force-dynamic';

const getReigns = sharedCache(
  'reigns',
  async () =>
    orThrow(
      '[reigns]',
      await supabaseAdmin
        .from('reigns')
        .select(
          'reign_start, reign_end, persons:person_id ( slug, name_en, name_ko, thumbnail, is_published, is_deleted )'
        )
        .order('reign_start', { ascending: true })
    ) as unknown as Row[],
  { revalidate: 3600, tags: ['age-flow'] },
  () => null
);

interface Row {
  reign_start: number;
  reign_end: number;
  persons: {
    slug: string;
    name_en: string;
    name_ko: string;
    thumbnail: string | null;
    is_published: boolean;
    is_deleted: boolean;
  } | null;
}

export async function GET() {
  const data = await getReigns();
  if (!data)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const items = data
    .filter((r) => r.persons?.is_published && !r.persons.is_deleted)
    .map(({ reign_start, reign_end, persons: p }) => {
      // Rulers of several dynasties (Gojong) take the first — one king per dynasty per year
      const dynasty = dynastiesOf(p!.slug)[0]?.id ?? p!.slug;
      return {
        reign_start,
        reign_end,
        slug: p!.slug,
        name_en: p!.name_en,
        name_ko: p!.name_ko,
        short_en: monarchName(p!.slug, dynasty) ?? p!.name_en,
        thumbnail: p!.thumbnail,
        dynasty,
      };
    });
  const res = apiSuccess({ items });
  res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res;
}
