import { describe, it, expect } from 'vitest';
import { getPrimaryFieldTag } from '@/lib/person-utils';

describe('getPrimaryFieldTag', () => {
  it('should return the first FIELD tag name_en', () => {
    const tags = [
      { name_en: 'Joseon', type: 'ERA' },
      { name_en: 'Scholar', type: 'FIELD' },
      { name_en: 'Politician', type: 'FIELD' },
    ];
    expect(getPrimaryFieldTag(tags)).toBe('Scholar');
  });

  it('should return null if no FIELD tags', () => {
    const tags = [
      { name_en: 'Joseon', type: 'ERA' },
      { name_en: 'Modern', type: 'ERA' },
    ];
    expect(getPrimaryFieldTag(tags)).toBeNull();
  });

  it('should return null for empty array', () => {
    expect(getPrimaryFieldTag([])).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(getPrimaryFieldTag(undefined)).toBeNull();
  });

  it('should return null for null', () => {
    expect(getPrimaryFieldTag(null)).toBeNull();
  });

  it('should handle single FIELD tag', () => {
    const tags = [{ name_en: 'Royalty', type: 'FIELD' }];
    expect(getPrimaryFieldTag(tags)).toBe('Royalty');
  });
});
