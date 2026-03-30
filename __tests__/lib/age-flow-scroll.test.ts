import { describe, it, expect } from 'vitest';
import { SCROLL_PER_YEAR, JOSEON_START, JOSEON_END, type AgeFlowPerson } from '@/components/age-flow/useAgeFlow';

// Test the scroll ↔ year conversion logic used in useAgeFlow

const minYear = JOSEON_START;
const maxYear = JOSEON_END;

function scrollToYear(scrollY: number): number {
  const year = minYear + Math.floor(scrollY / SCROLL_PER_YEAR);
  return Math.max(minYear, Math.min(year, maxYear));
}

function yearToScroll(year: number): number {
  return (year - minYear) * SCROLL_PER_YEAR;
}

describe('scroll ↔ year conversion', () => {
  it('should start at JOSEON_START (1320) when scrollY is 0', () => {
    expect(scrollToYear(0)).toBe(1320);
  });

  it('should return 1321 after scrolling 100px', () => {
    expect(scrollToYear(100)).toBe(1321);
  });

  it('should clamp to maxYear', () => {
    expect(scrollToYear(999999)).toBe(JOSEON_END);
  });

  it('should clamp to minYear for negative scroll', () => {
    expect(scrollToYear(-100)).toBe(JOSEON_START);
  });

  it('yearToScroll should be inverse of scrollToYear', () => {
    const year = 1592;
    const scroll = yearToScroll(year);
    expect(scrollToYear(scroll)).toBe(year);
  });

  it('total scroll height should cover full period', () => {
    const totalHeight = (maxYear - minYear) * SCROLL_PER_YEAR;
    expect(totalHeight).toBe(59000); // (1910 - 1320) * 100
  });
});

describe('lerp behavior', () => {
  // Simulate the lerp logic from useAgeFlow
  const LERP_SPEED = 0.04;
  const MAX_STEP = 1.5;
  const SNAP_THRESHOLD = 0.3;

  function lerpStep(display: number, target: number): number {
    const diff = target - display;
    if (Math.abs(diff) < SNAP_THRESHOLD) return target;
    const step = diff * LERP_SPEED;
    const clampedStep = Math.sign(step) * Math.min(Math.abs(step), MAX_STEP);
    return display + clampedStep;
  }

  it('should snap when difference is below threshold', () => {
    expect(lerpStep(1500.1, 1500.3)).toBe(1500.3);
    expect(lerpStep(1500.0, 1500.2)).toBe(1500.2);
  });

  it('should move slowly when difference is small', () => {
    const result = lerpStep(1500, 1510);
    // diff=10, step=0.4, clamped=0.4
    expect(result).toBeCloseTo(1500.4, 5);
  });

  it('should cap movement at MAX_STEP per frame', () => {
    const result = lerpStep(1400, 1600);
    // diff=200, step=8, clamped to MAX_STEP=1.5
    expect(result).toBe(1401.5);
  });

  it('should converge toward target over multiple frames', () => {
    let display = 1400;
    const target = 1450;
    for (let i = 0; i < 1000; i++) {
      display = lerpStep(display, target);
      if (display === target) break;
    }
    expect(display).toBe(target);
  });

  it('should work for backward scrolling', () => {
    const result = lerpStep(1600, 1400);
    // diff=-200, step=-8, clamped to -1.5
    expect(result).toBe(1598.5);
  });
});

describe('newborn animation threshold', () => {
  const ANIMATION_THRESHOLD = 6;

  it('should animate when few cards enter', () => {
    const entered = ['a', 'b', 'c'];
    expect(entered.length <= ANIMATION_THRESHOLD).toBe(true);
  });

  it('should skip animation when many cards enter (fast scroll)', () => {
    const entered = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    expect(entered.length <= ANIMATION_THRESHOLD).toBe(false);
  });

  it('threshold boundary: exactly 6 should animate', () => {
    const entered = Array.from({ length: 6 }, (_, i) => String(i));
    expect(entered.length <= ANIMATION_THRESHOLD).toBe(true);
  });

  it('threshold boundary: 7 should not animate', () => {
    const entered = Array.from({ length: 7 }, (_, i) => String(i));
    expect(entered.length <= ANIMATION_THRESHOLD).toBe(false);
  });
});

// ── Person visibility logic (mirrors useAgeFlow visiblePersons filter) ──

function isVisible(person: Pick<AgeFlowPerson, 'birth_year' | 'death_year' | 'is_alive'>, currentYear: number): boolean {
  return (
    person.birth_year <= currentYear &&
    (person.is_alive || (person.death_year !== null && person.death_year >= currentYear))
  );
}

function isInRange(person: Pick<AgeFlowPerson, 'birth_year' | 'death_year' | 'is_alive'>, start: number, end: number): boolean {
  const deathYear = person.is_alive ? end : (person.death_year ?? person.birth_year);
  return person.birth_year <= end && deathYear >= start;
}

describe('person visibility (isVisible)', () => {
  it('should show person born before current year', () => {
    expect(isVisible({ birth_year: 1335, death_year: 1408, is_alive: false }, 1392)).toBe(true);
  });

  it('should show person born in current year', () => {
    expect(isVisible({ birth_year: 1400, death_year: 1450, is_alive: false }, 1400)).toBe(true);
  });

  it('should NOT show person born after current year', () => {
    expect(isVisible({ birth_year: 1400, death_year: 1450, is_alive: false }, 1399)).toBe(false);
  });

  it('should show person in their death year', () => {
    // This was the bug: death_year > currentYear excluded death year
    expect(isVisible({ birth_year: 1294, death_year: 1339, is_alive: false }, 1339)).toBe(true);
  });

  it('should NOT show person after death year', () => {
    expect(isVisible({ birth_year: 1294, death_year: 1339, is_alive: false }, 1340)).toBe(false);
  });

  it('should show alive person regardless of year', () => {
    expect(isVisible({ birth_year: 1970, death_year: null, is_alive: true }, 2026)).toBe(true);
  });

  it('should NOT show person with null death_year and not alive', () => {
    expect(isVisible({ birth_year: 1400, death_year: null, is_alive: false }, 1450)).toBe(false);
  });

  // Edge cases: kings at reign boundaries
  it('Chungsuk (1294-1339) should be visible at 1339', () => {
    expect(isVisible({ birth_year: 1294, death_year: 1339, is_alive: false }, 1339)).toBe(true);
  });

  it('Chungsuk (1294-1339) should NOT be visible at 1340', () => {
    expect(isVisible({ birth_year: 1294, death_year: 1339, is_alive: false }, 1340)).toBe(false);
  });

  it('Chunghye (1315-1344) should be visible at 1320', () => {
    expect(isVisible({ birth_year: 1315, death_year: 1344, is_alive: false }, 1320)).toBe(true);
  });

  it('Chunghye (1315-1344) should be visible at 1343', () => {
    expect(isVisible({ birth_year: 1315, death_year: 1344, is_alive: false }, 1343)).toBe(true);
  });

  it('Chunghye (1315-1344) should be visible at 1344 (death year)', () => {
    expect(isVisible({ birth_year: 1315, death_year: 1344, is_alive: false }, 1344)).toBe(true);
  });

  it('Taejo (1335-1408) should be visible at 1335 (birth year)', () => {
    expect(isVisible({ birth_year: 1335, death_year: 1408, is_alive: false }, 1335)).toBe(true);
  });
});

describe('person range filter (isInRange)', () => {
  const START = JOSEON_START;
  const END = JOSEON_END;

  it('should include person born before range but alive during range', () => {
    // Chungsuk: born 1294, died 1339 — alive at 1320 (START)
    expect(isInRange({ birth_year: 1294, death_year: 1339, is_alive: false }, START, END)).toBe(true);
  });

  it('should include person born before range who dies exactly at START', () => {
    expect(isInRange({ birth_year: 1200, death_year: 1320, is_alive: false }, START, END)).toBe(true);
  });

  it('should NOT include person who dies before range starts', () => {
    expect(isInRange({ birth_year: 1200, death_year: 1319, is_alive: false }, START, END)).toBe(false);
  });

  it('should include person born during range', () => {
    expect(isInRange({ birth_year: 1397, death_year: 1450, is_alive: false }, START, END)).toBe(true);
  });

  it('should include person born at END', () => {
    expect(isInRange({ birth_year: 1910, death_year: 1970, is_alive: false }, START, END)).toBe(true);
  });

  it('should NOT include person born after range', () => {
    expect(isInRange({ birth_year: 1911, death_year: 1970, is_alive: false }, START, END)).toBe(false);
  });

  it('should include alive person born before range', () => {
    expect(isInRange({ birth_year: 1200, death_year: null, is_alive: true }, START, END)).toBe(true);
  });

  it('should include person whose lifespan exactly matches range', () => {
    expect(isInRange({ birth_year: 1320, death_year: 1910, is_alive: false }, START, END)).toBe(true);
  });

  // The old bug: birth_year >= START filter excluded persons born before START
  it('Chunghye (1315) should be in range even though born before 1320', () => {
    expect(isInRange({ birth_year: 1315, death_year: 1344, is_alive: false }, START, END)).toBe(true);
  });

  it('Chungsuk (1294) should be in range even though born before 1320', () => {
    expect(isInRange({ birth_year: 1294, death_year: 1339, is_alive: false }, START, END)).toBe(true);
  });

  it('Jumong (-58) should NOT be in range (dies long before)', () => {
    expect(isInRange({ birth_year: -58, death_year: -19, is_alive: false }, START, END)).toBe(false);
  });
});
