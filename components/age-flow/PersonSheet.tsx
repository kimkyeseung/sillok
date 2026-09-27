'use client';

import Link from 'next/link';
import Sheet from './Sheet';
import { AgeFlowPerson, RELATION_STYLES, getAge } from './useAgeFlow';
import { usePersonDetail, usePersonRelations } from './usePersonDetail';
import { PersonDetailBody, PersonDetailSkeleton } from './PersonHoverPanel';

interface PersonSheetProps {
  person: AgeFlowPerson | null;
  currentYear: number;
  isFocused: boolean;
  onFocus: (slug: string | null) => void;
  onClose: () => void;
}

const RELATION_LABELS: Record<string, string> = {
  FAMILY: 'Family',
  ALLY: 'Ally',
  RIVAL: 'Rival',
  TEACHER: 'Teacher',
  INFLUENCE: 'Influence',
  LORD_VASSAL: 'Lord / Vassal',
  MEMBER_OF: 'Member of',
  FOUNDED: 'Founded',
  AFFILIATED: 'Affiliated',
};

/** Tap target on touch devices, where hover panel and relation lines can't open */
export default function PersonSheet({
  person,
  currentYear,
  isFocused,
  onFocus,
  onClose,
}: PersonSheetProps) {
  const slug = person?.slug ?? null;
  const { data: detail } = usePersonDetail(slug);
  const { data: relations } = usePersonRelations(slug);

  if (!person) return null;
  const name = person.name_en || person.name_ko;

  return (
    <Sheet open onClose={onClose} title={`${name} in ${currentYear}`}>
      <div className="p-4">
        <p className="mb-3 text-xs text-gray-500">
          Age {getAge(person.birth_year, currentYear)} in {currentYear}
        </p>

        {detail ? <PersonDetailBody detail={detail} /> : <PersonDetailSkeleton />}

        <div className="mt-4 flex gap-2">
          <Link
            href={`/persons/${person.slug}`}
            className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white"
          >
            View profile
          </Link>
          <button
            onClick={() => {
              onFocus(isFocused ? null : person.slug);
              onClose();
            }}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
          >
            {isFocused ? 'Clear focus' : 'Show contemporaries'}
          </button>
        </div>

        {relations && relations.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Relations
            </h3>
            <ul className="divide-y divide-gray-100">
              {relations.map((rel) =>
                rel.other_person ? (
                  <li key={rel.relation_id}>
                    <Link
                      href={`/persons/${rel.other_person.slug}`}
                      className="flex items-center gap-2 py-2 text-sm"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: RELATION_STYLES[rel.rel_type]?.color ?? '#94a3b8' }}
                      />
                      <span className="min-w-0 flex-1 truncate text-gray-800">
                        {rel.other_person.name_en || rel.other_person.name_ko}
                      </span>
                      <span className="shrink-0 text-xs text-gray-400">
                        {RELATION_LABELS[rel.rel_type] ?? rel.rel_type}
                      </span>
                    </Link>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        )}
      </div>
    </Sheet>
  );
}
