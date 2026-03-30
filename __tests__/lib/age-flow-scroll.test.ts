import { describe, it, expect } from 'vitest';
import { SCROLL_PER_YEAR, JOSEON_START, JOSEON_END } from '@/components/age-flow/useAgeFlow';

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
  it('should start at JOSEON_START (1335) when scrollY is 0', () => {
    expect(scrollToYear(0)).toBe(1335);
  });

  it('should return 1336 after scrolling 100px', () => {
    expect(scrollToYear(100)).toBe(1336);
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

  it('total scroll height should cover full Joseon period', () => {
    const totalHeight = (maxYear - minYear) * SCROLL_PER_YEAR;
    expect(totalHeight).toBe(57500); // (1910 - 1335) * 100
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
