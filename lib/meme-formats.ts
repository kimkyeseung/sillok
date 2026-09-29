import { z } from 'zod';
import type { FaceVariant } from './meme';

// ─── Meme format catalog ───
// One entry per format. Everything else is derived from it:
// content validation (zod), Claude's structured-output schema and prompt,
// the admin editor form, and the image text used for alt / search.
// Renderers live in components/meme/MemeCanvas.tsx (server-only).
//
// Adding a format: add an entry here + a case in renderTemplateMeme, then a
// test in __tests__/lib/meme.test.ts. Borrow the *structure* of a meme you
// saw, never its images or wording.

export type FieldSpec =
  | { kind: 'text'; label: string; max: number; optional?: boolean }
  | { kind: 'list'; label: string; min: number; max: number; itemMax: number }
  | { kind: 'int'; label: string; min: number; max: number }
  | { kind: 'rows'; label: string; min: number; max: number; fields: Record<string, FieldSpec> };

export interface FormatEntry {
  label: string;
  /** One line for the admin format picker */
  description: string;
  /** Figures (person_ids) — the first is the subject; a thread needs at least one */
  figures: { min: 1 | 2; max: 1 | 2 };
  /** Default face per face slot (admins can override) */
  faces: FaceVariant[];
  fields: Record<string, FieldSpec>;
  /** For Claude: what the layout is, why it's funny, rules, and a tone example */
  guide: { structure: string; humor: string; rules?: string[]; example: string };
  /** Relation types auto-generation may use this format for */
  autoFor?: ('RIVAL' | 'ALLY' | 'FAMILY')[];
  /** The words in the image, top to bottom (alt text / ImageObject.caption) */
  transcript: (c: Record<string, any>, names: string[]) => string[];
}

const text = (label: string, max: number, optional = false): FieldSpec => ({ kind: 'text', label, max, optional });
const nameOr = (names: string[], i: number, fallback: string) => names[i] ?? fallback;

export const MEME_FORMATS = {
  'feels-bro': {
    label: 'I know that feel bro',
    description: 'Two figures who shared the same hardship or bond',
    figures: { min: 2, max: 2 },
    faces: ['feels', 'feels'],
    fields: { left: text('Figure 1 caption', 80), right: text('Figure 2 caption', 80), bottom: text('Punchline', 60) },
    guide: {
      structure: 'Two figures commiserate. "left" = figure 1 describes a hardship, "right" = figure 2 a parallel one, "bottom" = the punchline.',
      humor: 'Two very different people turn out to share the same miserable experience.',
      rules: ['"bottom" is usually exactly "I know that feel bro" or a close variant.'],
      example: 'left: "Yi Bang-won recited me a poem, then had me killed" / right: "I designed his dad\'s dynasty and he still had me killed"',
    },
    autoFor: ['ALLY', 'FAMILY'],
    transcript: (c, n) => [`${nameOr(n, 0, 'Figure 1')}: ${c.left}`, `${nameOr(n, 1, 'Figure 2')}: ${c.right}`, c.bottom],
  },
  drake: {
    label: 'Reject / Prefer',
    description: 'One figure rejecting one thing and preferring another',
    figures: { min: 1, max: 2 },
    faces: ['angry', 'happy'],
    fields: { reject: text('Rejects', 90), prefer: text('Prefers', 90) },
    guide: {
      structure: 'Figure 1 rejects one option ("reject") and prefers another ("prefer"). Figure 2, if given, is context only.',
      humor: 'The preferred option is the historically worse or ironic choice.',
      example: 'reject: "Keeping the admiral who never loses" / prefer: "Arresting him anyway"',
    },
    autoFor: ['RIVAL'],
    transcript: (c, n) => [`${n[0] ? `${n[0]} ` : ''}rejects: ${c.reject}`, `${n[0] ? `${n[0]} ` : ''}prefers: ${c.prefer}`],
  },
  'virgin-chad': {
    label: 'Virgin vs Chad',
    description: 'Two rivals compared by traits (first = virgin, second = chad)',
    figures: { min: 2, max: 2 },
    faces: ['crying', 'smug'],
    fields: {
      virgin: { kind: 'list', label: 'Virgin traits (figure 1)', min: 1, max: 4, itemMax: 50 },
      chad: { kind: 'list', label: 'Chad traits (figure 2)', min: 1, max: 4, itemMax: 50 },
    },
    guide: {
      structure: 'Figure 1 is "the virgin", figure 2 "the chad". Three short trait bullets each, parallel where possible.',
      humor: 'Deadpan side-by-side contrast; the chad side is effortlessly better.',
      example: 'virgin: "Lost 150 ships at Chilcheollyang" / chad: "12 ships vs 133"',
    },
    autoFor: ['RIVAL'],
    transcript: (c, n) => [
      `The Virgin${n[0] ? ` ${n[0]}` : ''}: ${c.virgin.join('; ')}`,
      `The Chad${n[1] ? ` ${n[1]}` : ''}: ${c.chad.join('; ')}`,
    ],
  },
  'its-over': {
    label: "It's over",
    description: 'A single figure at a low point (war, exile, defeat)',
    figures: { min: 1, max: 2 },
    faces: ['crying'],
    fields: { top: text('Situation (first person)', 90), bottom: text('Punchline', 60) },
    guide: {
      structure: '"top" = the situation in first person ("me when…"), "bottom" = the punchline.',
      humor: 'Overdramatic despair at a real historical low point.',
      rules: ['"bottom" is usually "it\'s over" or a short variant.'],
      example: 'top: "me when the Japanese army reaches Hanseong 20 days after landing"',
    },
    transcript: (c, n) => [n[0] ? `${n[0]}: ${c.top}` : c.top, c.bottom],
  },
  review: {
    label: 'Google review',
    description: 'A figure leaves a star review of a place, dynasty or institution',
    figures: { min: 1, max: 1 },
    faces: ['feels'],
    fields: {
      place: text('Reviewed place/thing', 50),
      stars: { kind: 'int', label: 'Stars (1–5)', min: 1, max: 5 },
      when: text('Visit note (e.g. "1653 · stayed 13 years")', 40, true),
      body: text('Review text', 300),
    },
    guide: {
      structure: 'The figure writes an online review: what they reviewed ("place"), a star rating, an optional visit note, and a short review body.',
      humor: 'Treating a huge historical ordeal like a mildly disappointing hotel stay. Understatement and consumer-review clichés ("would not recommend", "staff were…").',
      rules: ['The body reads like a real review: first person, casual, 2–4 sentences.'],
      example: 'Hamel reviewing "Joseon" — 2 stars, "1653 · stayed 13 years": "Came for trade, got detained. Food was fine."',
    },
    transcript: (c, n) => [
      `${nameOr(n, 0, 'Reviewer')} reviewed ${c.place}: ${c.stars}/5 stars${c.when ? ` (${c.when})` : ''}`,
      c.body,
    ],
  },
  'starter-pack': {
    label: 'Starter pack',
    description: 'The essential items of a type of person or role',
    figures: { min: 1, max: 2 },
    faces: ['smug'],
    fields: {
      title: text('Title (… starter pack)', 60),
      items: { kind: 'list', label: 'Items (3–5)', min: 3, max: 5, itemMax: 40 },
    },
    guide: {
      structure: '"title" names a type of person ("Joseon scholar starter pack"); "items" are 3–5 short things everyone of that type has or does.',
      humor: 'Recognisable, slightly embarrassing specifics that are historically real.',
      rules: ['Items are noun phrases, not sentences.'],
      example: 'Joseon scholar starter pack: "a gat you can see through", "failed the civil exam twice", "strong opinions on Zhu Xi"',
    },
    transcript: (c) => [c.title, ...c.items],
  },
  'tier-list': {
    label: 'Tier list',
    description: 'Rank people or things from S to F',
    figures: { min: 1, max: 2 },
    faces: ['smug'],
    fields: {
      title: text('Title', 60),
      rows: {
        kind: 'rows',
        label: 'Tiers',
        min: 3,
        max: 6,
        fields: {
          tier: text('Tier', 3),
          items: { kind: 'list', label: 'Entries', min: 1, max: 4, itemMax: 28 },
        },
      },
    },
    guide: {
      structure: '"title" names what is ranked; "rows" go from best to worst (usually S, A, B, C, D, F) with 1–4 short entries each.',
      humor: 'Confident, opinionated rankings with one or two surprising placements that are defensible from history.',
      rules: ['Entries are short names (under 28 characters).', 'The subject figure should appear in the list or be the one ranking.'],
      example: 'Joseon kings\' foreign policy: S "Sejong", A "Gwanghaegun", F "Injo", F "Seonjo (1592 edition)"',
    },
    transcript: (c) => [c.title, ...c.rows.map((r: { tier: string; items: string[] }) => `${r.tier}: ${r.items.join(', ')}`)],
  },
  'expectation-reality': {
    label: 'Expectation vs Reality',
    description: 'What a figure expected versus what actually happened',
    figures: { min: 1, max: 2 },
    faces: ['happy', 'crying'],
    fields: { expectation: text('Expectation', 90), reality: text('Reality', 90) },
    guide: {
      structure: 'Two panels: what figure 1 expected, and what really happened.',
      humor: 'The gap between a hopeful plan and the historically documented outcome.',
      example: 'expectation: "Passing the civil exam means a comfortable office job" / reality: "Posted to a border fortress"',
    },
    transcript: (c) => [`Expectation: ${c.expectation}`, `Reality: ${c.reality}`],
  },
  texting: {
    label: 'Text messages',
    description: 'A fictional chat between two figures',
    figures: { min: 2, max: 2 },
    faces: ['feels', 'feels'],
    fields: {
      messages: {
        kind: 'rows',
        label: 'Messages',
        min: 2,
        max: 8,
        fields: {
          from: { kind: 'int', label: 'From (1 = figure 1, 2 = figure 2)', min: 1, max: 2 },
          text: text('Message', 120),
        },
      },
    },
    guide: {
      structure: 'A phone chat between figure 1 (the sender, right side) and figure 2 (left side). 3–7 short messages; "from" is 1 or 2.',
      humor: 'Historical events retold as awkward modern texting: left on read, passive-aggressive replies, one-word answers.',
      rules: ['Lowercase casual texting is fine.', 'The last message lands the joke.'],
      example: 'Seonjo: "hey so we need to talk" / Yi Sun-sin: "is this about the attack order" / Seonjo: "you\'re fired" / Yi Sun-sin: "i still have 12 ships"',
    },
    autoFor: ['RIVAL', 'ALLY'],
    transcript: (c, n) =>
      c.messages.map((m: { from: number; text: string }) => `${nameOr(n, m.from - 1, `Person ${m.from}`)}: ${m.text}`),
  },
  'how-it-started': {
    label: "How it started / How it's going",
    description: 'The same figure at the start and later',
    figures: { min: 1, max: 2 },
    faces: ['happy', 'crying'],
    fields: { started: text('How it started', 70), going: text("How it's going", 70) },
    guide: {
      structure: 'Two panels: the beginning of something and how it turned out, same figure.',
      humor: 'A dramatic reversal of fortune between two real moments.',
      example: 'started: "1623: overthrew my uncle to save Ming loyalty" / going: "1637: bowing nine times to the Qing"',
    },
    transcript: (c) => [`How it started: ${c.started}`, `How it's going: ${c.going}`],
  },
  'nobody-me': {
    label: 'Nobody: / Me:',
    description: 'A figure doing something wildly unprompted',
    figures: { min: 1, max: 2 },
    faces: ['smug'],
    fields: { reaction: text('What the figure does, unprompted', 100) },
    guide: {
      structure: 'Fixed "Nobody:" line, then the figure\'s name and what they did without anyone asking ("reaction").',
      humor: 'An absurdly excessive action that is actually documented.',
      example: 'reaction: "writes a daily war diary for seven years straight"',
    },
    transcript: (c, n) => ['Nobody:', `${nameOr(n, 0, 'Me')}: ${c.reaction}`],
  },
  pov: {
    label: 'POV',
    description: 'A one-line scene from someone\'s point of view',
    figures: { min: 1, max: 2 },
    faces: ['feels'],
    fields: { pov: text('POV: … (without "POV:")', 110), bottom: text('Bottom caption (optional)', 60, true) },
    guide: {
      structure: '"pov" is a one-line scene the reader is put into (written without the "POV:" prefix); the face is the figure\'s reaction.',
      humor: 'Putting the reader inside a specific, awkward historical moment.',
      example: 'pov: "you\'re the official who has to tell Yeonsangun the budget is gone"',
    },
    transcript: (c) => [`POV: ${c.pov}`, ...(c.bottom ? [c.bottom] : [])],
  },
  'tell-me': {
    label: 'Tell me without telling me',
    description: '"Tell me you\'re X without telling me you\'re X"',
    figures: { min: 1, max: 2 },
    faces: ['smug'],
    fields: { identity: text('Identity (e.g. "a Joseon king")', 50), answer: text("Figure's answer", 140) },
    guide: {
      structure: 'Top line is fixed: "Tell me you\'re {identity} without telling me you\'re {identity}". The figure replies ("answer").',
      humor: 'The answer gives the identity away completely through one specific, true detail.',
      example: 'identity: "a Joseon king" / answer: "my diary is written by someone else and I\'m not allowed to read it"',
    },
    transcript: (c, n) => [
      `Tell me you're ${c.identity} without telling me you're ${c.identity}`,
      `${nameOr(n, 0, 'Reply')}: ${c.answer}`,
    ],
  },
} satisfies Record<string, FormatEntry>;

export type TemplateFormat = keyof typeof MEME_FORMATS;
export const TEMPLATE_FORMATS = Object.keys(MEME_FORMATS) as [TemplateFormat, ...TemplateFormat[]];

export const formatEntry = (f: TemplateFormat): FormatEntry => MEME_FORMATS[f];

// ─── Derived: zod validation ───

function zodFor(f: FieldSpec): z.ZodTypeAny {
  switch (f.kind) {
    case 'text':
      return f.optional ? z.string().trim().max(f.max).optional() : z.string().trim().min(1).max(f.max);
    case 'list':
      return z.array(z.string().trim().min(1).max(f.itemMax)).min(f.min).max(f.max);
    case 'int':
      return z.number().int().min(f.min).max(f.max);
    case 'rows':
      return z.array(z.object(zodShape(f.fields))).min(f.min).max(f.max);
  }
}

export function zodShape(fields: Record<string, FieldSpec>) {
  return Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, zodFor(f)]));
}

// ─── Derived: JSON schema for Claude structured outputs (all keys required) ───

function jsonFor(f: FieldSpec): Record<string, unknown> {
  switch (f.kind) {
    case 'text':
      return { type: 'string' };
    case 'list':
      return { type: 'array', items: { type: 'string' } };
    case 'int':
      return { type: 'integer' };
    case 'rows':
      return { type: 'array', items: jsonObject(f.fields) };
  }
}

export function jsonObject(fields: Record<string, FieldSpec>): Record<string, unknown> {
  return {
    type: 'object',
    properties: Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, jsonFor(f)])),
    required: Object.keys(fields),
    additionalProperties: false,
  };
}

/** Human-readable field list for prompts and the /write-meme skill */
export function describeFields(fields: Record<string, FieldSpec>, indent = ''): string {
  return Object.entries(fields)
    .map(([k, f]) => {
      const head = `${indent}- "${k}": ${f.label}`;
      switch (f.kind) {
        case 'text':
          return `${head} (text, max ${f.max} chars${f.optional ? ', "" if unused' : ''})`;
        case 'list':
          return `${head} (${f.min}–${f.max} items, each max ${f.itemMax} chars)`;
        case 'int':
          return `${head} (integer ${f.min}–${f.max})`;
        case 'rows':
          return `${head} (${f.min}–${f.max} rows, each:)\n${describeFields(f.fields, `${indent}  `)}`;
      }
    })
    .join('\n');
}

/** Prompt block explaining one format to Claude */
export function formatGuide(key: TemplateFormat): string {
  const e = formatEntry(key);
  return [
    `Format "${e.label}": ${e.guide.structure}`,
    `Why it's funny: ${e.guide.humor}`,
    ...(e.guide.rules ?? []).map((r) => `Rule: ${r}`),
    `Tone example (do not reuse): ${e.guide.example}`,
    'Fields:',
    describeFields(e.fields),
  ].join('\n');
}
