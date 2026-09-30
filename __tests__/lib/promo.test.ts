import { describe, it, expect } from 'vitest';
import {
  PromoPostEditSchema,
  buildUtmUrl,
  clip,
  composePost,
  findSubreddit,
  parseScoreCursor,
  promoLength,
  splitThreadContent,
  xLength,
} from '@/lib/promo';

const ID = '4f3c2b1a-0000-4000-8000-000000000000';

describe('buildUtmUrl', () => {
  it('tags the thread link per platform and subreddit', () => {
    expect(buildUtmUrl(ID, 'instagram')).toBe(
      `https://sillok.kr/threads/${ID}?utm_source=instagram&utm_medium=social&utm_campaign=share-kit`,
    );
    expect(buildUtmUrl(ID, 'reddit', 'r/HistoryMemes')).toContain('utm_source=reddit');
    expect(buildUtmUrl(ID, 'reddit', 'r/HistoryMemes')).toContain('utm_content=historymemes');
    expect(buildUtmUrl(ID, 'x', null, 'http://localhost:3000/')).toMatch(/^http:\/\/localhost:3000\/threads\//);
  });
});

describe('xLength / promoLength', () => {
  it('counts every URL as 23 characters on X', () => {
    expect(xLength('hi https://sillok.kr/threads/very-long-url?utm_source=x')).toBe(3 + 23);
    expect(promoLength('x', 'a https://example.com')).toBe(2 + 23);
    expect(promoLength('threads', 'a https://example.com')).toBe(21);
  });
});

describe('composePost', () => {
  it('adds hashtags on Instagram and the link on X/Threads', () => {
    expect(composePost('instagram', { body: 'Hook', hashtags: ['joseon', '#history'] }, 'u')).toBe('Hook\n\n#joseon #history');
    expect(composePost('x', { body: 'Hook' }, 'https://sillok.kr/t')).toBe('Hook\n\nhttps://sillok.kr/t');
    expect(composePost('reddit', { body: 'Body' }, 'u')).toBe('Body');
    expect(composePost('instagram', { body: '', hashtags: [] }, 'u')).toBe('');
  });
});

describe('splitThreadContent', () => {
  it('separates the story, the What\'s real note and drops the AI line', () => {
    expect(
      splitThreadContent("Line one.\nTwist.\n\nWhat's real: It happened in 1591.\n\nShort fiction written with AI."),
    ).toEqual({ main: 'Line one.\nTwist.', real: 'It happened in 1591.' });
  });

  it('keeps meme facts as main text', () => {
    expect(splitThreadContent('Seonjo fled north.\n\nMeme generated with AI from the facts above.')).toEqual({
      main: 'Seonjo fled north.',
      real: null,
    });
    expect(splitThreadContent(null)).toEqual({ main: '', real: null });
  });
});

describe('clip', () => {
  it('cuts at a word boundary with an ellipsis', () => {
    expect(clip('short', 10)).toBe('short');
    expect(clip('one two three four five', 12)).toBe('one two…');
  });
});

describe('findSubreddit', () => {
  it('matches known subreddits case-insensitively, with or without r/', () => {
    expect(findSubreddit('r/historymemes')?.name).toBe('HistoryMemes');
    expect(findSubreddit('KOREA')?.name).toBe('korea');
    expect(findSubreddit('unknown')).toBeNull();
  });
});

describe('PromoPostEditSchema', () => {
  it('normalises hashtags and accepts a posted URL or null', () => {
    const r = PromoPostEditSchema.safeParse({ hashtags: ['#joseon', 'history_memes'], posted_url: 'https://reddit.com/r/x/1' });
    expect(r.success && r.data.hashtags).toEqual(['joseon', 'history_memes']);
    expect(PromoPostEditSchema.safeParse({ posted_url: null }).success).toBe(true);
  });

  it('rejects bad hashtags, bad URLs and empty updates', () => {
    expect(PromoPostEditSchema.safeParse({ hashtags: ['two words'] }).success).toBe(false);
    expect(PromoPostEditSchema.safeParse({ posted_url: 'not a url' }).success).toBe(false);
    expect(PromoPostEditSchema.safeParse({}).success).toBe(false);
  });
});

describe('parseScoreCursor', () => {
  it('parses "<score>_<uuid>" and rejects anything else', () => {
    expect(parseScoreCursor(`12_${ID}`)).toEqual({ score: 12, id: ID });
    expect(parseScoreCursor(`abc_${ID}`)).toBeNull();
    expect(parseScoreCursor('12_1),or(id.gt.0')).toBeNull();
  });
});
