import { cache } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { buildRoster, type Dynasty, type RosterEntry, type RosterPerson } from '@/lib/monarchs';

const allSlugs = (dynasties: Dynasty[]) =>
  Array.from(new Set(dynasties.flatMap((d) => d.monarchs.map((x) => x.slug).filter((s): s is string => !!s))));

/** Every ruler of a dynasty with their page and reigns */
export const getDynastyRoster = cache(async (dynasty: Dynasty): Promise<RosterEntry[]> => {
  const { data: persons, error } = await supabaseAdmin
    .from('persons')
    .select('id, slug, name_en, name_hanja, thumbnail, summary, birth_year, death_year')
    .in('slug', allSlugs([dynasty]))
    .eq('is_deleted', false)
    .eq('is_published', true);
  if (error) throw new Error(`[monarchs] fetch failed: ${error.message}`);
  const people = (persons ?? []) as RosterPerson[];

  // Non-fatal: the list still renders (without reign years) if reigns is unavailable
  const { data: reigns, error: reignError } = people.length
    ? await supabaseAdmin
        .from('reigns')
        .select('person_id, reign_start, reign_end')
        .in('person_id', people.map((p) => p.id))
    : { data: [], error: null };
  if (reignError) console.error('[monarchs] reigns fetch failed:', reignError.message);

  return buildRoster(dynasty, people, reigns ?? []);
});
