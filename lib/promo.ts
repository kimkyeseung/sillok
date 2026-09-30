import { z } from 'zod';

// ─── Share kit — pure logic (tested) ───
// Social copy per thread, platform-sized images, UTM links, posting records.
// Posting itself is manual: Reddit bans automated self-promotion, and
// Instagram auto-publishing needs a Meta app review (phase 2).

export const PROMO_PLATFORMS = ['instagram', 'reddit', 'x', 'threads'] as const;
export type PromoPlatform = (typeof PROMO_PLATFORMS)[number];

/** note = tip shown in the admin Share kit (Korean; admin UI only) */
export const PLATFORM_INFO: Record<PromoPlatform, { label: string; max: number; note: string }> = {
  instagram: {
    label: 'Instagram',
    max: 2200,
    note: '캡션의 링크는 눌리지 않으니 프로필 링크로 안내하세요. 캐러셀(표지·역사·안내 3장)로 올리세요.',
  },
  reddit: {
    label: 'Reddit',
    max: 10000,
    note: '홍보 문구가 아니라 콘텐츠 자체를 올리세요. 대부분의 서브레딧은 자기홍보를 삭제하니 사이드바 규칙을 먼저 읽으세요.',
  },
  x: { label: 'X', max: 280, note: '링크는 23자로 계산됩니다. 표지 이미지를 첨부하세요.' },
  threads: { label: 'Threads', max: 500, note: '표지 이미지를 첨부하고, 링크는 답글에 달아도 됩니다.' },
};

export interface SubredditInfo {
  name: string;
  /** What kind of thread fits */
  fit: 'meme' | 'story' | 'fact' | 'discussion';
  /** Posting advice for Claude's prompt (English) — rules change, so admins verify before posting */
  notes: string;
  /** Same advice for the admin UI */
  notesKo: string;
  postType: 'image' | 'text' | 'link';
}

export const SUBREDDITS: SubredditInfo[] = [
  {
    name: 'HistoryMemes',
    notesKo: '밈만 가능, 20년 이상 지난 사건만. 이미지를 직접 올리고 제목에 링크를 넣지 마세요.',
    fit: 'meme',
    postType: 'image',
    notes: 'Memes only, about events at least 20 years old. Upload the image itself; no links in the title.',
  },
  {
    name: 'koreanhistory',
    notesKo: '작고 토론 위주. 맥락과 출처를 담은 텍스트 글로 올리세요. 본문의 스레드 링크는 대체로 허용됩니다.',
    fit: 'discussion',
    postType: 'text',
    notes: 'Small, discussion-friendly. A text post with context and sources; a thread link in the body is usually tolerated.',
  },
  {
    name: 'korea',
    notesKo: '자기홍보에 엄격합니다. 콘텐츠 자체를 공유하고 우리 사이트 링크는 피하세요.',
    fit: 'discussion',
    postType: 'text',
    notes: 'Strict about self-promotion. Share the content itself; avoid linking your own site.',
  },
  {
    name: 'todayilearned',
    notesKo: '제목은 "TIL"로 시작하고, 링크는 우리 사이트가 아닌 신뢰할 만한 외부 출처여야 합니다.',
    fit: 'fact',
    postType: 'link',
    notes: 'Title starts with "TIL"; the link must be a reliable independent source (not your own site).',
  },
  {
    name: 'shortstories',
    notesKo: '창작 소설을 텍스트 글로 올리세요. 플레어 규칙을 확인하고 링크는 넣지 마세요.',
    fit: 'story',
    postType: 'text',
    notes: 'Original fiction as a text post; check the flair rules. No links.',
  },
];

export const findSubreddit = (name: string | null | undefined) =>
  SUBREDDITS.find((s) => s.name.toLowerCase() === (name ?? '').replace(/^r\//i, '').toLowerCase()) ?? null;

// ─── Links ───

export const SITE_URL = 'https://sillok.kr';

/** Thread URL tagged per platform so Vercel Analytics shows what each post brought in */
export function buildUtmUrl(threadId: string, platform: PromoPlatform, target?: string | null, base = SITE_URL): string {
  const params = new URLSearchParams({ utm_source: platform, utm_medium: 'social', utm_campaign: 'share-kit' });
  if (target) params.set('utm_content', target.replace(/^r\//i, '').toLowerCase());
  return `${base.replace(/\/$/, '')}/threads/${threadId}?${params}`;
}

/** Characters X counts: every URL is 23 */
export function xLength(text: string): number {
  return text.replace(/https?:\/\/\S+/g, 'x'.repeat(23)).length;
}

/** The full text an admin pastes: body + hashtags (Instagram) or + link (X, Threads) */
export function composePost(
  platform: PromoPlatform,
  post: { body: string; hashtags?: string[] },
  url: string,
): string {
  const body = post.body.trim();
  switch (platform) {
    case 'instagram': {
      const tags = (post.hashtags ?? []).map((t) => `#${t.replace(/^#/, '')}`).join(' ');
      return [body, tags].filter(Boolean).join('\n\n');
    }
    case 'x':
    case 'threads':
      return [body, url].filter(Boolean).join('\n\n');
    case 'reddit':
      return body;
  }
}

/** Length the platform will count for the composed post */
export function promoLength(platform: PromoPlatform, text: string): number {
  return platform === 'x' ? xLength(text) : text.length;
}

// ─── Thread content → slide text ───

const AI_NOTES = [
  'Meme generated with AI from the facts above.',
  'Short fiction written with AI.',
  'Translated from Korean with AI.',
];

/**
 * Split a thread body into the main text and the "What's real" note,
 * dropping the AI-disclosure line posted memes/stories end with.
 */
export function splitThreadContent(content: string | null | undefined): { main: string; real: string | null } {
  const paras = (content ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !AI_NOTES.includes(p));
  const realIdx = paras.findIndex((p) => /^What's real:/i.test(p));
  const real = realIdx >= 0 ? paras[realIdx].replace(/^What's real:\s*/i, '') : null;
  const main = paras.filter((_, i) => i !== realIdx).join('\n\n');
  return { main, real };
}

/** Trim to `max` characters at a word boundary, with an ellipsis */
export function clip(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export const PROMO_SLIDES = ['cover', 'history', 'cta'] as const;
export type PromoSlide = (typeof PROMO_SLIDES)[number];
/** Instagram portrait */
export const SLIDE_SIZE = { width: 1080, height: 1350 };

// ─── Validation ───

const hashtag = z
  .string()
  .trim()
  .transform((t) => t.replace(/^#/, ''))
  .pipe(z.string().regex(/^[\p{L}\p{N}_]{1,60}$/u, 'Hashtags: letters, numbers, underscore'));

export const PromoPostEditSchema = z
  .object({
    title: z.string().trim().max(300).nullable().optional(),
    body: z.string().max(10000).optional(),
    hashtags: z.array(hashtag).max(30).optional(),
    alt_text: z.string().trim().max(1000).nullable().optional(),
    target: z.string().trim().max(50).nullable().optional(),
    /** Mark as posted (url) or back to draft (null) */
    posted_url: z.string().url().max(500).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });

export const PromoPostCreateSchema = z.object({
  platform: z.enum(PROMO_PLATFORMS),
  target: z.string().trim().max(50).optional(),
});

export const PromoListSchema = z.object({
  window: z.enum(['30', '90', 'all']).default('90'),
  cursor: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Cursor = "<top_score>_<id>" (list is ordered by engagement, then id) */
export function parseScoreCursor(cursor: string): { score: number; id: string } | null {
  const m = /^(-?\d+)_([0-9a-f-]{36})$/i.exec(cursor);
  return m ? { score: Number(m[1]), id: m[2] } : null;
}
