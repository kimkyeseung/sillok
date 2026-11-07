import { describe, it, expect } from 'vitest';
import { ROYAL_FAMILY, ROYAL_ROOT } from '@/lib/joseon-royal-family';
import {
  aliveTree,
  fitScale,
  groupLabel,
  groupSections,
  groupTitle,
  resolveLifespans,
  royalDensity,
  VIRTUAL_ROOT,
} from '@/lib/royal-timeline';
import { layoutTree, type TreeInput } from '@/lib/royal-tree';

const spans = resolveLifespans();

function flatten(node: TreeInput): TreeInput[] {
  return [node, ...node.children.flatMap(flatten)];
}
const shownIn = (year: number) => {
  const { tree, wives, groups } = aliveTree(year, spans);
  const nodes = flatten(tree).filter((n) => n.id !== VIRTUAL_ROOT);
  const slots = [...nodes.map((n) => n.id), ...Array.from(wives.values()).flat()];
  // A person behind a group card counts as shown
  return slots.flatMap((id) => (groups.has(id) ? groups.get(id)!.members.map((m) => m.id) : [id]));
};
const parentIn = (year: number, id: string) => {
  const { tree } = aliveTree(year, spans);
  return flatten(tree).find((n) => n.children.some((c) => c.id === id))?.id;
};

describe('resolveLifespans', () => {
  it('gives everyone a span', () => {
    expect(spans.size).toBe(ROYAL_FAMILY.length);
    for (const span of spans.values()) {
      expect(span.death).toBeGreaterThanOrEqual(span.birth);
    }
  });

  it('keeps recorded dates', () => {
    expect(spans.get('sejong-daewang')).toEqual({ birth: 1397, death: 1450 });
  });

  it('estimates missing dates from the family', () => {
    const noDates = ROYAL_FAMILY.find((p) => p.parentId === ROYAL_ROOT && !p.birth && !p.death)!;
    expect(spans.get(noDates.id)).toEqual({ birth: 1360, death: 1410 });
    const wife = ROYAL_FAMILY.find((p) => p.spouseOf === 'munjong-yi-hyang' && !p.birth && !p.death)!;
    expect(spans.get(wife.id)?.birth).toBe(1414);
  });

  it('keeps an estimated birth before a recorded death', () => {
    const person = ROYAL_FAMILY.find((p) => !p.birth && p.death)!;
    expect(spans.get(person.id)!.birth).toBeLessThan(person.death!);
  });

  it('prefers DB dates', () => {
    const custom = resolveLifespans({ 'sejong-daewang': { birth_year: 1398, death_year: 1451 } });
    expect(custom.get('sejong-daewang')).toEqual({ birth: 1398, death: 1451 });
  });
});

describe('aliveTree', () => {
  it('shows a person from birth through the year of death, then removes them', () => {
    expect(shownIn(1396)).not.toContain('sejong-daewang');
    expect(shownIn(1397)).toContain('sejong-daewang');
    expect(shownIn(1450)).toContain('sejong-daewang');
    expect(shownIn(1451)).not.toContain('sejong-daewang');
  });

  it('shows exactly the people alive that year', () => {
    for (let year = 1336; year <= 1910; year += 3) {
      const shown = shownIn(year).sort();
      const alive = ROYAL_FAMILY.filter((p) => {
        const s = spans.get(p.id)!;
        return s.birth <= year && year <= s.death;
      }).map((p) => p.id);
      expect(shown).toEqual(alive.sort());
    }
  });

  it('keeps children under a living parent', () => {
    expect(parentIn(1420, 'sejong-daewang')).toBe('taejong-yi-bang-won');
  });

  it('moves children up to the nearest living ancestor', () => {
    // Sado died in 1762; Yeongjo lived until 1776
    expect(parentIn(1770, 'jeongjo-yi-san')).toBe('yeongjo-yi-geum');
  });

  it('moves children to the top level when no ancestor is alive', () => {
    expect(parentIn(1800, 'sunjo-yi-gong')).toBe('jeongjo-yi-san');
    expect(parentIn(1801, 'sunjo-yi-gong')).toBe(VIRTUAL_ROOT);
  });

  it('counts only living wives beside a husband', () => {
    const { tree, wives } = aliveTree(1420, spans);
    const sejong = flatten(tree).find((n) => n.id === 'sejong-daewang')!;
    expect(sejong.spouses).toBe(wives.get('sejong-daewang')!.length);
    const soheon = ROYAL_FAMILY.find((p) => p.name === 'Queen Soheon')!;
    expect(wives.get('sejong-daewang')).toContain(soheon.id);
    // Queen Wongyeong died in 1420 and is still there; Sinui died in 1391 and isn't
    const taejo = shownIn(1395);
    expect(taejo).not.toContain(ROYAL_FAMILY.find((p) => p.name === 'Queen Sinui')!.id);
  });

  it('leaves a widow in her husband’s place', () => {
    const munjeong = ROYAL_FAMILY.find((p) => p.name === 'Queen Munjeong')!;
    expect(shownIn(1560)).toContain(munjeong.id);
    expect(shownIn(1560)).not.toContain('jungjong-yi-yeok');
  });

  it('lays out every year without overlaps in ids', () => {
    for (let year = 1336; year <= 1910; year += 7) {
      const { tree } = aliveTree(year, spans);
      const ids = layoutTree(tree).positions.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('groups', () => {
  const withCards = (year: number) => {
    const { tree, wives, groups } = aliveTree(year, spans);
    const cards = [...flatten(tree).map((n) => n.id), ...Array.from(wives.values()).flat()];
    return { cards, groups };
  };

  it('collapses a large family into group cards', () => {
    const { cards, groups } = withCards(1440);
    const children = groups.get('sejong-daewang:children')!;
    expect(children.kind).toBe('children');
    expect(children.members.length).toBeGreaterThanOrEqual(4);
    expect(cards).toContain('sejong-daewang:children');
    expect(cards).not.toContain(children.members[0].id);
  });

  it('collapses consorts but keeps queens', () => {
    const { cards, groups } = withCards(1600);
    const consorts = groups.get('seonjo-yi-yeon:consorts')!;
    expect(consorts.members.every((m) => m.role === 'consort')).toBe(true);
    expect(cards).toContain(ROYAL_FAMILY.find((p) => p.name === 'Queen Uiin')!.id);
  });

  it('keeps monarchs, heirs, the line and people with a page as cards', () => {
    const { cards, groups } = withCards(1440);
    const grouped = Array.from(groups.values()).flatMap((g) => g.members);
    for (const person of grouped) {
      expect(person.role).not.toBe('king');
      expect(person.role).not.toBe('queen');
      expect(person.role).not.toBe('crown-prince');
      expect(person.slug).toBeNull();
    }
    expect(cards).toContain('sejo-yi-yu');
    expect(cards).toContain('grand-prince-anpyeong');
  });

  it('leaves a lone consort and a small family as separate cards', () => {
    // Danjong's only listed wife is a queen; Yeonsangun's few children stay out in the open
    const { groups } = withCards(1500);
    expect(groups.has('yeonsangun-yi-yung:consorts')).toBe(false);
    expect(groups.has('yeonsangun-yi-yung:children')).toBe(false);
  });

  it('collapses two consorts', () => {
    const { groups } = withCards(1800);
    expect(groups.get('jeongjo-yi-san:consorts')?.members.length).toBeGreaterThanOrEqual(2);
  });

  it('merges families with no living ancestor into one card', () => {
    const { cards, groups } = withCards(1451);
    expect(cards).not.toContain('sejong-daewang');
    expect(cards).toContain('relatives');
    const relatives = groups.get('relatives')!;
    expect(relatives.kind).toBe('relatives');
    expect(relatives.members.map((m) => m.name)).toContain('Prince Gyeyang');
    expect(groups.has('sejong-daewang:children')).toBe(false);
  });

  it('keeps queens out of the relatives', () => {
    const { groups } = withCards(1451);
    expect(groups.get('relatives')!.members.some((m) => m.role === 'queen')).toBe(false);
  });

  it('puts nobody in a group and on a card at once', () => {
    for (let year = 1336; year <= 1910; year += 11) {
      const { cards, groups } = withCards(year);
      const grouped = Array.from(groups.values()).flatMap((g) => g.members.map((m) => m.id));
      expect(grouped.filter((id) => cards.includes(id))).toEqual([]);
      expect(new Set(grouped).size).toBe(grouped.length);
    }
  });

  it('keeps every year small enough to fit', () => {
    let widest = 0;
    for (let year = 1336; year <= 1910; year++) {
      widest = Math.max(widest, layoutTree(aliveTree(year, spans).tree).columns);
    }
    expect(widest).toBeLessThan(30);
  });
});

describe('group text', () => {
  const { groups } = aliveTree(1440, spans);
  const children = groups.get('sejong-daewang:children')!;

  it('names the group after its owner', () => {
    expect(groupTitle(children)).toBe('Children of Sejong the Great');
    expect(groupTitle(aliveTree(1600, spans).groups.get('seonjo-yi-yeon:consorts')!)).toBe('Consorts of Seonjo of Joseon');
    expect(groupTitle(aliveTree(1451, spans).groups.get('relatives')!)).toBe('Other relatives');
  });

  it('labels the card by who is inside', () => {
    expect(groupLabel({ ...children, members: children.members.map((m) => ({ ...m, role: 'prince' as const })) })).toBe('Princes');
    expect(groupLabel({ ...children, members: children.members.map((m) => ({ ...m, role: 'princess' as const })) })).toBe('Princesses');
    expect(groupLabel({ ...children, members: [{ ...children.members[0], role: 'prince' as const }, { ...children.members[0], role: 'princess' as const }] })).toBe(
      'Princes & Princesses'
    );
    expect(groupLabel(aliveTree(1600, spans).groups.get('seonjo-yi-yeon:consorts')!)).toBe('Consorts');
  });

  it('splits children by mother', () => {
    const titles = groupSections(children).map((s) => s.title);
    expect(titles).toContain('Mother: Consort Sin');
    expect(groupSections(children).flatMap((s) => s.members)).toHaveLength(children.members.length);
  });

  it('splits relatives by family', () => {
    const titles = groupSections(aliveTree(1451, spans).groups.get('relatives')!).map((s) => s.title);
    expect(titles).toContain('Children of Sejong the Great');
  });

  it('keeps consorts in one list', () => {
    const sections = groupSections(aliveTree(1600, spans).groups.get('seonjo-yi-yeon:consorts')!);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBeNull();
  });
});

describe('fitScale', () => {
  const stage = { width: 1000, height: 600 };

  it('never enlarges past full size', () => {
    expect(fitScale({ width: 500, height: 300 }, stage, 0.85)).toBe(1);
  });

  it('always fits the height', () => {
    expect(fitScale({ width: 500, height: 1200 }, stage, 0.85)).toBe(0.5);
  });

  it('shrinks to fit the width while that keeps cards readable', () => {
    expect(fitScale({ width: 1100, height: 300 }, stage, 0.85)).toBeCloseTo(1000 / 1100);
  });

  it('stops shrinking for width at the floor and leaves the rest to sideways scrolling', () => {
    expect(fitScale({ width: 4000, height: 300 }, stage, 0.85)).toBe(0.85);
  });
});

describe('royalDensity', () => {
  it('counts the people alive per year', () => {
    const density = royalDensity(spans, 1336, 1910);
    expect(density).toHaveLength(575);
    expect(density[1592 - 1336]).toBe(shownIn(1592).length);
  });
});
