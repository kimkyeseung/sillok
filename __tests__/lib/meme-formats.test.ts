import { describe, it, expect } from 'vitest';
import { MEME_FORMATS, TEMPLATE_FORMATS, describeFields, formatGuide, jsonObject, type FieldSpec } from '@/lib/meme-formats';
import { FORMAT_KO } from '@/lib/meme-formats-ko';
import { countLines, fitFontSize, memeTranscript, parseMemeContent, type TemplateFormat } from '@/lib/meme';

// One valid sample per format — also documents the expected content shape
const SAMPLES: Record<TemplateFormat, Record<string, unknown>> = {
  'feels-bro': { left: 'exiled for 18 years', right: 'exiled for 9 years', bottom: 'I know that feel bro' },
  drake: { reject: 'the admiral who never loses', prefer: 'arresting him anyway' },
  'virgin-chad': { virgin: ['lost the fleet'], chad: ['12 ships vs 133'] },
  'its-over': { top: 'me in 1592', bottom: "it's over" },
  review: { place: 'Joseon', stars: 2, when: '1653', body: 'Came for trade, stayed 13 years.' },
  'starter-pack': { title: 'Joseon scholar starter pack', items: ['gat', 'failed exam', 'Zhu Xi opinions'] },
  'tier-list': { title: 'Kings', rows: [{ tier: 'S', items: ['Sejong'] }, { tier: 'A', items: ['Taejong'] }, { tier: 'F', items: ['Injo'] }] },
  'expectation-reality': { expectation: 'office job', reality: 'border fortress' },
  texting: { messages: [{ from: 1, text: 'hey' }, { from: 2, text: 'i still have 12 ships' }] },
  'how-it-started': { started: '1623', going: '1637' },
  'nobody-me': { reaction: 'writes a war diary every day' },
  pov: { pov: 'you told Seonjo there would be no war', bottom: '' },
  'tell-me': { identity: 'a Joseon king', answer: 'my diary is written by someone else' },
};

describe('meme format catalog', () => {
  it('has a sample for every format', () => {
    expect(Object.keys(SAMPLES).sort()).toEqual([...TEMPLATE_FORMATS].sort());
  });

  it.each(TEMPLATE_FORMATS)('%s: sample validates and produces image text', (f) => {
    expect(parseMemeContent('template', f, SAMPLES[f])).not.toBeNull();
    const lines = memeTranscript('template', f, SAMPLES[f], ['A', 'B']).lines;
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach((l) => expect(l.trim()).not.toBe(''));
  });

  it.each(TEMPLATE_FORMATS)('%s: entry is complete (faces, figures, guide, schema)', (f) => {
    const e = MEME_FORMATS[f];
    expect(e.faces.length).toBeGreaterThan(0);
    expect(e.faces.length).toBeLessThanOrEqual(2);
    expect(e.figures.min).toBeLessThanOrEqual(e.figures.max);
    expect(e.guide.structure && e.guide.humor && e.guide.example).toBeTruthy();
    const schema = jsonObject(e.fields) as { required: string[]; additionalProperties: boolean };
    expect(schema.required).toEqual(Object.keys(e.fields));
    expect(schema.additionalProperties).toBe(false);
    expect(formatGuide(f)).toContain(e.label);
  });

  it('rejects content outside the field limits', () => {
    expect(parseMemeContent('template', 'review', { ...SAMPLES.review, stars: 6 })).toBeNull();
    expect(parseMemeContent('template', 'starter-pack', { title: 'x', items: ['a', 'b'] })).toBeNull();
    expect(parseMemeContent('template', 'texting', { messages: [{ from: 3, text: 'x' }, { from: 1, text: 'y' }] })).toBeNull();
    expect(parseMemeContent('template', 'tier-list', { title: 'x', rows: [{ tier: 'S', items: [] }] })).toBeNull();
  });

  it('describes nested fields for prompts', () => {
    const d = describeFields(MEME_FORMATS['tier-list'].fields);
    expect(d).toContain('"rows"');
    expect(d).toContain('  - "tier"');
  });
});

describe('countLines / fitFontSize', () => {
  it('counts wrapped lines and flags words wider than the box', () => {
    expect(countLines('', 500, 20)).toBe(0);
    expect(countLines('short', 500, 20)).toBe(1);
    expect(countLines('one two three four five six seven eight nine ten', 110, 20)).toBeGreaterThan(3);
    expect(countLines('Chilcheollyang', 50, 20)).toBe(Infinity);
  });

  it('fitFontSize uses countLines', () => {
    expect(fitFontSize('', 100, 100, 40)).toBe(40);
    expect(fitFontSize('lol', 800, 200, 72)).toBe(72);
  });
});

describe('Korean admin labels', () => {
  const keys = (fields: Record<string, FieldSpec>): string[] =>
    Object.entries(fields).flatMap(([k, f]) => [k, ...(f.kind === 'rows' ? keys(f.fields) : [])]);

  it.each(TEMPLATE_FORMATS)('%s: has a Korean label, description, structure and every field label', (f) => {
    const ko = FORMAT_KO[f];
    expect(ko.label && ko.description && ko.structure).toBeTruthy();
    for (const k of keys(MEME_FORMATS[f].fields)) expect(ko.fields[k], `${f}.${k}`).toBeTruthy();
  });
});
