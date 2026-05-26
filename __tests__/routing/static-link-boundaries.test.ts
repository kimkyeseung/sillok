import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static server chrome links', () => {
  it('keeps footer and not-found links as plain anchors to avoid idle chunk hydration failures', () => {
    const footerSource = readFileSync('components/common/Footer.tsx', 'utf8');
    const notFoundSource = readFileSync('app/not-found.tsx', 'utf8');

    expect(footerSource).not.toContain("from 'next/link'");
    expect(footerSource).not.toContain('from "next/link"');
    expect(notFoundSource).not.toContain("from 'next/link'");
    expect(notFoundSource).not.toContain('from "next/link"');
  });

  it('does not make the home navigation entry a Next Link prefetch target', () => {
    const headerSource = readFileSync('components/common/Header.tsx', 'utf8');

    expect(headerSource).toContain('<a href="/" className="shrink-0"');
    expect(headerSource).toContain('if (item.href === \'/\')');
  });
});
