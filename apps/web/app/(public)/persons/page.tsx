import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';

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
      'id, slug, name_ko, name_hanja, birth_year, death_year, thumbnail, description'
    )
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(40);

  if (searchParams.q) {
    query = query.ilike('name_ko', `%${searchParams.q}%`);
  }

  const { data: persons } = await query;

  return (
    <div>
      {/* 상단 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">인물</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            한국 역사 속 인물을 탐색하세요
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            type="text"
            placeholder="인물 이름 검색..."
            defaultValue={searchParams.q}
            className="input max-w-xs"
          />
          <button type="submit" className="btn-primary">
            검색
          </button>
        </form>
      </div>

      {/* 그리드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(persons ?? []).map((person) => (
          <Link
            key={person.id}
            href={`/persons/${person.slug}`}
            className="card group p-4 text-center"
          >
            {person.thumbnail ? (
              <img
                src={person.thumbnail}
                alt={person.name_ko}
                className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-gray-100 transition-all group-hover:ring-brand-200"
              />
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-2xl font-bold text-brand-600 ring-2 ring-gray-100 transition-all group-hover:ring-brand-200">
                {person.name_ko.charAt(0)}
              </div>
            )}
            <p className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-brand-600">
              {person.name_ko}
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
              ? `"${searchParams.q}" 검색 결과가 없습니다`
              : '등록된 인물이 없습니다'}
          </p>
          <p className="text-xs text-gray-400">
            {searchParams.q ? '다른 검색어를 입력해보세요' : '곧 인물이 등록될 예정입니다'}
          </p>
        </div>
      )}
    </div>
  );
}
