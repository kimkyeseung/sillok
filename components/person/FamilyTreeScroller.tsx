'use client';

import { useEffect, useRef } from 'react';

/**
 * Horizontal scroll container for the family tree.
 * On mount, scrolls so the focused person (self) is centered on narrow screens.
 */
export default function FamilyTreeScroller({
  focusX,
  children,
}: {
  focusX: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const inner = el.firstElementChild as HTMLElement | null;
    const offset = inner ? inner.offsetLeft : 0;
    el.scrollLeft = offset + focusX - el.clientWidth / 2;
  }, [focusX]);

  return (
    <div ref={ref} className="overflow-x-auto p-4">
      {children}
    </div>
  );
}
