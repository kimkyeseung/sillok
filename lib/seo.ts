/**
 * SEO helpers
 * - A page-level `openGraph` / `twitter` object replaces the root layout's,
 *   so pages must set images themselves — fall back to DEFAULT_OG_IMAGE.
 */

export const DEFAULT_OG_IMAGE = '/og-default.png';

/** Truncate text at a word boundary, appending an ellipsis when cut */
export function truncateText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  // The last word is complete when the next character is a space
  const lastSpace = clean[max - 1] === ' ' ? cut.length : cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.—-]+$/, '')}…`;
}

/** Search result titles are cut around 60 chars */
export const truncateTitle = (title: string) => truncateText(title, 60);

/** Meta descriptions are cut around 160 chars */
export const truncateDescription = (text: string) => truncateText(text, 160);

/**
 * "Sejong the Great (세종대왕, 世宗大王)" — surfaces the Korean name for
 * Korean-language search without showing it in the English UI.
 */
export function nameWithKorean(
  nameEn: string,
  nameKo?: string | null,
  nameHanja?: string | null
): string {
  const extra = [nameKo, nameHanja].filter((v): v is string => !!v && v !== nameEn);
  return extra.length ? `${nameEn} (${extra.join(', ')})` : nameEn;
}

/** Plain text from Markdown for meta descriptions (links, images, emphasis, headings) */
export function stripMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Room before the root template's " | Sillok" suffix within ~60 chars */
const TITLE_MAX = 60 - ' | Sillok'.length;

/**
 * Overview title — "Sejong the Great (King Sejong): 4th King of Joseon".
 * The alias matches the common English name, the role says who it is in the result;
 * tries without the alias, then without the role, when the title would be cut off.
 */
export function overviewTitle(name: string, alias?: string, role?: string): string {
  const named = alias ? `${name} (${alias})` : name;
  const candidates = role ? [`${named}: ${role}`, `${name}: ${role}`, named] : [named];
  return candidates.find((t) => t.length <= TITLE_MAX) ?? named;
}
