import { apiError, apiSuccess } from '@/lib/api-helpers';
import { getAgeFlowData } from '@/lib/age-flow-data';

// ─── GET /api/persons/age-flow — Client fallback when SSR data is missing ───
// Returns the same transformed data the page SSR uses (lib/age-flow-data.ts).

// Never prerender at build time — data caching is handled by unstable_cache.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = apiSuccess(await getAgeFlowData());
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res;
  } catch (err) {
    console.error(err);
    return apiError('SERVER_ERROR', 'Failed to load age-flow data', 500);
  }
}
