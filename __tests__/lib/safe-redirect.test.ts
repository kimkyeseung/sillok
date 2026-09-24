import { describe, it, expect } from 'vitest';
import { safeRedirectPath } from '@/lib/safe-redirect';

describe('safeRedirectPath', () => {
  it('allows same-origin paths', () => {
    expect(safeRedirectPath('/')).toBe('/');
    expect(safeRedirectPath('/persons/sejong-daewang?tab=threads')).toBe(
      '/persons/sejong-daewang?tab=threads'
    );
  });

  it('falls back for missing values', () => {
    expect(safeRedirectPath(null)).toBe('/');
    expect(safeRedirectPath('')).toBe('/');
  });

  it('blocks open redirects', () => {
    expect(safeRedirectPath('@evil.com')).toBe('/');
    expect(safeRedirectPath('//evil.com')).toBe('/');
    expect(safeRedirectPath('/\\evil.com')).toBe('/');
    expect(safeRedirectPath('https://evil.com')).toBe('/');
    expect(safeRedirectPath('.evil.com')).toBe('/');
    expect(safeRedirectPath('/\tevil')).toBe('/');
  });
});
