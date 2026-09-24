import { describe, it, expect } from 'vitest';
import { sanitizeSearchTerm } from '@/lib/search';

describe('sanitizeSearchTerm', () => {
  it('keeps normal Korean/English/Hanja input', () => {
    expect(sanitizeSearchTerm('세종 Sejong 世宗')).toBe('세종 Sejong 世宗');
  });

  it('strips PostgREST filter delimiters', () => {
    expect(sanitizeSearchTerm('a%,is_deleted.eq.true,name_en.ilike.(b')).toBe(
      'a is deleted.eq.true name en.ilike. b'
    );
  });

  it('strips ilike wildcards and quotes', () => {
    expect(sanitizeSearchTerm('%*_"\\')).toBe('');
  });

  it('collapses whitespace and trims', () => {
    expect(sanitizeSearchTerm('  yi   sun-sin  ')).toBe('yi sun-sin');
  });
});
