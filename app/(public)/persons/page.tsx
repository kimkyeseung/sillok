import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Figures',
  description: 'Explore Korean historical figures from Dangun to the present',
  alternates: { canonical: '/persons' },
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
}

export default async function PersonsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let query = supabaseAdmin
    .from('persons')
    .select(
      'id, slug, name_en, name_hanja, birth_year, death_year, thumbnail, summary'
    )
    .eq('is_deleted', false)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(40);

  if (searchParams.q) {
    query = query.or(`name_en.ilike.%${searchParams.q}%,name_ko.ilike.%${searchParams.q}%`);
  }

  const { data: persons } = await query;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Figures</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Explore Korean historical figures
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            type="text"
            placeholder="Search by name..."
            defaultValue={searchParams.q}
            className="input max-w-xs"
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(persons ?? []).map((person) => (
          <Link
            key={person.id}
            href={`/persons/${person.slug}`}
            className="card group p-4 text-center"
          >
            {person.thumbnail ? (
              <Image
                src={person.thumbnail}
                alt={person.name_en}
                width={80}
                height={80}
                className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-gray-100 transition-all group-hover:ring-brand-200"
              />
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-2xl font-bold text-brand-600 ring-2 ring-gray-100 transition-all group-hover:ring-brand-200">
                {person.name_en.charAt(0)}
              </div>
            )}
            <p className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-brand-600">
              {person.name_en}
            </p>
            {person.name_hanja && (
              <p className="text-xs text-gray-400">{person.name_hanja}</p>
            )}
            {(person.birth_year || person.death_year) && (
              <p className="mt-0.5 text-xs text-gray-400">
                {person.birth_year ?? '?'} ~ {person.death_year ?? '?'}
              </p>
            )}
          </Link>
        ))}
      </div>

      {(persons ?? []).length === 0 && (
        <div className="card-flat flex flex-col items-center py-16">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">
            {searchParams.q
              ? `No results found for "${searchParams.q}"`
              : 'No figures registered yet'}
          </p>
          <p className="text-xs text-gray-400">
            {searchParams.q ? 'Try a different search term' : 'Figures will be added soon'}
          </p>
        </div>
      )}
    </div>
  );
}
