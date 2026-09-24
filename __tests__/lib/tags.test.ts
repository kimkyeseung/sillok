import { describe, it, expect } from 'vitest';
import { tagLabel, articleTagLabel } from '@/lib/tags';

describe('tagLabel', () => {
  it('maps known slugs to labels', () => {
    expect(tagLabel('joseon')).toBe('Joseon');
    expect(tagLabel('three-kingdoms')).toBe('Three Kingdoms');
    expect(tagLabel('king')).toBe('Royalty');
    expect(tagLabel('independence-activist')).toBe('Independence Activist');
  });

  it('title-cases unknown slugs', () => {
    expect(tagLabel('naval-commander')).toBe('Naval Commander');
  });

  it('keeps values that are already labels', () => {
    expect(tagLabel('Royalty')).toBe('Royalty');
    expect(tagLabel('Culture & Entertainment')).toBe('Culture & Entertainment');
  });

  it('handles empty values', () => {
    expect(tagLabel(null)).toBe('');
    expect(tagLabel(undefined)).toBe('');
    expect(tagLabel('')).toBe('');
  });
});

describe('articleTagLabel', () => {
  it('shows English labels only', () => {
    expect(articleTagLabel('기획')).toBe('Feature');
    expect(articleTagLabel('인물탐구')).toBe('Spotlight');
    expect(articleTagLabel('공지')).toBe('Announcement');
    expect(articleTagLabel('새태그')).toBeNull();
    expect(articleTagLabel(null)).toBeNull();
  });

  it('hides the announcement tag on notices (Notice badge already shown)', () => {
    expect(articleTagLabel('공지', true)).toBeNull();
    expect(articleTagLabel('기획', true)).toBe('Feature');
  });
});
