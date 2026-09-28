'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
  license: 'kogl-1' | 'kogl-3';
}

const LICENSE_LABEL: Record<GalleryImage['license'], string> = {
  'kogl-1': 'KOGL Type 1',
  'kogl-3': 'KOGL Type 3 (no derivatives)',
};

/**
 * Heritage photos from the Korea Heritage Service, served from khs.go.kr as-is.
 * KOGL Type 3 forbids modification, so every image is shown whole (object-contain, no crop).
 */
const INITIAL_VISIBLE = 24;

export default function ArtifactGallery({
  images,
}: {
  images: GalleryImage[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? images : images.slice(0, INITIAL_VISIBLE);
  const isOpen = active !== null;
  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (d: number) =>
      setActive((i) =>
        i === null ? i : Math.min(images.length - 1, Math.max(0, i + d))
      ),
    [images.length]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close, step]);

  if (images.length === 0) return null;
  const current = active !== null ? images[active] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {visible.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActive(i)}
            className="group flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-gray-50 text-left"
          >
            <span className="flex h-32 w-full items-center justify-center bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- external heritage host, unoptimized on purpose */}
              <img
                src={img.url}
                alt={img.caption ?? ''}
                loading="lazy"
                className="max-h-full max-w-full object-contain transition-opacity group-hover:opacity-90"
              />
            </span>
            {img.caption && (
              <span className="line-clamp-2 px-2 py-1.5 text-[11px] leading-snug text-gray-500">
                {img.caption}
              </span>
            )}
          </button>
        ))}
      </div>
      {!showAll && images.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
        >
          Show all {images.length} photos
        </button>
      )}
      <p className="mt-3 text-[11px] text-gray-400">
        Photos: Korea Heritage Service, used under the{' '}
        <a
          href="https://www.kogl.or.kr/info/license.do"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          Korea Open Government License
        </a>
        .
      </p>

      {current &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={current.caption ?? 'Image viewer'}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- external heritage host, unoptimized on purpose */}
            <img
              src={current.url}
              alt={current.caption ?? ''}
              className="max-h-[80vh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="mt-3 max-w-2xl text-center text-sm text-white/80"
              onClick={(e) => e.stopPropagation()}
            >
              {current.caption && <p>{current.caption}</p>}
              <p className="mt-1 text-xs text-white/50">
                {active! + 1} / {images.length} · Korea Heritage Service ·{' '}
                {LICENSE_LABEL[current.license]}
              </p>
            </div>
            {active! > 0 && (
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-3 text-4xl leading-none text-white/70 hover:bg-white/10 hover:text-white"
              >
                ‹
              </button>
            )}
            {active! < images.length - 1 && (
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-3 text-4xl leading-none text-white/70 hover:bg-white/10 hover:text-white"
              >
                ›
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
