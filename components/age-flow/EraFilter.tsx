'use client';

import { Era, ERA_RANGES } from './useAgeFlow';

interface EraFilterProps {
  currentEra: Era;
  selectedEra: Era | 'All';
  onEraSelect: (era: Era | 'All') => void;
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
}: EraFilterProps) {
  return (
    <div className="sticky top-14 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="flex gap-1 overflow-x-auto px-2 py-2 scrollbar-hide">
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
      </div>
    </div>
  );
}
