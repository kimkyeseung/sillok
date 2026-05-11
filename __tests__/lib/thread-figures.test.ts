import { describe, expect, it } from 'vitest';
import {
  normalizeThreadFigures,
  normalizeThreadList,
  uniqueFigureIds,
} from '@/lib/thread-figures';

describe('thread figure helpers', () => {
  it('deduplicates figure ids while preserving order', () => {
    expect(uniqueFigureIds(['a', 'b', 'a', 'c', 'b'])).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('normalizes primary and related figures into a single ordered list', () => {
    const thread = normalizeThreadFigures({
      id: 'thread-1',
      person_id: 'person-1',
      persons: {
        id: 'person-1',
        slug: 'sejong',
        name_en: 'Sejong',
        thumbnail: 'sejong.jpg',
      },
      thread_persons: [
        {
          person_id: 'person-2',
          persons: {
            id: 'person-2',
            slug: 'jeong-dojeon',
            name_en: 'Jeong Do-jeon',
            thumbnail: null,
          },
        },
      ],
    });

    expect(thread.figures).toEqual([
      {
        id: 'person-1',
        slug: 'sejong',
        name_en: 'Sejong',
        name_ko: null,
        thumbnail: 'sejong.jpg',
        is_primary: true,
      },
      {
        id: 'person-2',
        slug: 'jeong-dojeon',
        name_en: 'Jeong Do-jeon',
        name_ko: null,
        thumbnail: null,
        is_primary: false,
      },
    ]);
  });

  it('skips duplicate related figures that match the primary figure', () => {
    const thread = normalizeThreadFigures({
      person_id: 'person-1',
      persons: { slug: 'sejong', name_en: 'Sejong' },
      thread_persons: [
        {
          person_id: 'person-1',
          persons: { slug: 'sejong', name_en: 'Sejong' },
        },
      ],
    });

    expect(thread.figures).toHaveLength(1);
    expect(thread.figures[0].is_primary).toBe(true);
  });

  it('normalizes lists safely when data is null', () => {
    expect(normalizeThreadList(null)).toEqual([]);
  });
});
