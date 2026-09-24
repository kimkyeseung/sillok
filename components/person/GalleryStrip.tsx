'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GalleryImage } from '@/lib/person-page';

interface Props {
  images: GalleryImage[];
  /** 'lg' for the Gallery tab, 'sm' for the overview preview */
  size?: 'sm' | 'lg';
}

const SIZES = {
  sm: { tile: 'h-28 w-28', px: 112, caption: false },
  lg: { tile: 'h-56 w-56 sm:h-64 sm:w-64', px: 256, caption: true },
};

/** Horizontally scrolling image row with a fullscreen viewer */
export default function GalleryStrip({ images, size = 'lg' }: Props) {
  const s = SIZES[size];
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges]);

  const scrollBy = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: 'smooth' });

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setActive((i) => (i === null ? i : Math.min(Math.max(i + dir, 0), images.length - 1))),
    [images.length]
  );

  useEffect(() => {
    if (active === null) return;
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
  }, [active, close, step]);

  const current = active !== null ? images[active] : null;

  return (
    <div className="relative">
      <div
        ref={scroller}
        onScroll={updateEdges}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]"
      >
        {images.map((img, i) => (
          <figure key={img.id} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image: ${img.caption}`}
              className={`${s.tile} block cursor-zoom-in overflow-hidden rounded-lg bg-gray-100`}
            >
              <Image
                src={img.url}
                alt={img.caption}
                width={s.px}
                height={s.px}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            </button>
            {s.caption && (
              <figcaption className="mt-1.5 line-clamp-2 w-56 text-xs text-gray-600 sm:w-64">
                {img.href ? (
                  <Link href={img.href} className="hover:text-brand-700 hover:underline">
                    {img.caption}
                  </Link>
                ) : (
                  img.caption
                )}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {!edges.start && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className="absolute left-1 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow ring-1 ring-gray-200 hover:bg-white sm:flex"
          style={s.caption ? { top: 'calc(50% - 20px)' } : undefined}
        >
          ‹
        </button>
      )}
      {!edges.end && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className="absolute right-1 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow ring-1 ring-gray-200 hover:bg-white sm:flex"
          style={s.caption ? { top: 'calc(50% - 20px)' } : undefined}
        >
          ›
        </button>
      )}

      {current &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={current.caption}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-16 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20 sm:top-4"
            >
              ×
            </button>
            <div className="relative h-[75vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <Image src={current.url} alt={current.caption} fill sizes="(max-width: 896px) 100vw, 896px" className="object-contain" />
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-white/80" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => step(-1)} disabled={active === 0} className="px-2 text-lg disabled:opacity-30" aria-label="Previous image">
                ‹
              </button>
              <span className="max-w-md truncate">
                {current.href ? (
                  <Link href={current.href} className="hover:underline">
                    {current.caption}
                  </Link>
                ) : (
                  current.caption
                )}
              </span>
              <span className="text-white/50">
                {active! + 1} / {images.length}
              </span>
              <button type="button" onClick={() => step(1)} disabled={active === images.length - 1} className="px-2 text-lg disabled:opacity-30" aria-label="Next image">
                ›
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
