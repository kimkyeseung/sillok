/**
 * MEDIA node metadata (films, dramas, books…) — pure helpers shared by the node page, SEO and person pages.
 * Metadata keys vary by import batch: release_year | year | start_year, original_title_ko | title_ko.
 */

export type MediaKind = 'film' | 'drama';

export function mediaKind(m: Record<string, unknown>): string | null {
  const raw = String(m.media_type ?? m.category ?? m.genre ?? '').toLowerCase();
  if (/drama|series|tv/.test(raw)) return 'drama';
  if (/film|movie/.test(raw)) return 'film';
  return raw || null;
}

export interface MediaInfo {
  kind: MediaKind | null;
  year: number | null;
  titleKo: string | null;
  platform: string | null;
  episodes: number | null;
  director: string | null;
  cast: string[];
  genre: string | null;
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function getMediaInfo(metadata: Record<string, unknown> | null | undefined): MediaInfo {
  const m = metadata ?? {};
  const kind = mediaKind(m);
  return {
    kind: kind === 'film' || kind === 'drama' ? kind : null,
    year: num(m.release_year) ?? num(m.year) ?? num(m.start_year),
    titleKo: str(m.original_title_ko) ?? str(m.title_ko),
    platform: str(m.platform),
    episodes: num(m.episodes),
    director: str(m.director),
    cast: Array.isArray(m.cast) ? m.cast.filter((c): c is string => typeof c === 'string') : [],
    genre: str(m.genre),
  };
}

/** "The Red Sleeve (옷소매 붉은 끝동)" → "The Red Sleeve" (titles often embed the Korean title) */
export function stripKoreanTitle(title: string): string {
  return title.replace(/\s*\([^)]*[가-힣][^)]*\)\s*$/, '').trim() || title;
}

/** "2021 Korean drama" / "Korean film" — null for non-screen media */
export function mediaLabel(info: MediaInfo): string | null {
  if (!info.kind) return null;
  return [info.year, 'Korean', info.kind].filter(Boolean).join(' ');
}

/** Key facts shown on the node page (English UI labels) */
export function mediaFacts(info: MediaInfo): { label: string; value: string }[] {
  if (!info.kind) return [];
  const facts: { label: string; value: string }[] = [];
  if (info.year) facts.push({ label: info.kind === 'film' ? 'Released' : 'Aired', value: String(info.year) });
  facts.push({ label: 'Type', value: info.genre ?? (info.kind === 'film' ? 'Film' : 'TV drama') });
  if (info.platform) facts.push({ label: 'Network', value: info.platform });
  if (info.episodes) facts.push({ label: 'Episodes', value: String(info.episodes) });
  if (info.director) facts.push({ label: 'Director', value: info.director });
  if (info.cast.length) facts.push({ label: 'Starring', value: info.cast.join(', ') });
  return facts;
}
