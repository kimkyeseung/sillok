'use client';

import { Era } from './useAgeFlow';
import type { AgeFlowTag } from './useAgeFlow';

interface EraFilterProps {
  currentEra: Era;
  selectedEra: Era | 'All';
  onEraSelect: (era: Era | 'All') => void;
  fieldTags: AgeFlowTag[];
  selectedFieldTags: Set<string>;
  onFieldTagToggle: (tagId: string) => void;
}

const ERA_LIST: (Era | 'All')[] = [
  'All',
  'Ancient',
  'Three Kingdoms',
  'Goryeo',
  'Joseon',
  'Modern',
];

export default function EraFilter({
  currentEra,
  selectedEra,
  onEraSelect,
  fieldTags,
  selectedFieldTags,
  onFieldTagToggle,
}: EraFilterProps) {
  return (
    <div className="sticky top-14 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="relative mx-auto max-w-5xl">
        {/* Left/right fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white/90 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white/90 to-transparent" />

        {/* Era tabs */}
        <div className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
          {ERA_LIST.map((era) => {
            const isActive = selectedEra === era;
            const isCurrent = era !== 'All' && era === currentEra;

            return (
              <button
                key={era}
                onClick={() => onEraSelect(era)}
                className={`
                  shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors md:text-sm
                  ${isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                  ${isCurrent && !isActive ? 'ring-1 ring-brand-300' : ''}
                `}
              >
                {era}
              </button>
            );
          })}

          {/* Divider + Field tags */}
          {fieldTags.length > 0 && (
            <>
              <div className="mx-1 my-auto h-4 w-px shrink-0 bg-gray-200" />
              {fieldTags.map((tag) => {
                const isSelected = selectedFieldTags.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => onFieldTagToggle(tag.id)}
                    className={`
                      shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors
                      ${isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }
                    `}
                  >
                    {tag.name_en}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
