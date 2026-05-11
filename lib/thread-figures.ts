export interface ThreadFigure {
  id: string;
  slug: string;
  name_en: string | null;
  name_ko?: string | null;
  thumbnail?: string | null;
  is_primary: boolean;
}

interface PersonRecord {
  id?: string | null;
  slug?: string | null;
  name_en?: string | null;
  name_ko?: string | null;
  thumbnail?: string | null;
}

interface ThreadPersonRecord {
  person_id?: string | null;
  persons?: PersonRecord | PersonRecord[] | null;
  is_primary?: boolean | null;
  sort_order?: number | null;
}

export interface ThreadWithFigureRelations {
  person_id?: string | null;
  persons?: PersonRecord | PersonRecord[] | null;
  thread_persons?: ThreadPersonRecord[] | null;
  [key: string]: unknown;
}

function firstPerson(value: PersonRecord | PersonRecord[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export function uniqueFigureIds(ids: string[]): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function normalizeThreadFigures<T extends ThreadWithFigureRelations>(
  thread: T
): T & { figures: ThreadFigure[] } {
  const figures: ThreadFigure[] = [];
  const seen = new Set<string>();

  const primary = firstPerson(thread.persons);
  const primaryId = thread.person_id ?? primary?.id ?? null;

  if (primaryId && primary) {
    figures.push({
      id: primaryId,
      slug: primary.slug ?? '',
      name_en: primary.name_en ?? null,
      name_ko: primary.name_ko ?? null,
      thumbnail: primary.thumbnail ?? null,
      is_primary: true,
    });
    seen.add(primaryId);
  }

  const relatedLinks = [...(thread.thread_persons ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  for (const link of relatedLinks) {
    const person = firstPerson(link.persons);
    const id = link.person_id ?? person?.id ?? null;
    if (!id || !person || seen.has(id)) continue;

    figures.push({
      id,
      slug: person.slug ?? '',
      name_en: person.name_en ?? null,
      name_ko: person.name_ko ?? null,
      thumbnail: person.thumbnail ?? null,
      is_primary: false,
    });
    seen.add(id);
  }

  return { ...thread, figures };
}

export function normalizeThreadList<T extends ThreadWithFigureRelations>(
  threads: T[] | null | undefined
): Array<T & { figures: ThreadFigure[] }> {
  return (threads ?? []).map(normalizeThreadFigures);
}
