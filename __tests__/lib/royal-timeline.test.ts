import { describe, it, expect } from 'vitest';
import { ROYAL_FAMILY, ROYAL_ROOT } from '@/lib/joseon-royal-family';
import { aliveTree, fitScale, resolveLifespans, royalDensity, VIRTUAL_ROOT } from '@/lib/royal-timeline';
import { layoutTree, type TreeInput } from '@/lib/royal-tree';

const spans = resolveLifespans();

function flatten(node: TreeInput): TreeInput[] {
  return [node, ...node.children.flatMap(flatten)];
}
const shownIn = (year: number) => {
  const { tree, wives } = aliveTree(year, spans);
  const nodes = flatten(tree).filter((n) => n.id !== VIRTUAL_ROOT);
  return [...nodes.map((n) => n.id), ...Array.from(wives.values()).flat().map((w) => w.id)];
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
    for (const year of [1336, 1418, 1592, 1776, 1910]) {
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
    expect(wives.get('sejong-daewang')!.map((w) => w.name)).toContain('Queen Soheon');
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
      const ids = layoutTree(tree, { maxCols: 4 }).positions.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
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
