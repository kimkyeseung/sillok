'use client';

import useSWR from 'swr';
import { tagLabel } from '@/lib/tags';
import type { AgeFlowPersonDetail, AgeFlowTag } from './useAgeFlow';

// Shared by hover panel (desktop), person sheet (mobile) and relation lines.
// SWR dedupes, so hover + sheet + lines for the same person hit the API once.

export interface AgeFlowRelation {
  relation_id: string;
  other_person_id: string;
  rel_type: string;
  direction: string;
  other_person: {
    id: string;
    slug: string;
    name_ko: string;
    name_en: string | null;
    thumbnail: string | null;
    birth_year: number | null;
    death_year: number | null;
  } | null;
}

const SWR_OPTIONS = { revalidateOnFocus: false, dedupingInterval: 5 * 60 * 1000 };

async function fetchData<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? 'Request failed');
  return json.data as T;
}

async function fetchPersonDetail(url: string): Promise<AgeFlowPersonDetail> {
  const raw = await fetchData<Record<string, any>>(url);
  const tags: AgeFlowTag[] = raw.person_tags
    ? (raw.person_tags as Array<{
        tags: { id: string; name_en: string; type: string } | null;
      }>)
        .filter((pt) => pt.tags)
        .map((pt) => ({
          id: pt.tags!.id,
          name_en: tagLabel(pt.tags!.name_en),
          type: pt.tags!.type as 'ERA' | 'FIELD',
        }))
    : [];

  return {
    id: raw.id,
    slug: raw.slug,
    name_en: raw.name_en,
    name_ko: raw.name_ko,
    birth_year: raw.birth_year,
    death_year: raw.death_year,
    is_alive: raw.is_alive,
    thumbnail: raw.thumbnail,
    thread_count: raw.thread_count ?? 0,
    relation_count: raw.relation_count ?? 0,
    view_count: raw.view_count ?? 0,
    follow_count: raw.follow_count ?? 0,
    tags,
  };
}

export function usePersonDetail(slug: string | null) {
  return useSWR(slug ? `/api/persons/${slug}` : null, fetchPersonDetail, SWR_OPTIONS);
}

export function usePersonRelations(slug: string | null) {
  return useSWR(
    slug ? `/api/persons/${slug}/relations` : null,
    fetchData<AgeFlowRelation[]>,
    SWR_OPTIONS
  );
}
