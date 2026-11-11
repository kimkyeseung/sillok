'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/** Give up after this long — the navigation failed or was cancelled */
const MAX_VISIBLE_MS = 10_000;

/**
 * Thin progress bar at the top of the page while a link navigation is waiting
 * for the server. Used instead of loading.tsx: a Suspense boundary would start
 * streaming before the page runs, and notFound() pages would then answer 200.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  // The URL changed → the new page is on screen
  useEffect(() => {
    setActive(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.('a');
      if (!anchor || !anchor.href || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (hash links, the current tab) → nothing to wait for
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setActive(true);
    };
    // Back/forward cache restores the page with the bar still showing
    const onPageShow = () => setActive(false);

    document.addEventListener('click', onClick);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), MAX_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5" role="progressbar" aria-label="Loading page">
      <div className="animate-nav-progress h-full origin-left bg-brand-500" />
    </div>
  );
}
