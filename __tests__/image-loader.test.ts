import { describe, expect, it } from 'vitest';
import imageLoader from '@/lib/image-loader';

const SB = 'https://abc123.supabase.co/storage/v1';

describe('imageLoader', () => {
  it('serves the pre-generated thumbnail for Supabase public objects', () => {
    expect(imageLoader({ src: `${SB}/object/public/persons/id-1/portrait.jpg`, width: 96 })).toBe(
      `${SB}/object/public/thumbs/persons/96/id-1/portrait.jpg.webp`
    );
  });

  it('picks the smallest generated width that covers the request', () => {
    const src = `${SB}/object/public/threads/u/t/a.webp`;
    const thumb = (w: number) => `${SB}/object/public/thumbs/threads/${w}/u/t/a.webp.webp`;
    expect(imageLoader({ src, width: 48 })).toBe(thumb(96));
    expect(imageLoader({ src, width: 128 })).toBe(thumb(256));
    expect(imageLoader({ src, width: 384 })).toBe(thumb(640));
    expect(imageLoader({ src, width: 828 })).toBe(thumb(1080));
    expect(imageLoader({ src, width: 3840 })).toBe(thumb(1920));
  });

  it('never uses Storage image transformations', () => {
    expect(imageLoader({ src: `${SB}/object/public/nodes/posters/a.png`, width: 640 })).not.toContain('render/image');
  });

  it('keeps an existing query string', () => {
    expect(imageLoader({ src: `${SB}/object/public/threads/a.png?v=2`, width: 64 })).toBe(
      `${SB}/object/public/thumbs/threads/96/a.png.webp?v=2`
    );
  });

  it('leaves formats that have no thumbnails untouched', () => {
    const gif = `${SB}/object/public/threads/a.gif`;
    expect(imageLoader({ src: gif, width: 64 })).toBe(gif);
  });

  it('leaves buckets without thumbnails, thumbnails themselves and signed URLs untouched', () => {
    const meme = `${SB}/object/public/memes/sources/a.jpg`;
    const thumb = `${SB}/object/public/thumbs/persons/96/a.jpg.webp`;
    const rendered = `${SB}/render/image/public/persons/a.jpg?width=10`;
    const signed = `${SB}/object/sign/private/a.jpg?token=x`;
    for (const src of [meme, thumb, rendered, signed]) expect(imageLoader({ src, width: 64 })).toBe(src);
  });

  it('uses a Wikimedia thumbnail at the next allowed step for small sizes', () => {
    const src = 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Gwanggaeto_Stele_5.jpg';
    const thumb = (w: number) =>
      `https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Gwanggaeto_Stele_5.jpg/${w}px-Gwanggaeto_Stele_5.jpg`;
    expect(imageLoader({ src, width: 32 })).toBe(thumb(40));
    expect(imageLoader({ src, width: 64 })).toBe(thumb(120));
    expect(imageLoader({ src, width: 256 })).toBe(thumb(250));
  });

  it('keeps the Wikimedia original for large sizes, thumbs and other formats', () => {
    const src = 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Gwanggaeto_Stele_5.jpg';
    const thumb = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/A.jpg/120px-A.jpg';
    const svg = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Seal.svg';
    expect(imageLoader({ src, width: 384 })).toBe(src);
    expect(imageLoader({ src: thumb, width: 64 })).toBe(thumb);
    expect(imageLoader({ src: svg, width: 64 })).toBe(svg);
  });

  it('leaves other hosts and local files untouched', () => {
    expect(imageLoader({ src: '/og-default.png', width: 64 })).toBe('/og-default.png');
    expect(imageLoader({ src: 'https://img.youtube.com/vi/x/hqdefault.jpg', width: 64 })).toBe(
      'https://img.youtube.com/vi/x/hqdefault.jpg'
    );
  });
});
