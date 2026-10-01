/**
 * Auto-linking — turns mentions of other figures/events in editorial text into
 * internal links (wiki-style), so plain summaries still connect the archive.
 * Pure logic; the target list is loaded in autolink-data.ts.
 */

export interface LinkSource {
  /** Every name the page is known by: name_en + English aliases / node title */
  names: (string | null | undefined)[];
  href: string;
}

export interface LinkTarget {
  text: string;
  href: string;
}

export type TextSegment = string | LinkTarget;

/** Short names ("Yi", "Jo") match too much ordinary text */
const MIN_NAME_LENGTH = 4;

/**
 * Names usable as link text, longest first.
 * A name shared by two different pages is ambiguous and skipped;
 * names must start with a capital (proper nouns, not common words).
 */
export function buildLinkTargets(sources: LinkSource[]): LinkTarget[] {
  const hrefsByName = new Map<string, Set<string>>();
  for (const s of sources) {
    for (const raw of s.names) {
      const name = raw?.replace(/\s+/g, ' ').trim();
      if (!name || name.length < MIN_NAME_LENGTH || !/^\p{Lu}/u.test(name)) continue;
      const set = hrefsByName.get(name) ?? new Set<string>();
      set.add(s.href);
      hrefsByName.set(name, set);
    }
  }
  return Array.from(hrefsByName)
    .filter(([, hrefs]) => hrefs.size === 1)
    .map(([text, hrefs]) => ({ text, href: Array.from(hrefs)[0] }))
    .sort((a, b) => b.text.length - a.text.length || a.text.localeCompare(b.text));
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface Linker {
  /**
   * Split text into plain strings and links. Each page is linked once per linker
   * (first mention only), so one linker shared across a page's sections keeps it sparse.
   */
  link(text: string): TextSegment[];
}

/**
 * @param exclude hrefs never linked (the current page)
 * @param max     links per linker in total
 */
export function createLinker(
  targets: LinkTarget[],
  { exclude = [], max = 20 }: { exclude?: string[]; max?: number } = {}
): Linker {
  const used = new Set(exclude);
  let count = 0;
  const usable = targets.filter((t) => !used.has(t.href));
  if (!usable.length) return { link: (text) => (text ? [text] : []) };

  const hrefByText = new Map(usable.map((t) => [t.text, t.href]));
  // Longest first so "Sejong the Great" wins over "Sejong"; no match inside a word
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${usable.map((t) => escapeRegExp(t.text)).join('|')})(?![\\p{L}\\p{N}])`,
    'gu'
  );

  return {
    link(text) {
      const out: TextSegment[] = [];
      let last = 0;
      for (const m of text.matchAll(pattern)) {
        const href = hrefByText.get(m[0]);
        if (!href || used.has(href) || count >= max) continue;
        used.add(href);
        count += 1;
        if (m.index! > last) out.push(text.slice(last, m.index));
        out.push({ text: m[0], href });
        last = m.index! + m[0].length;
      }
      if (last < text.length) out.push(text.slice(last));
      return out;
    },
  };
}
