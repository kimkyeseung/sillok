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
