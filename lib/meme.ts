import { z } from 'zod';

// ─── Meme generator — pure logic (tested) ───
// Two kinds:
//   template   → wojak faces + captions composed by /api/og/meme/[id]
//   translated → an uploaded Korean meme with English text boxes laid over it

export const FACE_VARIANTS = ['feels', 'crying', 'smug', 'angry', 'happy', 'npc'] as const;
export type FaceVariant = (typeof FACE_VARIANTS)[number];

export const HAT_TYPES = ['ikseongwan', 'gat', 'helmet', 'topknot', 'none'] as const;
export type HatType = (typeof HAT_TYPES)[number];

export const TEMPLATE_FORMATS = ['feels-bro', 'drake', 'virgin-chad', 'its-over'] as const;
export type TemplateFormat = (typeof TEMPLATE_FORMATS)[number];

export const MEME_STATUSES = ['draft', 'published', 'rejected'] as const;
export type MemeStatus = (typeof MEME_STATUSES)[number];

interface FormatDef {
  label: string;
  /** Number of figures (person_ids length) */
  figures: number;
  /** Default face per slot */
  faces: FaceVariant[];
  description: string;
}

export const FORMAT_DEFS: Record<TemplateFormat, FormatDef> = {
  'feels-bro': {
    label: 'I know that feel bro',
    figures: 2,
    faces: ['feels', 'feels'],
    description: 'Two figures who shared the same hardship or bond',
  },
  drake: {
    label: 'Reject / Prefer',
    figures: 1,
    faces: ['angry', 'happy'],
    description: 'One figure rejecting one thing and preferring another',
  },
  'virgin-chad': {
    label: 'Virgin vs Chad',
    figures: 2,
    faces: ['crying', 'smug'],
    description: 'Two rivals compared by traits (first = virgin, second = chad)',
  },
  'its-over': {
    label: "It's over",
    figures: 1,
    faces: ['crying'],
    description: 'A single figure at a low point (war, exile, defeat, death)',
  },
};

// ─── Content schemas ───

const line = (max: number) => z.string().trim().min(1).max(max);
const overrides = {
  faces: z.array(z.enum(FACE_VARIANTS)).max(2).optional(),
  /** 'auto' = headwear from the figure's FIELD tags */
  hats: z.array(z.enum([...HAT_TYPES, 'auto'])).max(2).optional(),
};

export const TEMPLATE_CONTENT_SCHEMAS = {
  'feels-bro': z.object({ left: line(80), right: line(80), bottom: line(60), ...overrides }),
  drake: z.object({ reject: line(90), prefer: line(90), ...overrides }),
  'virgin-chad': z.object({
    virgin: z.array(line(50)).min(1).max(4),
    chad: z.array(line(50)).min(1).max(4),
    ...overrides,
  }),
  'its-over': z.object({ top: line(90), bottom: line(60), ...overrides }),
} satisfies Record<TemplateFormat, z.ZodTypeAny>;

export type TemplateContent<F extends TemplateFormat = TemplateFormat> = z.infer<
  (typeof TEMPLATE_CONTENT_SCHEMAS)[F]
>;

const HEX = /^#[0-9a-fA-F]{6}$/;

export const TextBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0.02).max(1),
  h: z.number().min(0.02).max(1),
  text: z.string().trim().max(240),
  /** Original Korean text (reference only, never rendered) */
  ko: z.string().max(400).optional(),
  color: z.string().regex(HEX),
  /** Fill behind the text to cover the Korean original; null = outlined text, no fill */
  background: z.string().regex(HEX).nullable(),
});
export type TextBox = z.infer<typeof TextBoxSchema>;

export const TranslatedContentSchema = z.object({
  boxes: z.array(TextBoxSchema).max(24),
});
export type TranslatedContent = z.infer<typeof TranslatedContentSchema>;

/** Validate content for a meme's kind/format. Returns the parsed content or null. */
export function parseMemeContent(kind: 'template' | 'translated', format: string, content: unknown) {
  if (kind === 'translated') {
    const r = TranslatedContentSchema.safeParse(content);
    return r.success ? r.data : null;
  }
  if (!isTemplateFormat(format)) return null;
  const r = TEMPLATE_CONTENT_SCHEMAS[format].safeParse(content);
  return r.success ? r.data : null;
}

export function isTemplateFormat(v: string): v is TemplateFormat {
  return (TEMPLATE_FORMATS as readonly string[]).includes(v);
}

/** Keep a box inside the image (x+w ≤ 1, y+h ≤ 1) */
export function clampBox<T extends { x: number; y: number; w: number; h: number }>(b: T): T {
  const w = Math.min(Math.max(b.w, 0.02), 1);
  const h = Math.min(Math.max(b.h, 0.02), 1);
  return {
    ...b,
    w,
    h,
    x: Math.min(Math.max(b.x, 0), 1 - w),
    y: Math.min(Math.max(b.y, 0), 1 - h),
  };
}

// ─── Figure → hat / eligibility ───

/** FIELD tag slugs (tags.name_en) → headwear */
export function pickHat(fieldTags: string[]): HatType {
  const t = new Set(fieldTags.map((s) => s.toLowerCase()));
  if (t.has('king')) return 'ikseongwan';
  if (t.has('general')) return 'helmet';
  if (t.has('religious')) return 'none'; // monks: shaved head
  if (t.has('scholar') || t.has('politician')) return 'gat';
  return 'topknot';
}

/** Modern figures are excluded — memes about real recent people risk defamation */
export const MEME_MAX_BIRTH_YEAR = 1850;

export function isMemeEligible(p: {
  birth_year: number | null;
  is_alive: boolean | null;
  eraTags: string[];
}): boolean {
  if (p.is_alive) return false;
  if (p.eraTags.some((t) => t.toLowerCase() === 'modern')) return false;
  if (p.birth_year === null || p.birth_year > MEME_MAX_BIRTH_YEAR) return false;
  return true;
}

/** Relation type → template format for auto-generation */
export function formatForRelation(relationType: string, seed = Math.random()): TemplateFormat | null {
  switch (relationType) {
    case 'ALLY':
    case 'FAMILY':
      return 'feels-bro';
    case 'RIVAL':
      return seed < 0.5 ? 'virgin-chad' : 'drake';
    default:
      return null;
  }
}

/** Short label for memes: "Injo of Joseon" → "Injo" (the era is obvious from context) */
export function memeName(name: string): string {
  return name.replace(/\s+of\s+(Joseon|Goryeo|Silla|Unified Silla|Baekje|Goguryeo|Gaya|Balhae|Gojoseon)$/i, '').trim() || name;
}

// ─── Text fitting (satori has no auto-fit) ───

/**
 * Largest font size (px) at which `text` wraps into a w×h box.
 * Approximates glyph width as 0.55em (sans-serif average) and line height 1.15em.
 */
export function fitFontSize(text: string, w: number, h: number, max = 72, min = 12): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return max;
  for (let size = max; size > min; size -= 2) {
    const perLine = Math.max(1, Math.floor(w / (size * 0.55)));
    let lines = 1;
    let used = 0;
    for (const word of words) {
      const len = word.length;
      if (len > perLine) {
        // An unbreakable word wider than the box never fits at this size
        lines = Infinity;
        break;
      }
      const next = used === 0 ? len : used + 1 + len;
      if (next > perLine) {
        lines++;
        used = len;
      } else {
        used = next;
      }
    }
    if (lines * size * 1.15 <= h) return size;
  }
  return min;
}

/** Output size of a translated meme: 1080px wide, source aspect ratio, height capped */
export function translatedSize(srcW: number, srcH: number): { width: number; height: number } {
  const width = 1080;
  const ratio = srcH > 0 && srcW > 0 ? srcH / srcW : 1;
  return { width, height: Math.round(Math.min(Math.max(width * ratio, 300), 2400)) };
}

// ─── Admin list cursor ───

export const MemeListSchema = z.object({
  status: z.enum(MEME_STATUSES).optional(),
  cursor: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Cursor = "<created_at>_<id>" */
export function parseMemeCursor(cursor: string): { createdAt: string; id: string } | null {
  const i = cursor.lastIndexOf('_');
  if (i <= 0) return null;
  const createdAt = cursor.slice(0, i);
  const id = cursor.slice(i + 1);
  if (Number.isNaN(Date.parse(createdAt))) return null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return { createdAt, id };
}

// ─── Threads ───
// A published meme is a regular thread: title + body + the rendered PNG.

/** Same limit as thread titles (POST /api/threads) */
export const MEME_TITLE_MAX = 200;

/** Thread body for a published meme (threads render plain text) */
export function memeThreadBody(m: {
  kind: 'template' | 'translated';
  fact: string | null;
  source_credit: string | null;
  source_url: string | null;
}): string {
  const parts: string[] = [];
  if (m.fact?.trim()) parts.push(m.fact.trim());
  if (m.kind === 'translated') {
    const credit = m.source_credit?.trim();
    const url = m.source_url?.trim();
    if (credit || url) parts.push(`Original Korean meme: ${[credit, url].filter(Boolean).join(' — ')}`);
    parts.push('Translated from Korean with AI.');
  } else {
    parts.push('Meme generated with AI from the facts above.');
  }
  return parts.join('\n\n');
}

// ─── Request schemas ───

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const GenerateMemeSchema = z.union([
  z.object({
    mode: z.literal('manual'),
    format: z.enum(TEMPLATE_FORMATS),
    person_slugs: z.array(slug).min(1).max(2),
    event_slug: slug.optional(),
  }),
  z.object({
    mode: z.literal('auto'),
    count: z.number().int().min(1).max(5),
  }),
]);

export const TranslateMemeSchema = z.object({
  image_url: z.string().url(),
  /** Figures the thread is posted under (a thread needs at least one to publish) */
  person_slugs: z.array(slug).max(3).optional(),
  width: z.number().int().min(50).max(8000),
  height: z.number().int().min(50).max(8000),
  source_url: z.string().url().max(500).optional(),
  source_credit: z.string().trim().max(120).optional(),
});

export const UpdateMemeSchema = z
  .object({
    title: z.string().trim().min(1).max(MEME_TITLE_MAX).optional(),
    content: z.unknown().optional(),
    /** Translated memes only: figures the thread is posted under */
    person_slugs: z.array(slug).max(3).optional(),
    fact: z.string().trim().max(500).nullable().optional(),
    status: z.enum(MEME_STATUSES).optional(),
    source_url: z.string().url().max(500).nullable().optional(),
    source_credit: z.string().trim().max(120).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });

/** Only images we host in the memes bucket are sent to the vision model / renderer */
export function isMemeBucketUrl(url: string, supabaseUrl: string | undefined): boolean {
  if (!supabaseUrl) return false;
  const prefix = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/memes/`;
  return url.startsWith(prefix) && !url.slice(prefix.length).includes('..');
}

// ─── Text inside the image ───
// The PNG's words are invisible to search engines and screen readers, so a
// posted meme stores them as the thread image's alt (→ <img alt>, ImageObject.caption).

export interface MemeTranscript {
  /** English text as it appears in the image, top to bottom */
  lines: string[];
  /** Translated memes: the original Korean text */
  original: string[];
}

export function memeTranscript(
  kind: 'template' | 'translated',
  format: string,
  content: unknown,
  names: string[],
): MemeTranscript {
  const parsed = parseMemeContent(kind, format, content);
  if (!parsed) return { lines: [], original: [] };
  const who = (i: number, text: string) => (names[i] ? `${names[i]}: ${text}` : text);

  if (kind === 'translated') {
    const boxes = [...(parsed as TranslatedContent).boxes]
      .filter((b) => b.text.trim())
      .sort((a, b) => a.y - b.y || a.x - b.x);
    return {
      lines: boxes.map((b) => b.text.trim()),
      original: boxes.map((b) => b.ko?.trim() ?? '').filter(Boolean),
    };
  }

  switch (format as TemplateFormat) {
    case 'feels-bro': {
      const c = parsed as TemplateContent<'feels-bro'>;
      return { lines: [who(0, c.left), who(1, c.right), c.bottom], original: [] };
    }
    case 'drake': {
      const c = parsed as TemplateContent<'drake'>;
      const p = names[0] ? `${names[0]} ` : '';
      return { lines: [`${p}rejects: ${c.reject}`.trim(), `${p}prefers: ${c.prefer}`.trim()], original: [] };
    }
    case 'virgin-chad': {
      const c = parsed as TemplateContent<'virgin-chad'>;
      const label = (l: string, i: number) => `The ${l}${names[i] ? ` ${names[i]}` : ''}`;
      return { lines: [`${label('Virgin', 0)}: ${c.virgin.join('; ')}`, `${label('Chad', 1)}: ${c.chad.join('; ')}`], original: [] };
    }
    case 'its-over': {
      const c = parsed as TemplateContent<'its-over'>;
      return { lines: [who(0, c.top), c.bottom], original: [] };
    }
    default:
      return { lines: [], original: [] };
  }
}

/**
 * Image alt text: "Meme — line / line" plus the Korean original for translated
 * memes (≤ 500 chars).
 */
export function memeAltText(t: MemeTranscript): string {
  let text = `Meme — ${t.lines.join(' / ')}`;
  if (t.original.length) text += ` (Original Korean: ${t.original.join(' / ')})`;
  return text.length > 500 ? `${text.slice(0, 497)}…` : text;
}
