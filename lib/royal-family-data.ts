// Royal Family tree loader (server only): portraits and names for people with a person record.
// Shares the 'age-flow' tag, so revalidateAgeFlow() refreshes it.

import { supabaseAdmin } from '@/lib/supabase-admin';
import { sharedCache, orThrow } from '@/lib/shared-cache';
import { ROYAL_FAMILY } from '@/lib/joseon-royal-family';

export interface RoyalRecord {
  slug: string;
  name_en: string | null;
  thumbnail: string | null;
  birth_year: number | null;
  death_year: number | null;
}

async function loadRoyalRecords(): Promise<RoyalRecord[]> {
  const slugs = ROYAL_FAMILY.flatMap((p) => (p.slug ? [p.slug] : []));
  return orThrow(
    '[royal-family] persons',
    await supabaseAdmin
      .from('persons')
      .select('slug, name_en, thumbnail, birth_year, death_year')
      .eq('is_deleted', false)
      .eq('is_published', true)
      .in('slug', slugs)
  ) as RoyalRecord[];
}

export const getRoyalRecords = sharedCache(
  'royal-family',
  loadRoyalRecords,
  { revalidate: 300, tags: ['age-flow'] },
  // The family itself is static, so the tree still renders without portraits
  () => []
);
