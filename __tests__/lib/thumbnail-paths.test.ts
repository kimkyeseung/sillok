import { describe, expect, it } from 'vitest';
import { hasThumbnails, originalFromThumbUrl, thumbObjectPath, thumbStep } from '@/lib/thumbnail-paths';

const PUB = 'https://abc123.supabase.co/storage/v1/object/public';

describe('thumbnail paths', () => {
  it('only resizable images in source buckets have thumbnails', () => {
    expect(hasThumbnails('persons', 'id/a.JPG')).toBe(true);
    expect(hasThumbnails('nodes', 'posters/a.webp')).toBe(true);
    expect(hasThumbnails('persons', 'id/a.gif')).toBe(false);
    expect(hasThumbnails('memes', 'sources/a.jpg')).toBe(false);
    expect(hasThumbnails('thumbs', 'persons/96/a.jpg.webp')).toBe(false);
  });

  it('maps a requested width to a generated one', () => {
    expect(thumbStep(16)).toBe(96);
    expect(thumbStep(96)).toBe(96);
    expect(thumbStep(97)).toBe(256);
    expect(thumbStep(1200)).toBe(1920);
    expect(thumbStep(5000)).toBe(1920);
  });

  it('recovers the original URL from a thumbnail URL', () => {
    const path = thumbObjectPath('persons', 'id-1/portrait.jpg', 256);
    expect(path).toBe('persons/256/id-1/portrait.jpg.webp');
    expect(originalFromThumbUrl(`${PUB}/thumbs/${path}`)).toBe(`${PUB}/persons/id-1/portrait.jpg`);
    expect(originalFromThumbUrl(`${PUB}/thumbs/${path}?v=3`)).toBe(`${PUB}/persons/id-1/portrait.jpg?v=3`);
  });

  it('returns null for anything that is not a thumbnail URL', () => {
    expect(originalFromThumbUrl(`${PUB}/persons/id-1/portrait.jpg`)).toBeNull();
    expect(originalFromThumbUrl('https://example.com/thumbs/persons/96/a.jpg.webp')).toBeNull();
    expect(originalFromThumbUrl('/og-default.png')).toBeNull();
  });
});
