'use client';

import Image from 'next/image';
import { AgeFlowPerson, AgeFlowTag, getAge, getInitials, getEra } from './useAgeFlow';

interface PersonCardProps {
  person: AgeFlowPerson;
  currentYear: number;
  isNewborn: boolean;
  isDying: boolean;
  isDimmed: boolean;
  isHighlighted: boolean;
  onHover: (personId: string | null) => void;
  cardRef: (el: HTMLDivElement | null) => void;
}

const ERA_PLACEHOLDER_COLORS: Record<string, string> = {
  'Ancient':        'from-slate-200 to-slate-100',
  'Three Kingdoms': 'from-blue-200 to-blue-100',
  'Goryeo':         'from-emerald-200 to-emerald-100',
  'Joseon':         'from-amber-200 to-amber-100',
  'Modern':         'from-gray-200 to-gray-100',
};

export default function PersonCard({
  person,
  currentYear,
  isNewborn,
  isDying,
  isDimmed,
  isHighlighted,
  onHover,
  cardRef,
}: PersonCardProps) {
  const age = getAge(person.birth_year, currentYear);
  const displayName = person.name_en || person.name_ko;
  const era = getEra(person.birth_year);
  const eraTag = person.tags.find((t) => t.type === 'ERA');
  const fieldTags = person.tags.filter((t) => t.type === 'FIELD').slice(0, 2);

  return (
    <div
      ref={cardRef}
      data-person-id={person.id}
      className={`
        w-[120px] h-[160px] md:w-40 md:h-[200px]
        rounded-lg border bg-white overflow-hidden
        transition-all duration-200 cursor-pointer
        ${isNewborn ? 'animate-card-appear' : ''}
        ${isDying ? 'animate-card-disappear' : ''}
        ${isDimmed ? 'opacity-30' : 'opacity-100'}
        ${isHighlighted ? 'ring-2 ring-brand-400 border-brand-300' : 'border-gray-200'}
        hover:shadow-md
      `}
      onMouseEnter={() => onHover(person.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {person.thumbnail ? (
          <Image
            src={person.thumbnail}
            alt={displayName}
            fill
            sizes="(max-width: 768px) 120px, 160px"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${ERA_PLACEHOLDER_COLORS[era] || 'from-gray-200 to-gray-100'}`}
          >
            <span className="text-2xl font-bold text-gray-400 md:text-3xl">
              {getInitials(person.name_ko)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2 py-1.5">
        <p className="truncate text-xs font-medium text-gray-900 md:text-sm">
          {displayName} <span className="text-gray-400">({age})</span>
        </p>
        <div className="mt-0.5 flex flex-wrap gap-0.5">
          {eraTag && (
            <span className="inline-block rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600 md:text-[10px]">
              {eraTag.name_en}
            </span>
          )}
          {fieldTags.map((tag: AgeFlowTag) => (
            <span
              key={tag.id}
              className="inline-block rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600 md:text-[10px]"
            >
              {tag.name_en}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
