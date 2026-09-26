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
  /** Re-measure when the layout above the grid changes (e.g. focus banner shown) */
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
    // The reserve already includes a ~32px buffer, so let the last row use up to half of it
    const SLACK = 16;
    const rows = Math.max(1, Math.floor((available + rowGap + SLACK) / rowHeightRef.current));
    const next = rows * cols;
    setCap((prev) => (prev === next ? prev : next));
  }, [gridRef]);

  // Initial measure, and when the layout above the grid changes (focus banner)
  useEffect(() => {
    if (!hasItems) return;
    measure();
  }, [hasItems, measure, layoutKey]);

  // Card set / heights change as the year scrolls → the grid resizes. ResizeObserver
  // runs after layout, so this adds no forced reflow to the scroll path.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !hasItems) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(grid);
    return () => observer.disconnect();
  }, [gridRef, hasItems, measure]);

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
