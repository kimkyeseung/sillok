import { describe, it, expect } from 'vitest';
import { ROYAL_FAMILY, ROYAL_ROOT } from '@/lib/joseon-royal-family';
import { DYNASTIES } from '@/lib/monarchs';

const byId = new Map(ROYAL_FAMILY.map((p) => [p.id, p]));

describe('ROYAL_FAMILY', () => {
  it('has unique ids', () => {
    expect(byId.size).toBe(ROYAL_FAMILY.length);
  });

  it('has the founder as its only root', () => {
    const roots = ROYAL_FAMILY.filter((p) => !p.parentId && !p.spouseOf);
    expect(roots.map((p) => p.id)).toEqual([ROYAL_ROOT]);
  });

  it('connects everyone to the founder', () => {
    for (const person of ROYAL_FAMILY) {
      let current = person;
      let hops = 0;
      while (current.id !== ROYAL_ROOT) {
        const next = byId.get(current.parentId ?? current.spouseOf ?? '');
        expect(next, `${person.id} is cut off`).toBeDefined();
        current = next!;
        expect(++hops).toBeLessThan(40);
      }
    }
  });

  it('includes all 27 monarchs of the Joseon succession, marked as kings', () => {
    const joseon = DYNASTIES.find((d) => d.id === 'joseon')!;
    expect(joseon.monarchs).toHaveLength(27);
    for (const monarch of joseon.monarchs) {
      expect(byId.get(monarch.slug!)?.role, monarch.slug).toBe('king');
    }
  });

  it('has no king outside the succession', () => {
    const joseon = new Set(DYNASTIES.find((d) => d.id === 'joseon')!.monarchs.map((m) => m.slug));
    for (const person of ROYAL_FAMILY.filter((p) => p.role === 'king')) {
      expect(joseon.has(person.id), person.id).toBe(true);
    }
  });

  it('has plausible parent and child dates', () => {
    for (const child of ROYAL_FAMILY.filter((p) => p.parentId && !p.adopted && p.birth)) {
      const parent = byId.get(child.parentId!)!;
      // Yejong's son was born when he was 11
      if (parent.birth) expect(child.birth! - parent.birth, child.id).toBeGreaterThanOrEqual(11);
      if (parent.death) expect(child.birth!, child.id).toBeLessThanOrEqual(parent.death + 1);
    }
  });

  it('has birth before death for everyone', () => {
    for (const person of ROYAL_FAMILY) {
      if (person.birth && person.death) expect(person.death, person.id).toBeGreaterThanOrEqual(person.birth);
    }
  });

  it('orders children by birth', () => {
    const children = ROYAL_FAMILY.filter((p) => p.parentId === 'sejong-daewang' && p.birth);
    const years = children.map((p) => p.birth!);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it('marks the one adoption on the line to Gojong', () => {
    expect(ROYAL_FAMILY.filter((p) => p.adopted).map((p) => p.id)).toEqual(['prince-namyeon']);
    expect(byId.get('prince-namyeon')?.parentId).toBe('prince-eunsin');
  });

  it('links the first batch of figures without clashes', () => {
    const slugs = ROYAL_FAMILY.flatMap((p) => (p.slug ? [p.slug] : []));
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.length).toBeGreaterThanOrEqual(110);
    expect(ROYAL_FAMILY.find((p) => p.slug === 'queen-jeongsun-danjong')?.spouseOf).toBe('danjong-yi-hong-wi');
    expect(ROYAL_FAMILY.find((p) => p.slug === 'queen-jeongsun-yeongjo')?.spouseOf).toBe('yeongjo-yi-geum');
    expect(ROYAL_FAMILY.find((p) => p.slug === 'park-gyeong-bin')?.spouseOf).toBe('jungjong-yi-yeok');
  });

  it('uses valid slugs', () => {
    for (const person of ROYAL_FAMILY) {
      if (person.slug) expect(person.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });
});
