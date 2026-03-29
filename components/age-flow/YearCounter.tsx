'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Era, AgeFlowPerson, formatCount, getAge } from './useAgeFlow';
import PersonAvatar, { getPrimaryFieldTag } from '@/components/common/PersonAvatar';

interface YearCounterProps {
  currentYear: number;
  currentEra: Era;
  aliveCount: number;
  currentKing: AgeFlowPerson | null;
  onYearChange: (year: number) => void;
}

export default function YearCounter({
  currentYear,
  currentEra,
  aliveCount,
  currentKing,
  onYearChange,
}: YearCounterProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setInputValue(String(currentYear));
    setIsEditing(true);
  };

  const handleSubmit = () => {
    const year = parseInt(inputValue, 10);
    if (!isNaN(year)) {
      onYearChange(year);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') setIsEditing(false);
  };

  const yearDisplay = String(Math.abs(currentYear)).padStart(4, ' ');
  const yearPrefix = currentYear < 0 ? 'BC ' : '';

  return (
    <div className="fixed right-3 top-20 z-40 md:right-6 md:top-24">
      <div className="w-36 rounded-lg bg-gray-900/80 px-3 py-3 text-center backdrop-blur-md md:w-40">
        {/* Year */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-center font-mono text-xl font-bold text-amber-400 outline-none md:text-3xl"
          />
        ) : (
          <button
            onClick={handleClick}
            className="w-full font-mono text-xl font-bold tracking-wider text-amber-400 transition-colors hover:text-amber-300 md:text-3xl"
          >
            {yearPrefix}{yearDisplay}
          </button>
        )}

        <p className="mt-1 text-[10px] text-gray-500 md:text-xs">{currentEra}</p>

        {/* Current King */}
        {currentKing && (
          <>
            <div className="my-2 border-t border-gray-700" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-amber-500/40">
                {currentKing.thumbnail ? (
                  <Image
                    src={currentKing.thumbnail}
                    alt={currentKing.name_en || currentKing.name_ko}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PersonAvatar
                    name={currentKing.name_ko}
                    fieldTag={getPrimaryFieldTag(currentKing.tags)}
                    size="sm"
                  />
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-[10px] font-medium text-gray-200 md:text-xs">
                  {currentKing.name_en || currentKing.name_ko}
                </p>
                <p className="text-[9px] text-gray-500">
                  Age {getAge(currentKing.birth_year, currentYear)}
                </p>
              </div>
            </div>
          </>
        )}

        <div className="mt-2 border-t border-gray-700" />

        <p className="mt-1.5 text-[10px] text-gray-500 md:text-xs">
          {formatCount(aliveCount)} alive
        </p>
      </div>
    </div>
  );
}
