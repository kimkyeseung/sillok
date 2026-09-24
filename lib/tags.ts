/**
 * Display labels for tags.
 * tags.name_en is stored as a slug (e.g. 'king', 'three-kingdoms').
 * Labels double as PersonAvatar FIELD style keys (e.g. 'Royalty').
 */
const TAG_LABELS: Record<string, string> = {
  // ERA
  ancient: 'Ancient',
  'three-kingdoms': 'Three Kingdoms',
  'unified-silla': 'Unified Silla',
  goryeo: 'Goryeo',
  joseon: 'Joseon',
  modern: 'Modern',
  // FIELD
  king: 'Royalty',
  general: 'General',
  artist: 'Artist',
  'independence-activist': 'Independence Activist',
  scholar: 'Scholar',
  politician: 'Politician',
  entertainer: 'Culture & Entertainment',
  entrepreneur: 'Entrepreneur',
  religious: 'Religious Leader',
};

/**
 * Convert a tag's name_en to a display label.
 * Unknown slugs are title-cased ('new-tag' → 'New Tag');
 * values that already look like labels are returned unchanged.
 */
export function tagLabel(nameEn: string | null | undefined): string {
  if (!nameEn) return '';
  const known = TAG_LABELS[nameEn.toLowerCase()];
  if (known) return known;
  if (/[A-Z ]/.test(nameEn)) return nameEn;
  return nameEn
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Article tags are stored in Korean (DB values) — the UI shows English only */
const ARTICLE_TAG_LABELS: Record<string, string> = {
  기획: 'Feature',
  특집: 'Special',
  인물탐구: 'Spotlight',
  현대: 'Modern',
  공지: 'Announcement',
  안내: 'Guide',
};

/**
 * English label for an article tag, or null when there is nothing to show:
 * unknown tags (never leak Korean) and 공지 on notices (the Notice badge already says it).
 */
export function articleTagLabel(tag: string | null | undefined, isNotice = false): string | null {
  if (!tag) return null;
  if (isNotice && tag === '공지') return null;
  return ARTICLE_TAG_LABELS[tag] ?? null;
}
