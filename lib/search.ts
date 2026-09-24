/**
 * Sanitize user search input before interpolating into Supabase filters.
 * - `,` `(` `)` `"` `\` break PostgREST `.or()` filter strings (filter injection)
 * - `%` `*` `_` act as ilike wildcards
 * Removed characters are replaced by a space; whitespace is collapsed.
 */
export function sanitizeSearchTerm(q: string): string {
  return q
    .replace(/[,()"\\%*_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
