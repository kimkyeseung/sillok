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

function KingAvatar({ king, size }: { king: AgeFlowPerson; size: number }) {
  return king.thumbnail ? (
    <Image
      src={king.thumbnail}
      alt={king.name_en || king.name_ko}
      width={size}
      height={size}
      className="h-full w-full object-cover"
    />
  ) : (
    <PersonAvatar
      name={king.name_ko}
      fieldTag={getPrimaryFieldTag(king.tags)}
      size="sm"
    />
  );
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
    <>
      {/* ── Mobile: bottom bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="flex items-center gap-3 border-t border-gray-800 bg-gray-900/90 px-4 py-2 backdrop-blur-md">
          {/* King avatar */}
          {currentKing && (
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-amber-500/40">
              <KingAvatar king={currentKing} size={36} />
            </div>
          )}

          {/* King name + era */}
          <div className="min-w-0 flex-1">
            {currentKing && (
              <p className="truncate text-xs font-medium text-gray-200">
                {currentKing.name_en || currentKing.name_ko}
                <span className="ml-1 text-gray-500">
                  ({getAge(currentKing.birth_year, currentYear)})
                </span>
              </p>
            )}
            <p className="text-[10px] text-gray-500">
              {currentEra} &middot; {formatCount(aliveCount)} alive
            </p>
          </div>

          {/* Year */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={handleKeyDown}
              className="w-16 bg-transparent text-right font-mono text-lg font-bold text-amber-400 outline-none"
            />
          ) : (
            <button
              onClick={handleClick}
              className="font-mono text-lg font-bold tracking-wider text-amber-400"
            >
              {yearPrefix}{yearDisplay}
            </button>
          )}
        </div>
      </div>

      {/* ── Desktop: top-left panel ── */}
      <div className="fixed left-6 top-24 z-40 hidden md:block">
        <div className="w-44 rounded-lg bg-gray-900/90 px-3 py-3 text-center backdrop-blur-md">
          {/* Year */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-center font-mono text-3xl font-bold text-amber-400 outline-none"
            />
          ) : (
            <button
              onClick={handleClick}
              className="w-full font-mono text-3xl font-bold tracking-wider text-amber-400 transition-colors hover:text-amber-300"
            >
              {yearPrefix}{yearDisplay}
            </button>
          )}

          <p className="mt-0.5 text-xs text-gray-400">{currentEra}</p>

          {/* Current King */}
          {currentKing && (
            <>
              <div className="my-2 border-t border-gray-700" />
              <div className="mx-auto h-14 w-14 overflow-hidden rounded-full ring-2 ring-amber-500/50">
                <KingAvatar king={currentKing} size={56} />
              </div>
              <p className="mt-1.5 truncate text-sm font-semibold text-white">
                {currentKing.name_en || currentKing.name_ko}
              </p>
              <p className="text-xs text-gray-300">
                Age {getAge(currentKing.birth_year, currentYear)}
              </p>
            </>
          )}

          <div className="mt-2 border-t border-gray-700" />

          <p className="mt-1.5 text-xs text-gray-300">
            {formatCount(aliveCount)} alive
          </p>
        </div>
      </div>
    </>
  );
}
