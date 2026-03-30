import { describe, it, expect } from 'vitest';
import {
  getEra,
  getAge,
  formatCount,
  getInitials,
  SCROLL_PER_YEAR,
  JOSEON_START,
  JOSEON_END,
  ERA_RANGES,
  RELATION_STYLES,
  ERA_BG_COLORS,
} from '@/components/age-flow/useAgeFlow';

describe('getEra', () => {
  it('should return Ancient for year < 57', () => {
    expect(getEra(-58)).toBe('Ancient');
    expect(getEra(0)).toBe('Ancient');
    expect(getEra(56)).toBe('Ancient');
  });

  it('should return Three Kingdoms for 57 <= year < 918', () => {
    expect(getEra(57)).toBe('Three Kingdoms');
    expect(getEra(500)).toBe('Three Kingdoms');
    expect(getEra(917)).toBe('Three Kingdoms');
  });

  it('should return Goryeo for 918 <= year < 1392', () => {
    expect(getEra(918)).toBe('Goryeo');
    expect(getEra(1200)).toBe('Goryeo');
    expect(getEra(1391)).toBe('Goryeo');
  });

  it('should return Joseon for 1392 <= year < 1897', () => {
    expect(getEra(1392)).toBe('Joseon');
    expect(getEra(1600)).toBe('Joseon');
    expect(getEra(1896)).toBe('Joseon');
  });

  it('should return Modern for year >= 1897', () => {
    expect(getEra(1897)).toBe('Modern');
    expect(getEra(2026)).toBe('Modern');
  });
});

describe('getAge', () => {
  it('should calculate age correctly', () => {
    expect(getAge(1397, 1450)).toBe(53);
  });

  it('should return 1 for birth year equal to current year', () => {
    expect(getAge(1450, 1450)).toBe(1);
  });

  it('should return 1 for negative age (year before birth)', () => {
    expect(getAge(1450, 1400)).toBe(1);
  });

  it('should handle BC years', () => {
    expect(getAge(-58, -19)).toBe(39);
  });
});

describe('formatCount', () => {
  it('should return number as string for < 1000', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(999)).toBe('999');
    expect(formatCount(42)).toBe('42');
  });

  it('should format thousands with k suffix', () => {
    expect(formatCount(1000)).toBe('1.0k');
    expect(formatCount(1200)).toBe('1.2k');
    expect(formatCount(15000)).toBe('15.0k');
  });
});

describe('getInitials', () => {
  it('should return first 2 characters', () => {
    expect(getInitials('세종대왕')).toBe('세종');
    expect(getInitials('이순신')).toBe('이순');
  });

  it('should handle single character', () => {
    expect(getInitials('A')).toBe('A');
  });

  it('should handle English names', () => {
    expect(getInitials('Sejong')).toBe('Se');
  });
});

describe('constants', () => {
  it('SCROLL_PER_YEAR should be 100', () => {
    expect(SCROLL_PER_YEAR).toBe(100);
  });

  it('JOSEON_START should be 1336', () => {
    expect(JOSEON_START).toBe(1336);
  });

  it('JOSEON_END should be 1910', () => {
    expect(JOSEON_END).toBe(1910);
  });

  it('ERA_RANGES should have all 5 eras', () => {
    expect(Object.keys(ERA_RANGES)).toHaveLength(5);
    expect(ERA_RANGES['Joseon'].start).toBe(1392);
  });

  it('RELATION_STYLES should have all relation types', () => {
    expect(RELATION_STYLES['FAMILY'].color).toBe('#22c55e');
    expect(RELATION_STYLES['RIVAL'].color).toBe('#ef4444');
    expect(RELATION_STYLES['INFLUENCE'].dashed).toBe(true);
    expect(RELATION_STYLES['ALLY'].dashed).toBe(false);
  });

  it('ERA_BG_COLORS should have all 5 eras', () => {
    expect(Object.keys(ERA_BG_COLORS)).toHaveLength(5);
    expect(ERA_BG_COLORS['Joseon']).toContain('amber');
  });
});
