import { describe, it, expect } from 'vitest';
import {
  truncateText,
  truncateTitle,
  truncateDescription,
  nameWithKorean,
  stripMarkdown,
  personTitle,
} from '@/lib/seo';

describe('truncateText', () => {
  it('keeps short text unchanged (whitespace normalized)', () => {
    expect(truncateText('  Hello   world ', 60)).toBe('Hello world');
  });

  it('cuts at a word boundary with an ellipsis', () => {
    const result = truncateText('The quick brown fox jumps over the lazy dog', 20);
    expect(result).toBe('The quick brown fox…');
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('hard-cuts when there is no usable word boundary', () => {
    const result = truncateText('a'.repeat(100), 10);
    expect(result).toBe(`${'a'.repeat(9)}…`);
  });

  it('title/description limits', () => {
    expect(truncateTitle('x '.repeat(100)).length).toBeLessThanOrEqual(60);
    expect(truncateDescription('word '.repeat(100)).length).toBeLessThanOrEqual(160);
  });
});

describe('nameWithKorean', () => {
  it('appends Korean and Hanja names', () => {
    expect(nameWithKorean('Sejong the Great', '세종대왕', '世宗大王')).toBe(
      'Sejong the Great (세종대왕, 世宗大王)'
    );
  });

  it('skips missing names', () => {
    expect(nameWithKorean('BTS', null, null)).toBe('BTS');
    expect(nameWithKorean('Jumong', '주몽', null)).toBe('Jumong (주몽)');
  });
});

describe('stripMarkdown', () => {
  it('removes common markdown syntax', () => {
    expect(
      stripMarkdown('## Title\n**Bold** and [link](https://x.com) ![img](a.png)\n- item')
    ).toBe('Title Bold and link item');
  });
});

describe('personTitle', () => {
  it('appends the first alias', () => {
    expect(personTitle('Sejong the Great', ['King Sejong'])).toBe('Sejong the Great (King Sejong)');
  });

  it('keeps the name alone without aliases', () => {
    expect(personTitle('Yi Sun-sin', [])).toBe('Yi Sun-sin');
    expect(personTitle('Yi Sun-sin', null)).toBe('Yi Sun-sin');
  });

  it('does not add a second parenthetical', () => {
    expect(personTitle('Kim Hong-do (Danwon)', ['Danwon', 'Kim Hongdo'])).toBe('Kim Hong-do (Danwon)');
  });

  it('skips aliases already contained in the name', () => {
    expect(personTitle('King Jeongjo', ['jeongjo', 'Yi San'])).toBe('King Jeongjo (Yi San)');
  });
});
