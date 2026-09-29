import { describe, it, expect } from 'vitest';
import {
  FORMAT_DEFS,
  GenerateMemeSchema,
  TEMPLATE_FORMATS,
  clampBox,
  fitFontSize,
  formatForRelation,
  isMemeBucketUrl,
  isMemeEligible,
  memeName,
  memeThreadBody,
  padBox,
  harmonizeFontSizes,
  memeTranscript,
  memeAltText,
  UpdateMemeSchema,
  parseMemeContent,
  parseMemeCursor,
  pickHat,
  translatedSize,
} from '@/lib/meme';

describe('pickHat', () => {
  it('maps FIELD tags to headwear, king first', () => {
    expect(pickHat(['king', 'scholar'])).toBe('ikseongwan');
    expect(pickHat(['general'])).toBe('helmet');
    expect(pickHat(['scholar'])).toBe('gat');
    expect(pickHat(['politician'])).toBe('gat');
    expect(pickHat(['religious'])).toBe('none');
    expect(pickHat([])).toBe('topknot');
  });

  it('is case-insensitive', () => {
    expect(pickHat(['King'])).toBe('ikseongwan');
  });
});

describe('isMemeEligible', () => {
  const base = { birth_year: 1545, is_alive: false, eraTags: ['joseon'] };

  it('accepts pre-modern deceased figures', () => {
    expect(isMemeEligible(base)).toBe(true);
  });

  it('rejects living, modern-era, recent, or undated figures', () => {
    expect(isMemeEligible({ ...base, is_alive: true })).toBe(false);
    expect(isMemeEligible({ ...base, eraTags: ['joseon', 'modern'] })).toBe(false);
    expect(isMemeEligible({ ...base, birth_year: 1879 })).toBe(false);
    expect(isMemeEligible({ ...base, birth_year: null })).toBe(false);
  });
});

describe('formatForRelation', () => {
  it('maps relation types to formats', () => {
    expect(formatForRelation('ALLY')).toBe('feels-bro');
    expect(formatForRelation('FAMILY')).toBe('feels-bro');
    expect(formatForRelation('RIVAL', 0.1)).toBe('virgin-chad');
    expect(formatForRelation('RIVAL', 0.9)).toBe('drake');
    expect(formatForRelation('MENTOR')).toBeNull();
  });
});

describe('parseMemeContent', () => {
  it('validates template captions per format', () => {
    expect(parseMemeContent('template', 'drake', { reject: 'a', prefer: 'b' })).not.toBeNull();
    expect(parseMemeContent('template', 'drake', { reject: '', prefer: 'b' })).toBeNull();
    expect(parseMemeContent('template', 'drake', { reject: 'x'.repeat(91), prefer: 'b' })).toBeNull();
    expect(parseMemeContent('template', 'unknown', { reject: 'a', prefer: 'b' })).toBeNull();
  });

  it('accepts face/hat overrides including auto', () => {
    const c = { top: 'me', bottom: "it's over", faces: ['crying'], hats: ['auto'] };
    expect(parseMemeContent('template', 'its-over', c)).toEqual(c);
    expect(parseMemeContent('template', 'its-over', { ...c, hats: ['crown'] })).toBeNull();
  });

  it('limits virgin/chad traits to 1–4', () => {
    expect(parseMemeContent('template', 'virgin-chad', { virgin: ['a'], chad: ['b', 'c'] })).not.toBeNull();
    expect(parseMemeContent('template', 'virgin-chad', { virgin: [], chad: ['b'] })).toBeNull();
    expect(parseMemeContent('template', 'virgin-chad', { virgin: ['a', 'b', 'c', 'd', 'e'], chad: ['b'] })).toBeNull();
  });

  it('validates translated boxes', () => {
    const box = { x: 0.1, y: 0.1, w: 0.5, h: 0.2, text: 'lol', color: '#ffffff', background: null };
    expect(parseMemeContent('translated', 'translated', { boxes: [box] })).not.toBeNull();
    expect(parseMemeContent('translated', 'translated', { boxes: [{ ...box, color: 'white' }] })).toBeNull();
    expect(parseMemeContent('translated', 'translated', { boxes: [{ ...box, x: 1.5 }] })).toBeNull();
  });
});

describe('FORMAT_DEFS', () => {
  it('has a definition and default faces for every format', () => {
    for (const f of TEMPLATE_FORMATS) {
      expect(FORMAT_DEFS[f].faces.length).toBeGreaterThan(0);
    }
  });
});

describe('clampBox', () => {
  it('keeps boxes inside the image', () => {
    expect(clampBox({ x: 0.9, y: -0.2, w: 0.3, h: 0.1 })).toEqual({ x: 0.7, y: 0, w: 0.3, h: 0.1 });
    expect(clampBox({ x: 0, y: 0, w: 1.4, h: 0 })).toEqual({ x: 0, y: 0, w: 1, h: 0.02 });
  });
});

describe('fitFontSize', () => {
  it('uses the max size for short text in a big box', () => {
    expect(fitFontSize('lol', 800, 200, 72)).toBe(72);
  });

  it('shrinks long text to fit', () => {
    const size = fitFontSize('this is a much longer caption that has to wrap onto several lines', 400, 120, 72);
    expect(size).toBeLessThan(40);
    expect(size).toBeGreaterThanOrEqual(12);
  });

  it('shrinks until an unbreakable long word fits the width', () => {
    expect(fitFontSize('Chilcheollyang', 200, 300, 72)).toBeLessThanOrEqual(200 / (14 * 0.55));
  });
});

describe('translatedSize', () => {
  it('keeps the aspect ratio at 1080px wide', () => {
    expect(translatedSize(800, 600)).toEqual({ width: 1080, height: 810 });
  });

  it('caps extreme heights', () => {
    expect(translatedSize(500, 10000).height).toBe(2400);
    expect(translatedSize(4000, 100).height).toBe(300);
  });
});

describe('parseMemeCursor', () => {
  it('parses "<timestamp>_<uuid>"', () => {
    const id = '4f3c2b1a-0000-4000-8000-000000000000';
    expect(parseMemeCursor(`2026-09-29T10:00:00.123+00:00_${id}`)).toEqual({
      createdAt: '2026-09-29T10:00:00.123+00:00',
      id,
    });
  });

  it('rejects malformed cursors', () => {
    expect(parseMemeCursor('nope')).toBeNull();
    expect(parseMemeCursor('not-a-date_4f3c2b1a-0000-4000-8000-000000000000')).toBeNull();
    expect(parseMemeCursor('2026-09-29T10:00:00Z_1),or(id.gt.0')).toBeNull();
  });
});

describe('GenerateMemeSchema', () => {
  it('accepts manual and auto requests', () => {
    expect(
      GenerateMemeSchema.safeParse({ mode: 'manual', format: 'drake', person_slugs: ['seonjo-yi-yeon'] }).success,
    ).toBe(true);
    expect(GenerateMemeSchema.safeParse({ mode: 'auto', count: 3 }).success).toBe(true);
  });

  it('rejects bad slugs and counts', () => {
    expect(GenerateMemeSchema.safeParse({ mode: 'manual', format: 'drake', person_slugs: ['Yi Sun-sin'] }).success).toBe(
      false,
    );
    expect(GenerateMemeSchema.safeParse({ mode: 'auto', count: 10 }).success).toBe(false);
  });
});

describe('isMemeBucketUrl', () => {
  const base = 'https://abc.supabase.co';

  it('only accepts public URLs in the memes bucket', () => {
    expect(isMemeBucketUrl(`${base}/storage/v1/object/public/memes/sources/x.jpg`, base)).toBe(true);
    expect(isMemeBucketUrl(`${base}/storage/v1/object/public/persons/x.jpg`, base)).toBe(false);
    expect(isMemeBucketUrl('https://evil.example/storage/v1/object/public/memes/x.jpg', base)).toBe(false);
    expect(isMemeBucketUrl(`${base}/storage/v1/object/public/memes/../persons/x.jpg`, base)).toBe(false);
    expect(isMemeBucketUrl(`${base}/storage/v1/object/public/memes/x.jpg`, undefined)).toBe(false);
  });
});

describe('memeName', () => {
  it('drops the dynasty suffix only', () => {
    expect(memeName('Injo of Joseon')).toBe('Injo');
    expect(memeName('Gongmin of Goryeo')).toBe('Gongmin');
    expect(memeName('Jeong Yak-yong (Dasan)')).toBe('Jeong Yak-yong (Dasan)');
    expect(memeName('Sejong the Great')).toBe('Sejong the Great');
  });
});

describe('memeThreadBody', () => {
  it('uses the fact and an AI note for template memes', () => {
    expect(memeThreadBody({ kind: 'template', fact: 'Seonjo fled north.', source_credit: null, source_url: null })).toBe(
      'Seonjo fled north.\n\nMeme generated with AI from the facts above.',
    );
  });

  it('credits the original for translated memes', () => {
    const body = memeThreadBody({
      kind: 'translated',
      fact: 'A joke about exam season.',
      source_credit: '@maker',
      source_url: 'https://example.com/p/1',
    });
    expect(body).toContain('Original Korean meme: @maker — https://example.com/p/1');
    expect(body).toContain('Translated from Korean with AI.');
  });

  it('skips missing parts', () => {
    expect(memeThreadBody({ kind: 'translated', fact: null, source_credit: null, source_url: null })).toBe(
      'Translated from Korean with AI.',
    );
  });
});

describe('UpdateMemeSchema', () => {
  it('accepts a title and figure slugs', () => {
    expect(UpdateMemeSchema.safeParse({ title: 'A title', person_slugs: ['sejong-daewang'] }).success).toBe(true);
  });

  it('rejects empty updates, blank titles and overlong titles', () => {
    expect(UpdateMemeSchema.safeParse({}).success).toBe(false);
    expect(UpdateMemeSchema.safeParse({ title: '   ' }).success).toBe(false);
    expect(UpdateMemeSchema.safeParse({ title: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('memeTranscript', () => {
  it('prints template captions with speaker names', () => {
    expect(memeTranscript('template', 'drake', { reject: 'a', prefer: 'b' }, ['Seonjo']).lines).toEqual([
      'Seonjo rejects: a',
      'Seonjo prefers: b',
    ]);
    expect(
      memeTranscript('template', 'feels-bro', { left: 'l', right: 'r', bottom: 'I know that feel bro' }, ['A', 'B']).lines,
    ).toEqual(['A: l', 'B: r', 'I know that feel bro']);
    expect(memeTranscript('template', 'virgin-chad', { virgin: ['x', 'y'], chad: ['z'] }, ['Injo', 'Gwanghaegun']).lines).toEqual([
      'The Virgin Injo: x; y',
      'The Chad Gwanghaegun: z',
    ]);
  });

  it('orders translated boxes top-to-bottom and keeps the Korean original', () => {
    const box = { w: 0.2, h: 0.1, color: '#ffffff', background: null };
    const t = memeTranscript(
      'translated',
      'translated',
      {
        boxes: [
          { ...box, x: 0.1, y: 0.8, text: 'bottom', ko: '아래' },
          { ...box, x: 0.1, y: 0.1, text: 'top', ko: '위' },
          { ...box, x: 0.5, y: 0.5, text: '  ' },
        ],
      },
      [],
    );
    expect(t).toEqual({ lines: ['top', 'bottom'], original: ['위', '아래'] });
  });

  it('returns nothing for invalid content', () => {
    expect(memeTranscript('template', 'drake', { reject: '' }, [])).toEqual({ lines: [], original: [] });
  });
});

describe('memeAltText', () => {
  it('joins lines and caps the length', () => {
    expect(memeAltText({ lines: ['a', 'b'], original: [] })).toBe('Meme — a / b');
    expect(memeAltText({ lines: ['exam results'], original: ['성적 발표'] })).toBe(
      'Meme — exam results (Original Korean: 성적 발표)',
    );
    expect(memeAltText({ lines: ['x'.repeat(600)], original: [] })).toHaveLength(498);
  });
});

describe('short stories', () => {
  it('validates story content', () => {
    expect(parseMemeContent('story', 'story', { body: 'A twist.' })).toEqual({ body: 'A twist.' });
    expect(parseMemeContent('story', 'story', { body: '  ' })).toBeNull();
    expect(parseMemeContent('story', 'story', { body: 'x'.repeat(1501) })).toBeNull();
  });

  it('posts the story itself, then what is real, then the AI note', () => {
    expect(
      memeThreadBody({ kind: 'story', content: { body: 'Line one.\nTwist.' }, fact: 'The envoys disagreed in 1591.', source_credit: null, source_url: null }),
    ).toBe("Line one.\nTwist.\n\nWhat's real: The envoys disagreed in 1591.\n\nShort fiction written with AI.");
  });

  it('has no image text', () => {
    expect(memeTranscript('story', 'story', { body: 'x' }, ['Seonjo'])).toEqual({ lines: [], original: [] });
  });

  it('accepts story generation requests with one or two figures', () => {
    expect(GenerateMemeSchema.safeParse({ mode: 'story', person_slugs: ['seonjo-yi-yeon'] }).success).toBe(true);
    expect(GenerateMemeSchema.safeParse({ mode: 'story', person_slugs: [] }).success).toBe(false);
  });
});

describe('padBox', () => {
  it('grows the box around its center and stays inside the image', () => {
    const b = padBox({ x: 0.2, y: 0.5, w: 0.6, h: 0.04 });
    expect(b.h).toBeCloseTo(0.06);
    expect(b.y).toBeCloseTo(0.49);
    expect(b.w).toBeCloseTo(0.62);
    expect(b.x).toBeCloseTo(0.19);
    expect(padBox({ x: 0, y: 0.97, w: 1, h: 0.04 }).y + padBox({ x: 0, y: 0.97, w: 1, h: 0.04 }).h).toBeLessThanOrEqual(1);
  });
});

describe('harmonizeFontSizes', () => {
  it('gives same-height boxes the same size and keeps taller boxes bigger', () => {
    // two 40px lines (one long → fits 18px, one short → fits 40px) and an 80px headline
    expect(harmonizeFontSizes([18, 40, 70], [40, 40, 80])).toEqual([18, 18, 36]);
  });

  it('floors at 12, the minimum fitFontSize returns', () => {
    expect(harmonizeFontSizes([30, 10], [40, 40])).toEqual([12, 12]);
    expect(harmonizeFontSizes([], [])).toEqual([]);
  });
});
