import Link from 'next/link';
import Image from 'next/image';
import PersonAvatar from '@/components/common/PersonAvatar';
import { ordinal, type Dynasty } from '@/lib/monarchs';

/**
 * Collapsible succession box ("Kings of Joseon", 1st → last) just below a ruler's profile header.
 * Native <details>: no JS, and the links stay in the HTML for crawlers even when collapsed.
 */
export default function MonarchNavbox({
  dynasty,
  currentSlug,
  linked,
  thumbnails,
}: {
  dynasty: Dynasty;
  currentSlug: string;
  linked: string[];
  /** slug → portrait; rulers without one get the placeholder avatar */
  thumbnails: Record<string, string>;
}) {
  const linkable = new Set(linked);
  return (
    <details open className="group card-flat overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 text-white [&::-webkit-details-marker]:hidden">
        <h2 className="text-sm font-bold">{dynasty.title}</h2>
        <span className="text-xs font-medium text-white/80">
          [<span className="group-open:hidden">Show</span>
          <span className="hidden group-open:inline">Hide</span>]
        </span>
      </summary>
      <ol className="grid grid-cols-4 gap-px bg-gray-200">
        {dynasty.monarchs.map((mon, i) => {
          const isCurrent = mon.slug === currentSlug;
          const href = mon.slug && !isCurrent && linkable.has(mon.slug) ? `/persons/${mon.slug}` : null;
          const thumb = mon.slug ? thumbnails[mon.slug] : undefined;
          const avatar = (
            <span
              className={`block h-8 w-8 overflow-hidden rounded-full sm:h-10 sm:w-10 ${
                isCurrent ? 'ring-2 ring-brand-500' : 'ring-1 ring-gray-200'
              } ${!href && !isCurrent ? 'opacity-50 grayscale' : ''}`}
            >
              {thumb ? (
                <Image src={thumb} alt="" width={40} height={40} className="h-full w-full object-cover" />
              ) : (
                <PersonAvatar name={mon.ko} fieldTag="king" size="sm" />
              )}
            </span>
          );
          return (
            <li
              key={i}
              className={`flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-center sm:px-2 sm:py-2.5 ${isCurrent ? 'bg-brand-50' : 'bg-white'}`}
            >
              <span className="text-[10px] font-medium sm:text-[11px] text-brand-600">{ordinal(i + 1)}</span>
              {href ? (
                <Link href={href} className="group/m flex min-w-0 flex-col items-center gap-1">
                  {avatar}
                  <span className="break-words text-xs text-gray-900 sm:text-sm group-hover/m:text-brand-700 group-hover/m:underline">
                    {mon.en}
                  </span>
                </Link>
              ) : (
                <>
                  {avatar}
                  <span
                    className={`break-words text-xs sm:text-sm ${isCurrent ? 'font-bold text-brand-800' : 'text-gray-400'}`}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {mon.en}
                  </span>
                </>
              )}
            </li>
          );
        })}
        {/* Fill the last row so the grid keeps its borders */}
        {Array.from({ length: (4 - (dynasty.monarchs.length % 4)) % 4 }, (_, i) => (
          <li key={`pad-${i}`} aria-hidden className="bg-gray-50" />
        ))}
      </ol>
    </details>
  );
}
