'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Era, AgeFlowPerson, AgeFlowTag, War, formatCount, getAge } from './useAgeFlow';
import PersonAvatar, { getPrimaryFieldTag } from '@/components/common/PersonAvatar';

interface TimelinePanelProps {
  currentYear: number;
  currentEra: Era;
  aliveCount: number;
  currentKing: AgeFlowPerson | null;
  currentWars: War[];
  fieldTags: AgeFlowTag[];
  hiddenFieldTags: Set<string>;
  onFieldTagToggle: (tagId: string) => void;
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

/* ── Eye icon SVGs ── */
function EyeIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width={size} height={size}>
      <path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-4-7-9-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

function EyeOffIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width={size} height={size}>
      <path d="M3.71 2.29a1 1 0 0 0-1.42 1.42l14 14a1 1 0 0 0 1.42-1.42l-2.2-2.2A9.76 9.76 0 0 0 19 10c-.73-2.89-4-7-9-7a9.4 9.4 0 0 0-4.49 1.13L3.71 2.29ZM10 5a5 5 0 0 1 4.55 7.13l-1.47-1.47A3 3 0 0 0 10 7a2.94 2.94 0 0 0-.66.08L7.87 5.6A4.94 4.94 0 0 1 10 5ZM1 10c.73-2.89 4-7 9-7a9.4 9.4 0 0 1 1.68.15L4.17 10.7A5 5 0 0 1 5 10a4.94 4.94 0 0 1 .6-2.37L1 10Zm4.45 3.13A5 5 0 0 0 10 15a4.94 4.94 0 0 0 2.13-.48l1.86 1.86A9.4 9.4 0 0 1 10 17c-5 0-8.27-4.11-9-7a9.76 9.76 0 0 1 2.65-4.07l1.8 1.8Z" />
    </svg>
  );
}

/* ── Shared filter tag block ── */
function FilterTag({
  tag,
  isVisible,
  onToggle,
}: {
  tag: AgeFlowTag;
  isVisible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        flex w-full items-center gap-1.5 px-2 py-1 text-left text-[11px] font-medium transition-colors
        ${isVisible
          ? 'text-gray-300 hover:bg-gray-800'
          : 'text-gray-600 hover:bg-gray-800'
        }
      `}
    >
      {isVisible ? <EyeIcon /> : <EyeOffIcon />}
      <span className="truncate">{tag.name_en}</span>
    </button>
  );
}

export default function TimelinePanel({
  currentYear,
  currentEra,
  aliveCount,
  currentKing,
  currentWars,
  fieldTags,
  hiddenFieldTags,
  onFieldTagToggle,
  onYearChange,
}: TimelinePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
  const hiddenCount = hiddenFieldTags.size;

  return (
    <>
      {/* ── Mobile: bottom bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        {/* Filter layer — slides up above the bar */}
        {showMobileFilters && fieldTags.length > 0 && (
          <div className="border-t border-gray-800 bg-gray-900/95 backdrop-blur-md">
            <div className="divide-y divide-gray-800">
              {fieldTags.map((tag) => (
                <FilterTag
                  key={tag.id}
                  tag={tag}
                  isVisible={!hiddenFieldTags.has(tag.id)}
                  onToggle={() => onFieldTagToggle(tag.id)}
                />
              ))}
            </div>
          </div>
        )}

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
            {currentWars.length > 0 && (
              <p className="text-[10px] font-semibold text-red-400">
                ⚔ {currentWars.map((w) => w.name).join(', ')}
              </p>
            )}
          </div>

          {/* Filter toggle (mobile only) */}
          <button
            onClick={() => setShowMobileFilters((v) => !v)}
            className={`relative shrink-0 rounded-md p-1.5 transition-colors ${
              showMobileFilters || hiddenCount > 0
                ? 'bg-emerald-600/20 text-emerald-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Toggle filters"
          >
            <EyeIcon size={16} />
            {hiddenCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">
                {hiddenCount}
              </span>
            )}
          </button>

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
        <div className="w-44 overflow-hidden rounded-lg bg-gray-900/90 backdrop-blur-md">
          <div className="px-3 py-3 text-center">
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

            {/* War status */}
            {currentWars.length > 0 && (
              <>
                <div className="mt-2 border-t border-red-800/40" />
                <div className="mt-1.5 flex items-center justify-center gap-1">
                  <span className="text-sm">⚔</span>
                  <span className="text-[11px] font-semibold text-red-400">At War</span>
                </div>
                {currentWars.map((w) => (
                  <p key={w.name} className="mt-0.5 text-[10px] text-red-300/80">
                    {w.name}
                  </p>
                ))}
              </>
            )}
          </div>

          {/* Field tag filters — always visible, block list */}
          {fieldTags.length > 0 && (
            <div className="border-t border-gray-700">
              <div className="divide-y divide-gray-800">
                {fieldTags.map((tag) => (
                  <FilterTag
                    key={tag.id}
                    tag={tag}
                    isVisible={!hiddenFieldTags.has(tag.id)}
                    onToggle={() => onFieldTagToggle(tag.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
