import { z } from 'zod';
import { AiError, claudeJson } from './claude';
import { SUBREDDITS, findSubreddit, splitThreadContent } from './promo';
import type { PromoThread } from './promo-data';

// ─── Share kit copy with Claude (server only) ───

const SYSTEM = `You write social media posts that share threads from Sillok (sillok.kr), an English-language community about Korean history and its people.

Principles:
- Value first: each post must be interesting on its own — the joke, the story or the fact — for someone who never clicks through. No sales pitch, no "check out my site", no fake urgency.
- Stay true to the thread. Don't add facts, numbers or quotes that aren't in it or aren't well-documented history.
- Match each platform's native voice. Never include URLs; links are added separately.
- English only. No emoji spam (at most 1–2 where natural, none on Reddit).
- Honesty about who is posting: these posts are published by the people who run Sillok. Never pose as an unaffiliated user who "found" the content ("someone posted this on…", "I stumbled on this site…"). Either don't mention Sillok at all, or say it plainly as our own ("I made this for Sillok, a Korean history site I run"). If the content was written with AI, don't claim it as hand-made research.

Per platform:
- instagram: "caption" = a hook first line, then 2–5 short lines with the history behind it, ending with "Full story: link in bio". "hashtags" = 8–15 relevant tags without "#" (mix of broad like koreanhistory, history, historymemes and specific like joseon or the figure's name). "alt" = a plain description of the image for screen readers (include the words in the image).
- reddit: 1–3 posts, only for subreddits from the list whose fit matches the thread (use the exact name). Follow each subreddit's notes. "title" is the post title; "body" is the text (empty string for image posts unless a short comment helps). Reddit hates marketing — write like a member sharing something interesting, and if Sillok comes up, disclose that it's ours.
- x: "text" under 230 characters (a link will be appended).
- threads: "text" under 450 characters, conversational (a link will be appended).`;

const str = { type: 'string' };
const SCHEMA = {
  type: 'object',
  properties: {
    instagram: {
      type: 'object',
      properties: { caption: str, hashtags: { type: 'array', items: str }, alt: str },
      required: ['caption', 'hashtags', 'alt'],
      additionalProperties: false,
    },
    reddit: {
      type: 'array',
      items: {
        type: 'object',
        properties: { subreddit: str, title: str, body: str },
        required: ['subreddit', 'title', 'body'],
        additionalProperties: false,
      },
    },
    x: { type: 'object', properties: { text: str }, required: ['text'], additionalProperties: false },
    threads: { type: 'object', properties: { text: str }, required: ['text'], additionalProperties: false },
  },
  required: ['instagram', 'reddit', 'x', 'threads'],
  additionalProperties: false,
};

const Output = z.object({
  instagram: z.object({ caption: z.string(), hashtags: z.array(z.string()), alt: z.string() }),
  reddit: z.array(z.object({ subreddit: z.string(), title: z.string(), body: z.string() })),
  x: z.object({ text: z.string() }),
  threads: z.object({ text: z.string() }),
});

export interface GeneratedPromo {
  platform: 'instagram' | 'reddit' | 'x' | 'threads';
  target: string | null;
  title: string | null;
  body: string;
  hashtags: string[];
  alt_text: string | null;
}

/** What kind of thread this is, for subreddit fit */
function threadFit(t: PromoThread): 'meme' | 'story' | 'fact' | 'discussion' {
  if (t.draftKind === 'story') return 'story';
  if (t.draftKind === 'template' || t.draftKind === 'translated') return 'meme';
  return t.image ? 'meme' : 'discussion';
}

export async function generatePromo(t: PromoThread): Promise<GeneratedPromo[]> {
  const { main, real } = splitThreadContent(t.content);
  const fit = threadFit(t);
  const input = [
    `Thread title: ${t.title}`,
    `Thread body:\n${main}`,
    real ? `What's historically real: ${real}` : '',
    t.image ? `The thread has one image. Text in the image: ${t.image.alt ?? '(not described)'}` : 'The thread has no image.',
    t.figures.length ? `Figures: ${t.figures.map((f) => f.name).join(', ')}` : '',
    t.eras.length ? `Era: ${t.eras.join(', ')}` : '',
    `Thread type: ${fit}${t.draftKind ? ' (written with AI and labeled as such on the site)' : ''}`,
    '',
    'Subreddits you may use (name — fit — post type — notes):',
    ...SUBREDDITS.map((s) => `- ${s.name} — ${s.fit} — ${s.postType} — ${s.notes}`),
  ]
    .filter((l) => l !== '')
    .join('\n');

  const raw = await claudeJson({ system: SYSTEM, content: [{ type: 'text', text: input }], schema: SCHEMA, effort: 'medium' });
  const parsed = Output.safeParse(raw);
  if (!parsed.success) throw new AiError('INVALID_OUTPUT', '게시물 문구가 검증을 통과하지 못했습니다.');
  const o = parsed.data;

  const tags = Array.from(
    new Set(o.instagram.hashtags.map((h) => h.replace(/^#/, '').replace(/[^\p{L}\p{N}_]/gu, '')).filter(Boolean)),
  ).slice(0, 30);

  const reddit = o.reddit
    .map((r) => ({ ...r, sub: findSubreddit(r.subreddit) }))
    .filter((r) => r.sub && r.title.trim())
    .slice(0, 3);

  return [
    { platform: 'instagram', target: null, title: null, body: o.instagram.caption.trim().slice(0, 2200), hashtags: tags, alt_text: o.instagram.alt.trim().slice(0, 1000) || null },
    ...reddit.map((r) => ({
      platform: 'reddit' as const,
      target: r.sub!.name,
      title: r.title.trim().slice(0, 300),
      body: r.body.trim().slice(0, 10000),
      hashtags: [],
      alt_text: null,
    })),
    { platform: 'x', target: null, title: null, body: o.x.text.trim().slice(0, 250), hashtags: [], alt_text: null },
    { platform: 'threads', target: null, title: null, body: o.threads.text.trim().slice(0, 470), hashtags: [], alt_text: null },
  ];
}
