import { describe, it, expect } from 'vitest';
import { tagLabel } from '@/lib/tags';

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
