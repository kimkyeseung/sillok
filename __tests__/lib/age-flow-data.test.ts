import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: {} }));
vi.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

import { toAgeFlowArtifacts } from '@/lib/age-flow-data';

describe('toAgeFlowArtifacts', () => {
  it('rebuilds metadata from the selected meta_* columns and drops nulls', () => {
    const [a] = toAgeFlowArtifacts([
      {
        id: '1',
        slug: 'hunminjeongeum',
        title: 'Hunminjeongeum',
        thumbnail: null,
        meta_designation: 'National Treasure',
        meta_designation_ko: null,
        meta_created_year: 1446,
        meta_category: 'book',
      },
    ]);
    expect(a).toEqual({
      id: '1',
      slug: 'hunminjeongeum',
      title: 'Hunminjeongeum',
      thumbnail: null,
      metadata: { designation: 'National Treasure', created_year: 1446, category: 'book' },
    });
  });
});
