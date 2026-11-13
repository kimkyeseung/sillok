import Link from 'next/link';
import Image from 'next/image';
import PersonAvatar from '@/components/common/PersonAvatar';

export interface FigureCard {
  id: string;
  slug: string;
  name_en: string;
  name_ko: string;
  name_hanja: string | null;
  birth_year: number | null;
  death_year: number | null;
  thumbnail: string | null;
  /** tags.name_en of the primary FIELD tag (avatar style) */
  fieldTag?: string | null;
}

/**
 * Card grid of figures. Links are not prefetched: a hub lists hundreds of figures and
 * prefetching each would regenerate that many person pages per visit.
 */
export default function FigureGrid({ figures }: { figures: FigureCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {figures.map((person) => (
        <Link key={person.id} href={`/persons/${person.slug}`} prefetch={false} className="card group p-4 text-center">
          {person.thumbnail ? (
            <Image
              src={person.thumbnail}
              alt={person.name_en}
              width={80}
              height={80}
              className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-gray-100 transition-all group-hover:ring-brand-200"
            />
          ) : (
            <div className="mx-auto h-20 w-20 overflow-hidden rounded-full ring-2 ring-gray-100 transition-all group-hover:ring-brand-200">
              <PersonAvatar name={person.name_ko} fieldTag={person.fieldTag ?? null} size="lg" />
            </div>
          )}
          <p className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-brand-600">{person.name_en}</p>
          {person.name_hanja && <p className="text-xs text-gray-400">{person.name_hanja}</p>}
          {(person.birth_year || person.death_year) && (
            <p className="mt-0.5 text-xs text-gray-400">
              {person.birth_year ?? '?'} ~ {person.death_year ?? '?'}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
