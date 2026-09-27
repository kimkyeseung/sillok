import { apiError, apiSuccess } from '@/lib/api-helpers';
import { getAgeFlowData } from '@/lib/age-flow-data';

// ─── GET /api/persons/age-flow — Client fallback when SSR data is missing ───
// Returns the same transformed data the page SSR uses (lib/age-flow-data.ts).

// Never prerender at build time — data caching is handled by unstable_cache.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // No CDN cache header: getAgeFlowData is already cached and revalidateAgeFlow()
    // clears it on admin edits — an edge cache would keep serving stale data.
    return apiSuccess(await getAgeFlowData());
  } catch (err) {
    console.error(err);
    return apiError('SERVER_ERROR', 'Failed to load age-flow data', 500);
  }
}
