import { describe, it, expect } from 'vitest';
import { FactSchema, HighlightSchema, SourceSchema } from '@/lib/person-content-schemas';

describe('content schemas', () => {
  it('rejects non-http URLs for sources', () => {
    expect(SourceSchema.safeParse({ kind: 'WEB', title: 'x', url: 'javascript:alert(1)' }).success).toBe(false);
    expect(SourceSchema.safeParse({ kind: 'WEB', title: 'x', url: 'https://example.com' }).success).toBe(true);
  });

  it('normalizes empty optional text to null', () => {
    const r = HighlightSchema.parse({ kind: 'TRIVIA', title: 'Fact', body: '' });
    expect(r.body).toBeNull();
  });
});
