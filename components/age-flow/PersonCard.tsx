'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AgeFlowPerson, AgeFlowTag, getAge, getInitials } from './useAgeFlow';
import PersonAvatar, { getPrimaryFieldTag } from '@/components/common/PersonAvatar';

interface PersonCardProps {
  person: AgeFlowPerson;
  currentYear: number;
  isNewborn: boolean;
  isDying: boolean;
  isDimmed: boolean;
  isHighlighted: boolean;
  isKing: boolean;
  onHover: (personId: string | null) => void;
  cardRef: (el: HTMLElement | null) => void;
}

export default function PersonCard({
  person,
  currentYear,
  isNewborn,
  isDying,
  isDimmed,
  isHighlighted,
  isKing,
  onHover,
  cardRef,
}: PersonCardProps) {
  const age = getAge(person.birth_year, currentYear);
  const displayName = person.name_en || person.name_ko;
  const eraTag = person.tags.find((t) => t.type === 'ERA');
  const fieldTags = person.tags.filter((t) => t.type === 'FIELD').slice(0, 2);

  const commonClasses = `
    rounded-lg overflow-hidden cursor-pointer
    transition-[box-shadow,border-color,opacity] duration-200
    ${isNewborn ? 'animate-card-appear' : ''}
    ${isDying ? 'animate-card-disappear' : ''}
    ${isDimmed ? 'opacity-30' : ''}
    ${isKing
      ? 'card-king-border bg-amber-50/50 shadow-sm'
      : isHighlighted
        ? 'border ring-2 ring-brand-400 border-brand-300 bg-white'
        : 'border border-gray-200 bg-white'}
    hover:shadow-md
  `;

  return (
    <Link
      href={`/persons/${person.slug}`}
      ref={cardRef}
      data-person-id={person.id}
      onMouseEnter={() => onHover(person.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* ── Mobile: horizontal card ── */}
      <div className={`flex md:hidden ${commonClasses}`}>
        {/* Thumbnail — left side */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-gray-100">
          {person.thumbnail ? (
            <Image
              src={person.thumbnail}
              alt={displayName}
              fill
              sizes="80px"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <PersonAvatar
              name={person.name_ko}
              fieldTag={getPrimaryFieldTag(person.tags)}
              size="lg"
            />
          )}
          {isKing && (
            <span className="absolute left-0.5 top-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white shadow-sm">
              King
            </span>
          )}
        </div>

        {/* Info — right side */}
        <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
          <p className="truncate text-sm font-medium text-gray-900">
            {displayName} <span className="text-gray-400">({age})</span>
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {eraTag && (
              <span className="inline-block rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                {eraTag.name_en}
              </span>
            )}
            {fieldTags.map((tag: AgeFlowTag) => (
              <span
                key={tag.id}
                className="inline-block rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
              >
                {tag.name_en}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop: vertical card ── */}
      <div className={`hidden md:block w-40 ${commonClasses}`}>
        {/* Thumbnail */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
          {person.thumbnail ? (
            <Image
              src={person.thumbnail}
              alt={displayName}
              fill
              sizes="160px"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <PersonAvatar
              name={person.name_ko}
              fieldTag={getPrimaryFieldTag(person.tags)}
              size="lg"
            />
          )}
          {isKing && (
            <span className="absolute left-1 top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
              King
            </span>
          )}
        </div>

        {/* Info */}
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium text-gray-900">
            {displayName} <span className="text-gray-400">({age})</span>
          </p>
          <div className="mt-1 flex flex-wrap gap-0.5">
            {eraTag && (
              <span className="inline-block rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                {eraTag.name_en}
              </span>
            )}
            {fieldTags.map((tag: AgeFlowTag) => (
              <span
                key={tag.id}
                className="inline-block rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
              >
                {tag.name_en}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
