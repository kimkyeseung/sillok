/** Get the primary FIELD tag name from a tags array */
export function getPrimaryFieldTag(
  tags: Array<{ name_en: string; type: string }> | undefined | null
): string | null {
  if (!tags || tags.length === 0) return null;
  const field = tags.find((t) => t.type === 'FIELD');
  return field?.name_en ?? null;
}
