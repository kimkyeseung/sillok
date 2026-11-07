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

const personById = new Map(ROYAL_FAMILY.map((p) => [p.id, p]));
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

/** Fewer children than this stay as separate cards: a group of two or three saves little */
const GROUP_MIN = 4;
/** Consorts sit in a row beside the husband and push everything apart, so two already collapse */
const CONSORT_GROUP_MIN = 2;
/** The one group for people with no living ancestor */
const RELATIVES_GROUP = 'relatives';

/** Everyone descended from a monarch or who is one: they keep the line readable, so they stay as cards */
const onLine = new Set<string>();
const markLine = (person: RoyalPerson): boolean => {
  const below = (childrenOf.get(person.id) ?? []).map(markLine).some(Boolean);
  const carries = below || person.role === 'king';
  if (carries) onLine.add(person.id);
  return carries;
};
ROYAL_FAMILY.filter((p) => !p.parentId && !p.spouseOf).forEach(markLine);

/** Who always gets a card of their own */
function isProminent(person: RoyalPerson): boolean {
  return (
    person.role === 'king' ||
    person.role === 'queen' ||
    person.role === 'crown-prince' ||
    person.slug !== null ||
    onLine.has(person.id)
  );
}

export interface RoyalGroup {
  id: string;
  kind: 'consorts' | 'children' | 'relatives';
  /** The husband or parent, who may no longer be alive. Null for relatives. */
  ownerId: string | null;
  members: RoyalPerson[];
}

const nameOf = (id: string | null) => (id ? personById.get(id)?.name ?? '' : '');

export function groupTitle(group: RoyalGroup): string {
  if (group.kind === 'consorts') return `Consorts of ${nameOf(group.ownerId)}`;
  if (group.kind === 'children') return `Children of ${nameOf(group.ownerId)}`;
  return 'Other relatives';
}

/** The short label on a group card */
export function groupLabel(group: RoyalGroup): string {
  if (group.kind === 'consorts') return 'Consorts';
  if (group.kind === 'relatives') return 'Relatives';
  const princes = group.members.some((m) => m.role === 'prince');
  const princesses = group.members.some((m) => m.role === 'princess');
  if (princes && princesses) return 'Princes & Princesses';
  return princes ? 'Princes' : 'Princesses';
}

/** How the popup splits a group: children by mother, relatives by family */
export function groupSections(group: RoyalGroup): { title: string | null; members: RoyalPerson[] }[] {
  const titleOf = (member: RoyalPerson): string | null => {
    if (group.kind === 'consorts') return null;
    if (group.kind === 'children') return member.mother ? `Mother: ${member.mother}` : 'Mother not listed';
    return member.spouseOf ? `Consorts of ${nameOf(member.spouseOf)}` : `Children of ${nameOf(member.parentId)}`;
  };
  const sections = new Map<string | null, RoyalPerson[]>();
  for (const member of group.members) {
    const title = titleOf(member);
    sections.set(title, [...(sections.get(title) ?? []), member]);
  }
  return Array.from(sections, ([title, members]) => ({ title, members }));
}

/**
 * Who is shown in `year`, as a tree for layoutTree.
 * Large families collapse: a monarch's many consorts or childless children become one group card.
 * - `wives`: each husband's spouse slots, in order. A slot is a person id or a group id.
 * - `groups`: the people behind each group card.
 */
export function aliveTree(year: number, spans: Map<string, Lifespan>) {
  const wives = new Map<string, string[]>();
  const groups = new Map<string, RoyalGroup>();

  /** People who keep a card, plus a group for the others if there are enough of them */
  const collapse = (ownerId: string, kind: 'consorts' | 'children', people: RoyalPerson[]) => {
    const others = people.filter((person) => !isProminent(person));
    if (others.length < (kind === 'consorts' ? CONSORT_GROUP_MIN : GROUP_MIN)) return { cards: people, groupId: null };
    const groupId = `${ownerId}:${kind}`;
    groups.set(groupId, { id: groupId, kind, ownerId, members: others });
    return { cards: people.filter(isProminent), groupId };
  };

  const build = (id: string): TreeInput[] => {
    const alive = (person: RoyalPerson) => isAlive(spans.get(person.id), year);
    const family = childrenOf.get(id) ?? [];

    // A child whose descendants are alive has to stay in the tree even if the child is gone
    const childNodes = new Map(family.map((child) => [child.id, build(child.id)]));
    const lone = family.filter((child) => alive(child) && childNodes.get(child.id)?.[0]?.children.length === 0);
    const kids = collapse(id, 'children', lone);
    const collapsed = new Set(lone.filter((child) => !kids.cards.includes(child)).map((child) => child.id));
    const children: TreeInput[] = family.flatMap((child) =>
      collapsed.has(child.id) ? [] : childNodes.get(child.id) ?? []
    );
    if (kids.groupId) children.push({ id: kids.groupId, spouses: 0, children: [] });

    const spouses = collapse(id, 'consorts', (wivesOf.get(id) ?? []).filter(alive));
    const slots = spouses.cards.map((wife) => wife.id);
    if (spouses.groupId) slots.push(spouses.groupId);

    if (isAlive(spans.get(id), year)) {
      wives.set(id, slots);
      return [{ id, spouses: slots.length, children }];
    }
    return [...slots.map((slot) => ({ id: slot, spouses: 0, children: [] })), ...children];
  };

  // With no living ancestor, the earlier generation's families would all line up across the
  // top row: merge whoever isn't prominent into one card
  const top = build(ROYAL_ROOT);
  const isLoose = (node: TreeInput) => {
    if (node.children.length > 0 || node.spouses > 0) return false;
    if (groups.has(node.id)) return true;
    const person = personById.get(node.id);
    return !!person && !isProminent(person);
  };
  const loose = top.filter(isLoose);
  const settled = top.filter((node) => !isLoose(node));
  const members = loose.flatMap((node) => groups.get(node.id)?.members ?? [personById.get(node.id)!]);
  let children = top;
  if (members.length >= GROUP_MIN) {
    loose.forEach((node) => groups.delete(node.id));
    groups.set(RELATIVES_GROUP, { id: RELATIVES_GROUP, kind: 'relatives', ownerId: null, members });
    children = [...settled, { id: RELATIVES_GROUP, spouses: 0, children: [] }];
  }

  const tree: TreeInput = { id: VIRTUAL_ROOT, spouses: 0, children };
  return { tree, wives, groups };
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
