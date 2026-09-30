import { z } from 'zod';
import {
  MEME_TITLE_MAX,
  StoryContentSchema,
  TEMPLATE_CONTENT_SCHEMAS,
  padBox,
  type StoryContent,
  type TemplateContent,
  type TemplateFormat,
  type TextBox,
} from './meme';
import type { MemeEventInfo, MemeFigureInfo } from './meme-data';
import { formatEntry, formatGuide, jsonObject } from './meme-formats';
import { AiError as MemeAiError, claudeJson as callJson } from './claude';

// ─── Claude calls for AI Drafts (server only) — shared call in lib/claude.ts ───

export { AiError as MemeAiError } from './claude';

// ─── 1. Captions for wojak templates ───

const CAPTION_SYSTEM = `You write captions for wojak-style memes about Korean historical figures, published on Sillok, an English-language Korean history community.

The humor must come from real, well-documented historical facts: irony, reversals of fortune, famous rivalries, absurd-but-true details. A reader who looks up the fact should find the joke accurate.

Rules:
- English only. Casual internet-meme voice; lowercase is fine. Keep every caption short (at most ~12 words; traits at most ~7 words).
- Every joke must be grounded in facts from the input or widely known history of these figures. Never invent events, quotes, or numbers.
- Punch at situations, decisions, and irony — never at ethnicity, religion, disability, or at victims of massacres, war crimes, or sexual violence. No sexual content. Don't make light of mass civilian deaths.
- Use romanized names as given in the input.
- If there is no genuinely funny, fact-based angle, set "skip" to true (fill the other fields with empty strings/lists).
- "fact" is one or two plain sentences stating the historical fact the joke is based on. It becomes the body of the community post.
- "title" is the title of the community post that carries the meme: a short, natural English post title (max ~90 characters) that teases the joke without repeating the captions, e.g. "Seonjo's 1597 personnel decisions, summarized". No hashtags, no emoji.`;

const str = { type: 'string' };

function captionSchema(format: TemplateFormat) {
  return {
    type: 'object',
    properties: {
      skip: { type: 'boolean' },
      title: str,
      fact: str,
      captions: jsonObject(formatEntry(format).fields),
    },
    required: ['skip', 'title', 'fact', 'captions'],
    additionalProperties: false,
  };
}

function describeFigure(f: MemeFigureInfo, i: number): string {
  const years = `${f.birth_year ?? '?'}–${f.death_year ?? '?'}`;
  return `Figure ${i + 1}: ${f.name} (${years}). ${f.summary ?? ''}`.trim();
}

export async function generateCaptions(input: {
  format: TemplateFormat;
  figures: MemeFigureInfo[];
  relation?: { relation_type: string; description: string | null } | null;
  event?: MemeEventInfo | null;
}): Promise<{ content: TemplateContent; fact: string; title: string }> {
  const lines = [
    formatGuide(input.format),
    '',
    ...input.figures.map(describeFigure),
    input.relation
      ? `Relation between figure 1 and figure 2: ${input.relation.relation_type}${input.relation.description ? ` — ${input.relation.description}` : ''}`
      : '',
    input.event
      ? `Event: ${input.event.title}${input.event.year ? ` (${input.event.year})` : ''}${input.event.description ? ` — ${input.event.description}` : ''}`
      : '',
  ].filter(Boolean);

  const raw = (await callJson({
    system: CAPTION_SYSTEM,
    content: [{ type: 'text', text: lines.join('\n') }],
    schema: captionSchema(input.format),
    effort: 'medium',
  })) as { skip?: boolean; title?: string; fact?: string; captions?: unknown };

  if (raw.skip) throw new MemeAiError('SKIPPED', '이 인물들로는 사실에 근거한 농담을 찾지 못했습니다.');
  const parsed = TEMPLATE_CONTENT_SCHEMAS[input.format].safeParse(raw.captions);
  if (!parsed.success) throw new MemeAiError('INVALID_OUTPUT', '캡션이 검증을 통과하지 못했습니다 (너무 길거나 비어 있음).');
  return {
    content: parsed.data,
    fact: (raw.fact ?? '').trim().slice(0, 500),
    title: (raw.title ?? '').trim().slice(0, MEME_TITLE_MAX),
  };
}

// ─── 2. Translate a Korean meme image ───

const TRANSLATE_SYSTEM = `You localize Korean internet memes (짤) into English for an English-speaking audience interested in Korea.

Given one meme image:
1. Find every region of Korean text that is part of the meme (captions, speech bubbles, labels, subtitles). Ignore watermarks, usernames, channel logos, and site URLs — report those in "credit_hint" instead.
2. For each region return a bounding box as fractions of the image size: x, y = top-left corner, w, h = width and height (all between 0 and 1). The box must fully cover the Korean text with a small margin, because English text will be drawn over it.
3. Translate the meaning, not word for word. Keep the joke landing in English: use natural English meme phrasing, keep the tone (sarcastic, deadpan, dramatic). Render Korean internet slang with its English equivalent (ㅋㅋㅋ → lol / lmao, ㅠㅠ → crying, 실화냐 → is this real, etc.). Keep the English about the same length as the original so it fits the box.
4. "text_color" = the original text color as #RRGGBB. "background" = the flat fill color directly behind the text as #RRGGBB when the text sits on a solid area (caption bar, speech bubble, subtitle box), or "none" when it sits on a photo/busy background (the English will be drawn as outlined meme text instead).
5. "summary" = one or two English sentences explaining the meme and any Korean cultural context a foreign reader needs. It becomes the body of the community post.
6. "title" = a short, natural English post title for sharing this meme (max ~90 characters). No hashtags, no emoji.
7. If the image has no Korean text to translate, return an empty "boxes" list.`;

const num = { type: 'number' };
const TRANSLATE_SCHEMA = {
  type: 'object',
  properties: {
    title: str,
    summary: str,
    credit_hint: str,
    boxes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { x: num, y: num, w: num, h: num, ko: str, en: str, text_color: str, background: str },
        required: ['x', 'y', 'w', 'h', 'ko', 'en', 'text_color', 'background'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'summary', 'credit_hint', 'boxes'],
  additionalProperties: false,
};

const RawBoxes = z.object({
  title: z.string(),
  summary: z.string(),
  credit_hint: z.string(),
  boxes: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
      ko: z.string(),
      en: z.string(),
      text_color: z.string(),
      background: z.string(),
    }),
  ),
});

const HEX = /^#[0-9a-fA-F]{6}$/;

export async function translateMemeImage(imageUrl: string): Promise<{
  boxes: TextBox[];
  title: string;
  summary: string;
  creditHint: string;
}> {
  const raw = await callJson({
    system: TRANSLATE_SYSTEM,
    content: [
      { type: 'image', source: { type: 'url', url: imageUrl } },
      { type: 'text', text: 'Translate this meme.' },
    ],
    schema: TRANSLATE_SCHEMA,
    effort: 'high',
  });
  const parsed = RawBoxes.safeParse(raw);
  if (!parsed.success) throw new MemeAiError('INVALID_OUTPUT', '번역 결과가 검증을 통과하지 못했습니다.');

  const boxes: TextBox[] = parsed.data.boxes
    .filter((b) => b.en.trim())
    .slice(0, 24)
    .map((b) => {
      const bg = b.background.toLowerCase();
      return padBox({
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        text: b.en.trim().slice(0, 240),
        ko: b.ko.slice(0, 400),
        color: HEX.test(b.text_color) ? b.text_color : '#111111',
        background: HEX.test(bg) ? bg : null,
      });
    })
    .map((b) => (b.background === null && b.color.toLowerCase() === '#000000' ? { ...b, color: '#ffffff' } : b));

  return {
    boxes,
    title: parsed.data.title.trim().slice(0, MEME_TITLE_MAX),
    summary: parsed.data.summary.trim().slice(0, 500),
    creditHint: parsed.data.credit_hint.trim().slice(0, 120),
  };
}

// ─── 3. Twist-ending short fiction ("one-tweet story") ───

const STORY_SYSTEM = `You write very short humorous fiction about Korean historical figures for Sillok, an English-language Korean history community. The style is the "one-tweet novel": a few lines of scene-setting and dialogue that read straight, then a final line that flips the meaning — the reader realizes something ironic about the narrator or the situation.

Rules:
- English only. 40–120 words. Short lines, mostly dialogue. First person works well.
- The setup must be built on real, well-documented history (people, dates, decisions). The punchline can be invented dialogue, but it must follow from that history — don't invent events.
- The twist lands in the last line. Don't explain the joke.
- Punch at irony, vanity, bad decisions and bureaucracy — never at ethnicity, religion, disability, or victims of massacres, war crimes or sexual violence. No sexual content. Don't make light of mass civilian deaths or of executions of children.
- "title": a short post title (max ~70 characters) that sets up the scene without spoiling the twist.
- "fact": one or two sentences stating what is historically true in the story, and which part is invented.
- If there is no good fact-based twist, set "skip" to true (other fields empty).`;

const STORY_SCHEMA = {
  type: 'object',
  properties: { skip: { type: 'boolean' }, title: str, story: str, fact: str },
  required: ['skip', 'title', 'story', 'fact'],
  additionalProperties: false,
};

export async function generateStory(input: {
  figures: MemeFigureInfo[];
  relation?: { relation_type: string; description: string | null } | null;
  event?: MemeEventInfo | null;
}): Promise<{ content: StoryContent; fact: string; title: string }> {
  const lines = [
    ...input.figures.map(describeFigure),
    input.relation
      ? `Relation between figure 1 and figure 2: ${input.relation.relation_type}${input.relation.description ? ` — ${input.relation.description}` : ''}`
      : '',
    input.event
      ? `Event: ${input.event.title}${input.event.year ? ` (${input.event.year})` : ''}${input.event.description ? ` — ${input.event.description}` : ''}`
      : '',
  ].filter(Boolean);

  const raw = (await callJson({
    system: STORY_SYSTEM,
    content: [{ type: 'text', text: lines.join('\n') }],
    schema: STORY_SCHEMA,
    effort: 'high',
  })) as { skip?: boolean; title?: string; story?: string; fact?: string };

  if (raw.skip) throw new MemeAiError('SKIPPED', '이 인물들로는 사실에 근거한 반전을 찾지 못했습니다.');
  const parsed = StoryContentSchema.safeParse({ body: raw.story });
  if (!parsed.success || !raw.title?.trim()) throw new MemeAiError('INVALID_OUTPUT', '소설이 검증을 통과하지 못했습니다.');
  return {
    content: parsed.data,
    fact: (raw.fact ?? '').trim().slice(0, 500),
    title: raw.title.trim().slice(0, MEME_TITLE_MAX),
  };
}
