'use client';

import { useEffect } from 'react';
import { originalFromThumbUrl } from '@/lib/thumbnail-paths';

/**
 * Safety net for pre-generated thumbnails: an image whose thumbnail doesn't
 * exist yet (uploaded by a script before `npm run thumbs`, or generation failed)
 * is swapped back to its original instead of showing as broken.
 */
export default function ThumbnailFallback() {
  useEffect(() => {
    const restore = (img: HTMLImageElement) => {
      if (img.dataset.thumbFallback) return;
      const original = originalFromThumbUrl(img.currentSrc || img.src);
      if (!original) return;
      img.dataset.thumbFallback = '1';
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.src = original;
    };

    // Image errors don't bubble — listen in the capture phase
    const onError = (e: Event) => {
      if (e.target instanceof HTMLImageElement) restore(e.target);
    };
    document.addEventListener('error', onError, true);

    // Images that already failed before hydration
    for (const img of Array.from(document.images)) {
      if (img.complete && img.naturalWidth === 0) restore(img);
    }

    return () => document.removeEventListener('error', onError, true);
  }, []);

  return null;
}
