import { supabaseAdmin } from '@/lib/supabase-admin';
import { sharedCache } from '@/lib/shared-cache';
import type { DirectoryPerson } from '@/lib/person-directory';

const PAGE_SIZE = 1000;
/** Same ceiling as the age-flow loader — past this the directory needs real pagination */
const PERSON_LIMIT = 2000;

type Row = Omit<DirectoryPerson, 'eras' | 'fields'> & {
  person_tags: { tags: { name_en: string | null; type: string } | null }[] | null;
};

async function loadPersonDirectory(): Promise<DirectoryPerson[]> {
  const rows: Row[] = [];
  for (let from = 0; from < PERSON_LIMIT; from += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from('persons')
      .select(
        'id, slug, name_en, name_ko, name_hanja, birth_year, death_year, thumbnail, updated_at, person_tags ( tags ( name_en, type ) )'
      )
      .eq('is_deleted', false)
      .eq('is_published', true)
      .order('id')
      .range(from, from + PAGE_SIZE - 1);
    // throw → not cached, sharedCache serves the last good list
    if (error) throw new Error(`[person-directory] fetch failed: ${error.message}`);
    rows.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  if (rows.length >= PERSON_LIMIT) {
    console.warn(`[person-directory] person limit (${PERSON_LIMIT}) reached — later figures are cut off`);
  }

  return rows.map(({ person_tags, ...person }) => {
    const tags = (person_tags ?? []).map((pt) => pt.tags).filter((t): t is NonNullable<typeof t> => !!t?.name_en);
    return {
      ...person,
      eras: tags.filter((t) => t.type === 'ERA').map((t) => t.name_en as string),
      fields: tags.filter((t) => t.type === 'FIELD').map((t) => t.name_en as string),
    };
  });
}

/** Every published figure with its era/field tags (shared across requests, 10 min) */
export const getPersonDirectory = sharedCache(
  'person-directory',
  loadPersonDirectory,
  { revalidate: 600, tags: ['person-directory'] },
  () => []
);
