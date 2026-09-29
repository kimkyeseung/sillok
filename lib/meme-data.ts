import { supabaseAdmin } from './supabase-admin';
import {
  formatForRelation,
  memeName,
  isMemeEligible,
  pickHat,
  type HatType,
  type TemplateFormat,
} from './meme';

// ─── Meme data loaders (server only) ───

export interface MemeFigureInfo {
  id: string;
  slug: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  summary: string | null;
  hat: HatType;
  eligible: boolean;
}

export interface MemeEventInfo {
  id: string;
  title: string;
  year: number | null;
  description: string | null;
}

const PERSON_COLUMNS =
  'id, slug, name_en, name_ko, birth_year, death_year, summary, is_alive, is_published, is_deleted, person_tags ( tags ( name_en, type ) )';

interface PersonRow {
  id: string;
  slug: string;
  name_en: string | null;
  name_ko: string;
  birth_year: number | null;
  death_year: number | null;
  summary: string | null;
  is_alive: boolean | null;
  is_published: boolean | null;
  is_deleted: boolean | null;
  person_tags: { tags: { name_en: string | null; type: string } | null }[] | null;
}

/** English display name — never fall back to Korean (UI is English-only) */
function displayName(p: Pick<PersonRow, 'name_en' | 'slug'>): string {
  if (p.name_en) return p.name_en;
  return p.slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function toFigure(p: PersonRow): MemeFigureInfo {
  const tags = (p.person_tags ?? []).map((pt) => pt.tags).filter((t): t is { name_en: string; type: string } => !!t?.name_en);
  const field = tags.filter((t) => t.type === 'FIELD').map((t) => t.name_en);
  const era = tags.filter((t) => t.type === 'ERA').map((t) => t.name_en);
  return {
    id: p.id,
    slug: p.slug,
    name: memeName(displayName(p)),
    birth_year: p.birth_year,
    death_year: p.death_year,
    summary: p.summary,
    hat: pickHat(field),
    eligible:
      p.is_published === true &&
      p.is_deleted !== true &&
      isMemeEligible({ birth_year: p.birth_year, is_alive: p.is_alive, eraTags: era }),
  };
}

/** Figures by id, returned in the given order (missing ids dropped) */
export async function loadFiguresByIds(ids: string[]): Promise<MemeFigureInfo[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabaseAdmin.from('persons').select(PERSON_COLUMNS).in('id', ids);
  if (error) throw new Error(`[meme] persons fetch failed: ${error.message}`);
  const byId = new Map((data as unknown as PersonRow[]).map((p) => [p.id, toFigure(p)]));
  return ids.map((id) => byId.get(id)).filter((f): f is MemeFigureInfo => !!f);
}

/** Figures by slug, returned in the given order (missing slugs → null) */
export async function loadFiguresBySlugs(slugs: string[]): Promise<(MemeFigureInfo | null)[]> {
  const { data, error } = await supabaseAdmin.from('persons').select(PERSON_COLUMNS).in('slug', slugs);
  if (error) throw new Error(`[meme] persons fetch failed: ${error.message}`);
  const bySlug = new Map((data as unknown as PersonRow[]).map((p) => [p.slug, toFigure(p)]));
  return slugs.map((s) => bySlug.get(s) ?? null);
}

/** Approved relation between two figures, either direction (relations are stored once) */
export async function loadRelation(aId: string, bId: string) {
  const { data } = await supabaseAdmin
    .from('person_relations')
    .select('relation_type, description')
    .eq('is_approved', true)
    .or(`and(from_person_id.eq.${aId},to_person_id.eq.${bId}),and(from_person_id.eq.${bId},to_person_id.eq.${aId})`)
    .limit(1)
    .maybeSingle();
  return data as { relation_type: string; description: string | null } | null;
}

export async function loadEventBySlug(slug: string): Promise<MemeEventInfo | null> {
  const { data } = await supabaseAdmin
    .from('nodes')
    .select('id, title, description, metadata')
    .eq('slug', slug)
    .eq('node_type', 'EVENT')
    .eq('is_deleted', false)
    .maybeSingle();
  if (!data) return null;
  const meta = (data.metadata ?? {}) as { start_year?: number | string };
  const year = meta.start_year !== undefined ? Number(meta.start_year) : NaN;
  return { id: data.id, title: data.title, description: data.description, year: Number.isFinite(year) ? year : null };
}

// ─── Auto-generation candidates ───

export interface MemeCandidate {
  format: TemplateFormat;
  figures: MemeFigureInfo[];
  relation: { relation_type: string; description: string | null };
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Random approved RIVAL/ALLY/FAMILY pairs between eligible (pre-modern, published)
 * figures that don't already have a meme together. Returns up to `limit` candidates.
 */
export async function pickAutoCandidates(limit: number): Promise<MemeCandidate[]> {
  const [relations, existing] = await Promise.all([
    supabaseAdmin
      .from('person_relations')
      .select('from_person_id, to_person_id, relation_type, description')
      .eq('is_approved', true)
      .in('relation_type', ['RIVAL', 'ALLY', 'FAMILY'])
      .limit(5000),
    supabaseAdmin.from('ai_drafts').select('person_ids').eq('kind', 'template').eq('is_deleted', false).limit(5000),
  ]);
  if (relations.error) throw new Error(`[meme] relations fetch failed: ${relations.error.message}`);

  const pairKey = (a: string, b: string) => [a, b].sort().join(':');
  const used = new Set(
    (existing.data ?? []).filter((m) => m.person_ids?.length === 2).map((m) => pairKey(m.person_ids[0], m.person_ids[1])),
  );

  const pool = shuffle(relations.data ?? []).filter((r) => !used.has(pairKey(r.from_person_id, r.to_person_id)));
  const out: MemeCandidate[] = [];
  // Check eligibility in small batches so a mostly-modern pool doesn't stop early
  for (let i = 0; i < pool.length && out.length < limit; i += 20) {
    const batch = pool.slice(i, i + 20);
    const ids = Array.from(new Set(batch.flatMap((r) => [r.from_person_id, r.to_person_id])));
    const figures = new Map((await loadFiguresByIds(ids)).map((f) => [f.id, f]));
    for (const r of batch) {
      const a = figures.get(r.from_person_id);
      const b = figures.get(r.to_person_id);
      const format = formatForRelation(r.relation_type);
      if (!a?.eligible || !b?.eligible || !format) continue;
      // Drake is a one-figure format: the second figure is only context
      out.push({ format, figures: [a, b], relation: { relation_type: r.relation_type, description: r.description } });
      if (out.length >= limit) break;
    }
  }
  return out;
}
