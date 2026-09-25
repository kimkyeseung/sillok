'use client';

import { getEraRangeInAgeFlow } from '@/lib/age-flow';
import { Era } from './useAgeFlow';

interface EraFilterProps {
  currentEra: Era;
  onEraSelect: (era: Era) => void;
  onOpenFigures: () => void;
}

const ERA_LIST: Era[] = ['Ancient', 'Three Kingdoms', 'Goryeo', 'Joseon', 'Modern'];

export default function EraFilter({ currentEra, onEraSelect, onOpenFigures }: EraFilterProps) {
  return (
    <div className="sticky top-14 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="relative mx-auto flex max-w-5xl items-center">
        <div className="relative min-w-0 flex-1">
          {/* Left/right fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white/90 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white/90 to-transparent" />

          {/* Era tabs — highlight follows the scrolled year; eras outside the timeline are disabled (hidden on mobile) */}
          <div className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
            {ERA_LIST.map((era) => {
              const available = getEraRangeInAgeFlow(era) !== null;
              const isCurrent = era === currentEra;

              return (
                <button
                  key={era}
                  onClick={() => onEraSelect(era)}
                  disabled={!available}
                  aria-current={isCurrent ? 'true' : undefined}
                  title={available ? undefined : 'Coming soon'}
                  className={`
                    flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors md:text-sm
                    ${isCurrent
                      ? 'bg-brand-600 text-white'
                      : available
                        ? 'text-gray-600 hover:bg-gray-100'
                        : 'hidden cursor-not-allowed text-gray-300 md:flex'
                    }
                  `}
                >
                  {era}
                  {!available && (
                    <span className="rounded bg-gray-100 px-1 text-[9px] font-semibold uppercase text-gray-400">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onOpenFigures}
          className="mr-4 flex shrink-0 items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 md:text-sm"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" />
          </svg>
          Figures
        </button>
      </div>
    </div>
  );
}
