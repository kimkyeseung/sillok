'use client';

import Image from 'next/image';
import { getLifeStatus } from '@/lib/age-flow';
import { AgeFlowPerson } from './useAgeFlow';
import PersonAvatar, { getPrimaryFieldTag } from '@/components/common/PersonAvatar';

interface FocusBannerProps {
  person: AgeFlowPerson;
  currentYear: number;
  onJump: (year: number) => void;
  onClear: () => void;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/** "Contemporaries of X" — pinned figure with lifespan progress for the current year */
export default function FocusBanner({ person, currentYear, onJump, onClear }: FocusBannerProps) {
  const status = getLifeStatus(person, currentYear);
  const name = person.name_en || person.name_ko;
  const end = person.is_alive ? currentYear : (person.death_year ?? person.birth_year);
  const span = Math.max(1, end - person.birth_year);
  const progress = Math.min(1, Math.max(0, (currentYear - person.birth_year) / span));

  const statusText =
    status.kind === 'alive'
      ? `Age ${status.age}`
      : status.kind === 'unborn'
        ? `Born in ${plural(status.years, 'year')}`
        : `Died ${plural(status.years, 'year')} ago`;

  return (
    <div className="mb-3 flex items-center gap-3 rounded-lg border border-brand-200 bg-white/90 px-3 py-2 shadow-sm">
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {person.thumbnail ? (
          <Image src={person.thumbnail} alt="" fill sizes="36px" className="object-cover" />
        ) : (
          <PersonAvatar name={person.name_ko} fieldTag={getPrimaryFieldTag(person.tags)} size="sm" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-gray-900">
          <span className="text-gray-500">Contemporaries of </span>
          <span className="font-semibold">{name}</span>
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="shrink-0 text-[11px] text-gray-400">{person.birth_year}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${status.kind === 'alive' ? 'bg-brand-500' : 'bg-gray-300'}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] text-gray-400">
            {person.is_alive ? 'Present' : person.death_year}
          </span>
          <span
            className={`shrink-0 text-[11px] font-medium ${
              status.kind === 'alive' ? 'text-brand-600' : 'text-gray-400'
            }`}
          >
            {statusText}
          </span>
        </div>
      </div>

      {status.kind !== 'alive' && (
        <button
          onClick={() => onJump(person.birth_year)}
          className="shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Jump to birth
        </button>
      )}
      <button
        onClick={onClear}
        aria-label="Clear focus"
        className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 12l8-8M12 12L4 4" />
        </svg>
      </button>
    </div>
  );
}
