'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Person {
  id: string;
  slug: string;
  name_en: string;
  thumbnail: string | null;
}

interface PersonPickerProps {
  value: Person | null;
  onChange: (person: Person | null) => void;
}

export default function PersonPicker({ value, onChange }: PersonPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(q.trim())}&limit=6`
        );
        const json = await res.json();
        if (json.success) {
          setResults(json.data.persons ?? []);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
        {value.thumbnail ? (
          <Image
            src={value.thumbnail}
            alt={value.name_en}
            width={24}
            height={24}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-200 text-[10px] font-bold text-brand-700">
            {value.name_en.charAt(0)}
          </span>
        )}
        <span className="text-sm font-medium text-brand-700">
          {value.name_en}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-auto text-brand-400 hover:text-brand-600"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        Figure <span className="text-red-400">*</span>
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search for a historical figure..."
        className="input text-sm"
      />
      {loading && (
        <div className="absolute right-3 top-[34px] text-xs text-gray-400">
          ...
        </div>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(p);
                  setQuery('');
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50"
              >
                {p.thumbnail ? (
                  <Image
                    src={p.thumbnail}
                    alt={p.name_en}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                    {p.name_en.charAt(0)}
                  </span>
                )}
                <span className="text-sm text-gray-800">{p.name_en}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && results.length === 0 && query.trim().length > 0 && !loading && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-center text-sm text-gray-400 shadow-lg">
          No figures found
        </div>
      )}
    </div>
  );
}
