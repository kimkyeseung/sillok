import Link from 'next/link';
import Image from 'next/image';
import PersonAvatar from '@/components/common/PersonAvatar';

interface Props {
  person: {
    slug: string;
    name_en: string;
    thumbnail: string | null;
    birth_year: number | null;
    death_year: number | null;
  };
  /** Small label under the name (e.g. "Parent", "Shared 53 years") */
  label?: string;
  description?: string | null;
}

/** Compact linked person row used in relations, contemporaries and previews */
export default function PersonMiniCard({ person, label, description }: Props) {
  const years =
    person.birth_year || person.death_year
      ? `${person.birth_year ?? '?'} – ${person.death_year ?? '?'}`
      : null;

  return (
    <Link
      href={`/persons/${person.slug}`}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50"
    >
      {person.thumbnail ? (
        <Image
          src={person.thumbnail}
          alt={person.name_en}
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
          <PersonAvatar name={person.name_en} size="sm" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{person.name_en}</p>
        <p className="truncate text-xs text-gray-500">
          {[label, years].filter(Boolean).join(' · ')}
        </p>
        {description && <p className="mt-0.5 truncate text-xs text-gray-400">{description}</p>}
      </div>
    </Link>
  );
}
