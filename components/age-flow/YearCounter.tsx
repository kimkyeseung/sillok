'use client';

import { useState, useRef, useEffect } from 'react';
import { Era, formatCount } from './useAgeFlow';

interface YearCounterProps {
  currentYear: number;
  currentEra: Era;
  aliveCount: number;
  onYearChange: (year: number) => void;
}

export default function YearCounter({
  currentYear,
  currentEra,
  aliveCount,
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
      <div className="rounded-lg bg-gray-900/80 px-4 py-3 text-center backdrop-blur-md">
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            className="w-24 bg-transparent text-center font-mono text-xl font-bold text-amber-400 outline-none md:text-3xl"
          />
        ) : (
          <button
            onClick={handleClick}
            className="font-mono text-xl font-bold tracking-wider text-amber-400 transition-colors hover:text-amber-300 md:text-3xl"
          >
            {yearPrefix}{yearDisplay}
          </button>
        )}

        <div className="my-1.5 border-t border-gray-700" />

        <p className="text-xs text-gray-400 md:text-sm">{currentEra}</p>

        <div className="my-1.5 border-t border-gray-700" />

        <p className="text-[10px] text-gray-500 md:text-xs">
          {formatCount(aliveCount)} alive
        </p>
      </div>
    </div>
  );
}
