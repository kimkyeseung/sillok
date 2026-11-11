import { describe, expect, it } from 'vitest';
import imageLoader from '@/lib/image-loader';

const SB = 'https://abc123.supabase.co/storage/v1';

describe('imageLoader', () => {
  it('routes Supabase public objects through the image transformer', () => {
    expect(imageLoader({ src: `${SB}/object/public/persons/id-1/portrait.jpg`, width: 96 })).toBe(
      `${SB}/render/image/public/persons/id-1/portrait.jpg?width=96&quality=75`
    );
  });

  it('passes quality and caps the width at the Supabase limit', () => {
    expect(imageLoader({ src: `${SB}/object/public/threads/a.webp`, width: 3840, quality: 60 })).toBe(
      `${SB}/render/image/public/threads/a.webp?width=2500&quality=60`
    );
  });

  it('keeps an existing query string', () => {
    expect(imageLoader({ src: `${SB}/object/public/threads/a.png?v=2`, width: 64 })).toBe(
      `${SB}/render/image/public/threads/a.png?v=2&width=64&quality=75`
    );
  });

  it('leaves formats the transformer cannot handle untouched', () => {
    const gif = `${SB}/object/public/threads/a.gif`;
    expect(imageLoader({ src: gif, width: 64 })).toBe(gif);
  });

  it('leaves already-transformed and signed Supabase URLs untouched', () => {
    const rendered = `${SB}/render/image/public/persons/a.jpg?width=10`;
    const signed = `${SB}/object/sign/private/a.jpg?token=x`;
    expect(imageLoader({ src: rendered, width: 64 })).toBe(rendered);
    expect(imageLoader({ src: signed, width: 64 })).toBe(signed);
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
