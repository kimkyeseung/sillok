'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Sheet from './Sheet';
import { isAliveIn } from '@/lib/age-flow';
import { AgeFlowPerson, getAge } from './useAgeFlow';
import PersonAvatar, { getPrimaryFieldTag } from '@/components/common/PersonAvatar';

export type FigureListTab = 'alive' | 'all';

interface FigureListSheetProps {
  open: boolean;
  initialTab: FigureListTab;
  alivePersons: AgeFlowPerson[];
  allPersons: AgeFlowPerson[];
  currentYear: number;
  focusSlug: string | null;
  onFocus: (slug: string) => void;
  onClose: () => void;
}

const MAX_ROWS = 200;

function matches(p: AgeFlowPerson, q: string): boolean {
  return (
    p.name_ko.includes(q) ||
    (p.name_en?.toLowerCase().includes(q) ?? false) ||
    p.slug.includes(q)
  );
}

/** Everyone alive this year (cards that don't fit on screen) + search across all figures */
export default function FigureListSheet(props: FigureListSheetProps) {
  if (!props.open) return null;
  // Remount per open so tab/query reset
  return <FigureListSheetInner {...props} />;
}

function FigureListSheetInner({
  initialTab,
  alivePersons,
  allPersons,
  currentYear,
  focusSlug,
  onFocus,
  onClose,
}: FigureListSheetProps) {
  const [tab, setTab] = useState<FigureListTab>(initialTab);
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const source = tab === 'alive' ? alivePersons : allPersons;
    const q = query.trim().toLowerCase();
    return q ? source.filter((p) => matches(p, q)) : source;
  }, [tab, alivePersons, allPersons, query]);

  return (
    <Sheet open onClose={onClose} title="Figures">
      <div className="sticky top-0 z-10 space-y-2 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex gap-1">
          {(['alive', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                tab === t ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t === 'alive'
                ? `Alive in ${currentYear} (${alivePersons.length})`
                : `All figures (${allPersons.length})`}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400"
        />
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-400">No matching figures</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.slice(0, MAX_ROWS).map((p) => {
            const alive = isAliveIn(p, currentYear);
            const isFocused = p.slug === focusSlug;
            return (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {p.thumbnail ? (
                    <Image src={p.thumbnail} alt="" fill sizes="36px" className="object-cover" />
                  ) : (
                    <PersonAvatar name={p.name_ko} fieldTag={getPrimaryFieldTag(p.tags)} size="sm" />
                  )}
                </div>
                <Link href={`/persons/${p.slug}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {p.name_en || p.name_ko}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.birth_year}–{p.is_alive ? '' : p.death_year}
                    {alive && ` · age ${getAge(p.birth_year, currentYear)}`}
                  </p>
                </Link>
                <button
                  onClick={() => {
                    onFocus(p.slug);
                    onClose();
                  }}
                  disabled={isFocused}
                  className="shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:border-brand-200 disabled:text-brand-600"
                >
                  {isFocused ? 'Focused' : 'Focus'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > MAX_ROWS && (
        <p className="px-4 py-3 text-center text-xs text-gray-400">
          Showing {MAX_ROWS} of {rows.length} — refine your search
        </p>
      )}
    </Sheet>
  );
}
