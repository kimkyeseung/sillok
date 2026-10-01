import { describe, it, expect } from 'vitest';
import { buildLinkTargets, createLinker } from '@/lib/autolink';

const targets = buildLinkTargets([
  { names: ['Sejong the Great', 'King Sejong', 'Yi Do'], href: '/persons/sejong-daewang' },
  { names: ['Taejong of Joseon', 'Taejong'], href: '/persons/taejong' },
  { names: ['Jang Yeong-sil'], href: '/persons/jang-yeong-sil' },
  { names: ['Imjin War'], href: '/nodes/imjin-war' },
  { names: ['Jiphyeonjeon'], href: '/nodes/jiphyeonjeon' },
]);

describe('buildLinkTargets', () => {
  it('orders names longest first', () => {
    const lengths = targets.map((t) => t.text.length);
    expect(lengths).toEqual([...lengths].sort((a, b) => b - a));
    expect(targets[0].text).toBe('Taejong of Joseon');
  });

  it('skips short names, lowercase words and names shared by two pages', () => {
    const t = buildLinkTargets([
      { names: ['Yi', 'queen', 'Taejo'], href: '/persons/taejo-goryeo' },
      { names: ['Taejo'], href: '/persons/taejo-joseon' },
      { names: ['Taejo of Joseon'], href: '/persons/taejo-joseon' },
    ]);
    expect(t).toEqual([{ text: 'Taejo of Joseon', href: '/persons/taejo-joseon' }]);
  });
});

describe('createLinker', () => {
  it('links the first mention of each page only', () => {
    const linker = createLinker(targets);
    const out = linker.link('Taejong ruled before Sejong the Great. Taejong abdicated.');
    expect(out).toEqual([
      { text: 'Taejong', href: '/persons/taejong' },
      ' ruled before ',
      { text: 'Sejong the Great', href: '/persons/sejong-daewang' },
      '. Taejong abdicated.',
    ]);
  });

  it('keeps first-mention state across texts on one page', () => {
    const linker = createLinker(targets);
    linker.link('He founded the Jiphyeonjeon.');
    expect(linker.link('Scholars of the Jiphyeonjeon')).toEqual(['Scholars of the Jiphyeonjeon']);
  });

  it('never links the current page', () => {
    const linker = createLinker(targets, { exclude: ['/persons/sejong-daewang'] });
    expect(linker.link('King Sejong met Jang Yeong-sil')).toEqual([
      'King Sejong met ',
      { text: 'Jang Yeong-sil', href: '/persons/jang-yeong-sil' },
    ]);
  });

  it('does not match inside a longer word', () => {
    const linker = createLinker(targets);
    expect(linker.link('Taejongs and xImjin War')).toEqual(['Taejongs and xImjin War']);
  });

  it('allows possessives and punctuation around a name', () => {
    const linker = createLinker(targets);
    expect(linker.link("Taejong's son")).toEqual([{ text: 'Taejong', href: '/persons/taejong' }, "'s son"]);
  });

  it('stops at the link cap', () => {
    const linker = createLinker(targets, { max: 1 });
    expect(linker.link('Taejong, Jang Yeong-sil').filter((s) => typeof s !== 'string')).toHaveLength(1);
  });

  it('returns plain text when there are no targets', () => {
    expect(createLinker([]).link('Imjin War')).toEqual(['Imjin War']);
    expect(createLinker([]).link('')).toEqual([]);
  });
});
