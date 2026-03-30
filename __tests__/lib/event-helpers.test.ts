import { describe, it, expect } from 'vitest';

// ── YouTube ID extraction (same logic used in threads/[id] and RecentThreadsFeed) ──

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
  } catch { /* ignore */ }
  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    else if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v');
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  } catch { return null; }
}

describe('getYouTubeId', () => {
  it('should extract ID from standard youtube.com URL', () => {
    expect(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from youtu.be short URL', () => {
    expect(getYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from youtube.com without www', () => {
    expect(getYouTubeId('https://youtube.com/watch?v=abc123')).toBe('abc123');
  });

  it('should return null for non-YouTube URL', () => {
    expect(getYouTubeId('https://vimeo.com/123456')).toBeNull();
    expect(getYouTubeId('https://example.com')).toBeNull();
  });

  it('should return null for invalid URL', () => {
    expect(getYouTubeId('not a url')).toBeNull();
  });

  it('should handle URL with extra params', () => {
    expect(getYouTubeId('https://www.youtube.com/watch?v=abc123&t=120')).toBe('abc123');
  });
});

describe('getYouTubeThumbnail', () => {
  it('should return hqdefault thumbnail URL', () => {
    expect(getYouTubeThumbnail('https://youtu.be/dQw4w9WgXcQ'))
      .toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('should return null for non-YouTube URL', () => {
    expect(getYouTubeThumbnail('https://tv.naver.com/v/123')).toBeNull();
  });

  it('should return null for invalid URL', () => {
    expect(getYouTubeThumbnail('')).toBeNull();
  });
});
