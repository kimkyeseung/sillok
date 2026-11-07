/**
 * The royal family in a given year (pure — no DB access).
 *
 * People are on screen while alive. When someone dies their children move up to the nearest
 * living ancestor, or to the top level if there is none; a widow takes her husband's place.
 */
import { ROYAL_FAMILY, ROYAL_ROOT, type RoyalPerson } from '@/lib/joseon-royal-family';
import type { TreeInput } from '@/lib/royal-tree';

export interface Lifespan {
  birth: number;
  death: number;
}

/** Stands above everyone with no living ancestor. Never drawn. */
export const VIRTUAL_ROOT = '__royal-root';

/** Typical gap used when a date is unrecorded */
const PARENT_AGE = 25;
const LIFE_LENGTH = 50;

const childrenOf = new Map<string, RoyalPerson[]>();
const wivesOf = new Map<string, RoyalPerson[]>();
for (const person of ROYAL_FAMILY) {
  const [map, key] = person.spouseOf ? [wivesOf, person.spouseOf] : [childrenOf, person.parentId];
  if (key) map.set(key, [...(map.get(key) ?? []), person]);
}

/**
 * Birth and death years, estimated where unrecorded so everyone has a place on the timeline:
 * a child is born when the parent is 25, a wife is the husband's age, and a life lasts 50 years.
 * Cards still show the recorded dates only. `known` (from the DB) wins over the family file.
 * ROYAL_FAMILY lists parents and husbands first, so their spans are always ready.
 */
export function resolveLifespans(
  known: Record<string, { birth_year: number | null; death_year: number | null }> = {}
): Map<string, Lifespan> {
  const spans = new Map<string, Lifespan>();
  for (const person of ROYAL_FAMILY) {
    const record = person.slug ? known[person.slug] : undefined;
    const recordedBirth = record?.birth_year ?? person.birth;
    const recordedDeath = record?.death_year ?? person.death;

    const husband = person.spouseOf ? spans.get(person.spouseOf) : undefined;
    const parent = person.parentId ? spans.get(person.parentId) : undefined;
    const guess = husband?.birth ?? (parent ? parent.birth + PARENT_AGE : recordedBirth ?? 0);

    const birth = recordedBirth ?? (recordedDeath !== null ? Math.min(guess, recordedDeath - 1) : guess);
    spans.set(person.id, { birth, death: recordedDeath ?? birth + LIFE_LENGTH });
  }
  return spans;
}

const isAlive = (span: Lifespan | undefined, year: number) => !!span && span.birth <= year && year <= span.death;

/** Who is shown in `year`, as a tree for layoutTree. `wives` lists each husband's living wives in slot order. */
export function aliveTree(year: number, spans: Map<string, Lifespan>) {
  const wives = new Map<string, RoyalPerson[]>();

  const build = (id: string): TreeInput[] => {
    const children = (childrenOf.get(id) ?? []).flatMap((child) => build(child.id));
    const living = (wivesOf.get(id) ?? []).filter((wife) => isAlive(spans.get(wife.id), year));

    if (isAlive(spans.get(id), year)) {
      wives.set(id, living);
      return [{ id, spouses: living.length, children }];
    }
    return [...living.map((wife) => ({ id: wife.id, spouses: 0, children: [] })), ...children];
  };

  const tree: TreeInput = { id: VIRTUAL_ROOT, spouses: 0, children: build(ROYAL_ROOT) };
  return { tree, wives };
}

/**
 * How far to shrink a tree for the screen. Height always fits, because vertical scrolling moves
 * through time. Width only shrinks down to `minWidthScale`; past that the tree scrolls sideways,
 * which beats cards too small to read.
 */
export function fitScale(
  size: { width: number; height: number },
  stage: { width: number; height: number },
  minWidthScale: number
): number {
  return Math.min(1, stage.height / size.height, Math.max(stage.width / size.width, minWidthScale));
}

/** People alive per year from `minYear` to `maxYear`, for the density bar */
export function royalDensity(spans: Map<string, Lifespan>, minYear: number, maxYear: number): number[] {
  const counts = new Array<number>(maxYear - minYear + 1).fill(0);
  spans.forEach(({ birth, death }) => {
    for (let year = Math.max(birth, minYear); year <= Math.min(death, maxYear); year++) counts[year - minYear]++;
  });
  return counts;
}
