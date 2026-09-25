'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * How many cards fit in the sticky viewport without being cut off.
 *
 * The grid lives inside a sticky container, so page scroll moves years, not
 * the grid — rows below the fold are unreachable. Returns cols × fitting rows
 * (Infinity until the first card is measured).
 *
 * Row height only grows (tag wrapping varies per card) so the cap doesn't
 * flicker as the year changes; it resets on resize.
 */
export function useGridCap(
  gridRef: React.RefObject<HTMLDivElement | null>,
  hasItems: boolean,
  /** Re-measure when this changes (year, banner shown, …) — cheap, cap is stable */
  layoutKey: unknown
): number {
  const [cap, setCap] = useState(Infinity);
  const rowHeightRef = useRef(0);

  const measure = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll<HTMLElement>('[data-person-id]');
    if (cards.length === 0) return;

    const style = getComputedStyle(grid);
    const cols = Math.max(1, style.gridTemplateColumns.split(' ').filter(Boolean).length);
    const rowGap = parseFloat(style.rowGap) || 0;
    cards.forEach((c) => {
      rowHeightRef.current = Math.max(rowHeightRef.current, c.offsetHeight + rowGap);
    });

    // Bottom padding of the wrapper reserves room for fixed bottom bars
    const reserve = grid.parentElement
      ? parseFloat(getComputedStyle(grid.parentElement).paddingBottom) || 0
      : 0;
    const available = window.innerHeight - grid.getBoundingClientRect().top - reserve;
    const rows = Math.max(1, Math.floor((available + rowGap) / rowHeightRef.current));
    const next = rows * cols;
    setCap((prev) => (prev === next ? prev : next));
  }, [gridRef]);

  useEffect(() => {
    if (!hasItems) return;
    measure();
  }, [hasItems, measure, layoutKey]);

  useEffect(() => {
    const onResize = () => {
      rowHeightRef.current = 0;
      measure();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measure]);

  return cap;
}
