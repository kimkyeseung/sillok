/**
 * Person detail page — server-side data loaders
 * Wrapped in React cache() so the layout, tab pages and generateMetadata
 * share one query per request.
 */
import { cache } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { buildFamilyTree, type FamilyRelation } from '@/lib/family-tree';
import {
  buildLifeEvents,
  buildRelationGraph,
  findContemporaries,
  type PersonTabCounts,
} from '@/lib/person-sections';
import type { FamilyTreePerson } from '@/components/person/FamilyTree';

export interface PersonSummary {
  id: string;
  slug: string;
  name_en: string;
  name_ko: string;
  thumbnail: string | null;
  birth_year: number | null;
  death_year: number | null;
  is_alive?: boolean | null;
}

const SUMMARY_FIELDS = 'id, slug, name_en, name_ko, thumbnail, birth_year, death_year, is_alive';

// ─── Person ───

export interface PersonTag {
  id: string;
  name_ko: string;
  name_en: string;
  type: string;
}

export interface PersonDetail extends PersonSummary {
  name_hanja: string | null;
  summary: string | null;
  birth_place: string | null;
  view_count: number | null;
  follow_count: number | null;
  is_controversial: boolean | null;
  is_published: boolean;
  tags: PersonTag[];
}

export const getPersonBySlug = cache(async (slug: string): Promise<PersonDetail | null> => {
  const { data } = await supabaseAdmin
    .from('persons')
    .select('*, person_tags ( tags ( id, name_ko, name_en, type ) )')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .single();
  if (!data) return null;
  const { person_tags, ...person } = data;
  const tags = ((person_tags ?? []) as { tags: PersonTag | null }[])
    .map((pt) => pt.tags)
    .filter((t): t is PersonTag => !!t);
  return { ...person, tags };
});

// ─── Relations (all types, both directions) ───

const RELATION_LABELS: Record<string, [asFrom: string, asTo: string]> = {
  // [label for the other person when self is from, when self is to]
  TEACHER: ['Student', 'Teacher'],
  LORD_VASSAL: ['Vassal', 'Lord'],
  INFLUENCE: ['Influenced', 'Influenced by'],
  MEMBER_OF: ['Group', 'Member'],
  FOUNDED: ['Organization', 'Founder'],
};

const BIDIRECTIONAL_LABELS: Record<string, string> = {
  FAMILY: 'Family',
  ALLY: 'Ally',
  RIVAL: 'Rival',
  AFFILIATED: 'Affiliated',
};

export interface PersonRelation {
  id: string;
  type: string;
  /** How the other person relates to self, e.g. "Parent", "Teacher", "Rival" */
  label: string;
  description: string | null;
  other: PersonSummary;
}

function relationLabel(
  r: { relation_type: string; family_role: string | null; from_person_id: string },
  selfId: string
) {
  const selfIsFrom = r.from_person_id === selfId;
  if (r.relation_type === 'FAMILY') {
    if (r.family_role === 'PARENT') return selfIsFrom ? 'Child' : 'Parent';
    if (r.family_role === 'SPOUSE') return 'Spouse';
    if (r.family_role === 'SIBLING') return 'Sibling';
  }
  const directed = RELATION_LABELS[r.relation_type];
  if (directed) return selfIsFrom ? directed[0] : directed[1];
  return BIDIRECTIONAL_LABELS[r.relation_type] ?? r.relation_type;
}

export const getPersonRelations = cache(async (personId: string): Promise<PersonRelation[]> => {
  const { data: rows } = await supabaseAdmin
    .from('person_relations')
    .select('id, from_person_id, to_person_id, relation_type, family_role, description')
    .eq('is_approved', true)
    .or(`from_person_id.eq.${personId},to_person_id.eq.${personId}`);
  if (!rows?.length) return [];

  const otherId = (r: (typeof rows)[number]) =>
    r.from_person_id === personId ? r.to_person_id : r.from_person_id;
  const { data: people } = await supabaseAdmin
    .from('persons')
    .select(SUMMARY_FIELDS)
    .in('id', Array.from(new Set(rows.map(otherId))))
    .eq('is_deleted', false)
    .eq('is_published', true);
  const byId = new Map((people ?? []).map((p) => [p.id, p as PersonSummary]));

  // Same pair + type stored in both directions → keep one
  const seen = new Set<string>();
  return rows
    .filter((r) => {
      const key = `${otherId(r)}:${r.relation_type}`;
      if (!byId.has(otherId(r)) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((r) => ({
      id: r.id,
      type: r.relation_type,
      label: relationLabel(r, personId),
      description: r.description,
      other: byId.get(otherId(r))!,
    }))
    .sort((a, b) => a.type.localeCompare(b.type) || (a.other.birth_year ?? 0) - (b.other.birth_year ?? 0));
});

// ─── Relation graph (2 hops) ───

export const getRelationGraph = cache(async (personId: string) => {
  const direct = await getPersonRelations(personId);
  if (!direct.length) return null;
  const ring1 = direct.map((r) => r.other.id);

  const { data: second } = await supabaseAdmin
    .from('person_relations')
    .select('from_person_id, to_person_id, relation_type')
    .eq('is_approved', true)
    .or(`from_person_id.in.(${ring1.join(',')}),to_person_id.in.(${ring1.join(',')})`)
    .limit(300);

  const relations = [
    ...direct.map((r) => ({ from: personId, to: r.other.id, type: r.type })),
    ...(second ?? []).map((r) => ({ from: r.from_person_id, to: r.to_person_id, type: r.relation_type })),
  ];

  const ids = Array.from(new Set(relations.flatMap((r) => [r.from, r.to])));
  const { data: people } = await supabaseAdmin
    .from('persons')
    .select(SUMMARY_FIELDS)
    .in('id', ids)
    .eq('is_deleted', false)
    .eq('is_published', true);
  const persons: Record<string, PersonSummary> = Object.fromEntries(
    (people ?? []).map((p) => [p.id, p as PersonSummary])
  );
  const visible = relations.filter((r) => persons[r.from] && persons[r.to]);
  const graph = buildRelationGraph(personId, visible);
  return graph.nodes.length > 1 ? { graph, persons } : null;
});

// ─── Family tree ───

export const getFamilyTree = cache(async (personId: string) => {
  const base = () =>
    supabaseAdmin
      .from('person_relations')
      .select('from_person_id, to_person_id, family_role')
      .eq('relation_type', 'FAMILY')
      .eq('is_approved', true)
      .not('family_role', 'is', null);

  // 1st hop: parents, spouses, siblings, children
  const { data: direct, error } = await base().or(
    `from_person_id.eq.${personId},to_person_id.eq.${personId}`
  );
  if (error || !direct?.length) return null;

  const parentIds = direct
    .filter((r) => r.family_role === 'PARENT' && r.to_person_id === personId)
    .map((r) => r.from_person_id);
  const childIds = direct
    .filter((r) => r.family_role === 'PARENT' && r.from_person_id === personId)
    .map((r) => r.to_person_id);

  // 2nd hop: grandparents, siblings via parents, grandchildren
  const hop2: string[] = [];
  if (parentIds.length) hop2.push(`to_person_id.in.(${parentIds.join(',')})`);
  if (parentIds.length || childIds.length)
    hop2.push(`from_person_id.in.(${[...parentIds, ...childIds].join(',')})`);
  const { data: second } = hop2.length
    ? await base().eq('family_role', 'PARENT').or(hop2.join(','))
    : { data: [] };

  const relations = [...direct, ...(second ?? [])] as FamilyRelation[];
  const ids = Array.from(new Set([personId, ...relations.flatMap((r) => [r.from_person_id, r.to_person_id])]));
  const { data: people } = await supabaseAdmin
    .from('persons')
    .select('id, slug, name_en, thumbnail, birth_year, death_year')
    .in('id', ids)
    .eq('is_deleted', false);

  const persons: Record<string, FamilyTreePerson> = Object.fromEntries(
    (people ?? []).map((p) => [p.id, p])
  );
  // Drop relations to deleted people before layout
  const visible = relations.filter((r) => persons[r.from_person_id] && persons[r.to_person_id]);
  const tree = buildFamilyTree(personId, visible, {
    birthYears: Object.fromEntries(Object.values(persons).map((p) => [p.id, p.birth_year])),
  });
  return tree.nodes.length > 1 ? { tree, persons } : null;
});

// ─── Linked nodes (artifacts, events, media, groups) ───

export interface LinkedNode {
  id: string;
  slug: string;
  node_type: string;
  title: string;
  thumbnail: string | null;
  year: number | null;
  link_type: string | null;
}

export const getLinkedNodes = cache(async (personId: string): Promise<LinkedNode[]> => {
  const { data } = await supabaseAdmin
    .from('person_node_links')
    .select('link_type, nodes!inner ( id, slug, node_type, title, thumbnail, metadata, is_deleted, is_published )')
    .eq('person_id', personId)
    .eq('nodes.is_deleted', false);

  return ((data ?? []) as unknown as {
    link_type: string | null;
    nodes: { id: string; slug: string; node_type: string; title: string; thumbnail: string | null; metadata: Record<string, unknown> | null; is_published: boolean };
  }[])
    .filter((l) => l.nodes.is_published !== false)
    .map(({ link_type, nodes: n }) => {
      const m = n.metadata ?? {};
      const year = [m.start_year, m.created_year, m.release_year, m.year].find(
        (v) => typeof v === 'number'
      ) as number | undefined;
      return { id: n.id, slug: n.slug, node_type: n.node_type, title: n.title, thumbnail: n.thumbnail, year: year ?? null, link_type };
    })
    .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
});

// ─── Threads (primary person or referenced) ───

export interface PersonThread {
  id: string;
  title: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  author: string | null;
  image: string | null;
}

export const getPersonThreads = cache(async (personId: string, limit = 50): Promise<PersonThread[]> => {
  const { data: refs } = await supabaseAdmin
    .from('thread_persons')
    .select('thread_id')
    .eq('person_id', personId);
  const refIds = (refs ?? []).map((r) => r.thread_id);

  const { data } = await supabaseAdmin
    .from('threads')
    .select(
      `id, title, like_count, reply_count, created_at,
       profiles!threads_author_id_fkey ( nickname ),
       thread_images ( url, sort_order )`
    )
    .eq('is_deleted', false)
    .or(`person_id.eq.${personId}${refIds.length ? `,id.in.(${refIds.join(',')})` : ''}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as {
    id: string;
    title: string;
    like_count: number;
    reply_count: number;
    created_at: string;
    profiles: { nickname: string | null } | null;
    thread_images: { url: string; sort_order: number }[] | null;
  }[]).map((t) => ({
    id: t.id,
    title: t.title,
    like_count: t.like_count,
    reply_count: t.reply_count,
    created_at: t.created_at,
    author: t.profiles?.nickname ?? null,
    image: [...(t.thread_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
  }));
});

// ─── Gallery (portrait + linked nodes + thread images) ───

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  href?: string;
}

export const getGallery = cache(async (person: PersonDetail): Promise<GalleryImage[]> => {
  const [nodes, threads] = await Promise.all([
    getLinkedNodes(person.id),
    getPersonThreads(person.id),
  ]);
  const threadIds = threads.map((t) => t.id);
  const { data: threadImages } = threadIds.length
    ? await supabaseAdmin
        .from('thread_images')
        .select('id, url, thread_id, sort_order')
        .in('thread_id', threadIds)
        .order('sort_order')
    : { data: [] };
  const threadTitle = new Map(threads.map((t) => [t.id, t.title]));

  const images: GalleryImage[] = [
    ...(person.thumbnail ? [{ id: 'portrait', url: person.thumbnail, caption: person.name_en }] : []),
    ...nodes
      .filter((n) => n.thumbnail)
      .map((n) => ({ id: `node-${n.id}`, url: n.thumbnail!, caption: n.title, href: `/nodes/${n.slug}` })),
    ...(threadImages ?? []).map((i) => ({
      id: `thread-${i.id}`,
      url: i.url,
      caption: threadTitle.get(i.thread_id) ?? '',
      href: `/threads/${i.thread_id}`,
    })),
  ];
  // Same image reused across sources → keep first
  const seen = new Set<string>();
  return images.filter((i) => (seen.has(i.url) ? false : (seen.add(i.url), true)));
});

// ─── Contemporaries ───

const getLifespanIndex = cache(async () => {
  const { data } = await supabaseAdmin
    .from('persons')
    .select(SUMMARY_FIELDS)
    .eq('is_deleted', false)
    .eq('is_published', true)
    .not('birth_year', 'is', null);
  return (data ?? []) as PersonSummary[];
});

export const getContemporaries = cache(async (person: PersonDetail, limit = 12) => {
  if (person.birth_year == null) return [];
  const [all, relations, family] = await Promise.all([
    getLifespanIndex(),
    getPersonRelations(person.id),
    getFamilyTree(person.id),
  ]);
  // People already shown in Relations or the family tree
  return findContemporaries(person, all, {
    limit,
    excludeIds: [
      ...relations.map((r) => r.other.id),
      ...(family?.tree.nodes.map((n) => n.id) ?? []),
    ],
  });
});

// ─── Life timeline ───

export const getTimelineEntries = cache(async (personId: string) => {
  const { data } = await supabaseAdmin
    .from('person_timeline')
    .select('id, year, title, description')
    .eq('person_id', personId)
    .order('year', { ascending: true });
  return data ?? [];
});

export const getLifeEvents = cache(async (person: PersonDetail) => {
  const [personal, relations, nodes] = await Promise.all([
    getTimelineEntries(person.id),
    getPersonRelations(person.id),
    getLinkedNodes(person.id),
  ]);
  return buildLifeEvents(
    person,
    personal,
    relations.map((r) => ({ ...r.other, label: r.label })),
    nodes
      .filter((n) => n.node_type === 'EVENT' || n.node_type === 'ARTIFACT')
      .map((n) => ({ slug: n.slug, title: n.node_type === 'ARTIFACT' ? `${n.title} is created` : n.title, year: n.year }))
  );
});

// ─── Tab counts ───

export const getTabCounts = cache(async (person: PersonDetail): Promise<PersonTabCounts> => {
  const [timeline, relations, nodes, gallery, threads] = await Promise.all([
    getTimelineEntries(person.id),
    getPersonRelations(person.id),
    getLinkedNodes(person.id),
    getGallery(person),
    getPersonThreads(person.id),
  ]);
  return {
    timeline: timeline.length,
    relations: relations.length,
    related: nodes.length,
    gallery: gallery.length,
    threads: threads.length,
  };
});

// ─── Stats ───

export const getPersonStats = cache(async (person: PersonDetail) => {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [views30, votes, collections, counts, contemporaries] = await Promise.all([
    supabaseAdmin
      .from('view_logs')
      .select('id', { count: 'exact', head: true })
      .eq('target_type', 'PERSON')
      .eq('target_id', person.id)
      .gte('viewed_at', since30),
    supabaseAdmin.from('person_of_day_votes').select('vote_date').eq('person_id', person.id),
    supabaseAdmin
      .from('collection_items')
      .select('id', { count: 'exact', head: true })
      .eq('person_id', person.id),
    getTabCounts(person),
    getContemporaries(person, 1000),
  ]);

  const voteDays = new Set((votes.data ?? []).map((v) => v.vote_date));
  return {
    views: person.view_count ?? 0,
    views30: views30.count ?? 0,
    followers: person.follow_count ?? 0,
    votes: votes.data?.length ?? 0,
    voteDays: voteDays.size,
    collections: collections.count ?? 0,
    contemporaries: contemporaries.length,
    ...counts,
  };
});
