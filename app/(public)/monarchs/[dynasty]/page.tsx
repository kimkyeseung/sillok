import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PersonAvatar from '@/components/common/PersonAvatar';
import {
  DYNASTIES,
  DYNASTY_PAGE_MIN_LINKED,
  dynastyPath,
  findDynasty,
  formatEraYear,
  formatReigns,
  ordinal,
  rulerTitle,
  type Dynasty,
} from '@/lib/monarchs';
import { getDynastyRoster } from '@/lib/monarchs-data';
import { breadcrumbJsonLd, dynastyListJsonLd } from '@/lib/jsonld';
import { DEFAULT_OG_IMAGE, truncateDescription, truncateText } from '@/lib/seo';

// ISR like the person pages; the list changes only when a ruler's page is published
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

interface Props {
  params: { dynasty: string };
}

const years = (d: Dynasty) => `${formatEraYear(d.start)}–${formatEraYear(d.end)}`;

/** "Kings of Joseon: All 27 in Order (1392–1897)" */
const pageTitle = (d: Dynasty) => `${d.title}: All ${d.monarchs.length} in Order (${years(d)})`;

const pageDescription = (d: Dynasty) =>
  truncateDescription(
    `Every ruler of ${d.name} (${d.ko}), ${years(d)}, in order of succession — reign years, portraits and biographies. ${d.intro}`
  );

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dynasty = findDynasty(params.dynasty);
  if (!dynasty) return {};
  const roster = await getDynastyRoster(dynasty);
  const linked = roster.filter((r) => r.person).length;
  const title = pageTitle(dynasty);
  const description = pageDescription(dynasty);
  const image = roster.find((r) => r.person?.thumbnail)?.person?.thumbnail ?? DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: dynastyPath(dynasty) },
    keywords: [dynasty.title, `${dynasty.name} kings`, `${dynasty.name} dynasty`, `${dynasty.ko} 왕`, `${dynasty.ko} 역대 왕`],
    // Mostly gaps → thin page; stays out of the index until enough rulers have pages
    ...(linked < DYNASTY_PAGE_MIN_LINKED && { robots: { index: false, follow: true } }),
    openGraph: { title: `${title} | Sillok`, description, url: dynastyPath(dynasty), images: [image] },
    twitter: { card: 'summary', title: `${title} | Sillok`, description, images: [image] },
  };
}

export default async function DynastyPage({ params }: Props) {
  const dynasty = findDynasty(params.dynasty);
  if (!dynasty) notFound();
  const roster = await getDynastyRoster(dynasty);
  const role = rulerTitle(dynasty);
  const path = dynastyPath(dynasty);

  const jsonLd = [
    breadcrumbJsonLd([
      { name: 'Home', path: '' },
      { name: 'Korean Monarchs', path: '/monarchs' },
      { name: dynasty.title, path },
    ]),
    dynastyListJsonLd({
      name: pageTitle(dynasty),
      description: pageDescription(dynasty),
      path,
      rulers: roster.map((r) => ({
        name: r.person?.name_en ?? r.monarch.en,
        alternateName: r.monarch.ko,
        slug: r.person?.slug,
        jobTitle: `${ordinal(r.order)} ${role}`,
      })),
    }),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs text-gray-500">
        <Link href="/monarchs" className="hover:text-brand-700 hover:underline">
          Korean Monarchs
        </Link>
        <span className="mx-1.5">›</span>
        <span>{dynasty.name}</span>
      </nav>

      <header className="card-flat p-5 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">{dynasty.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {years(dynasty)} · {dynasty.monarchs.length} rulers in order of succession
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-700">{dynasty.intro}</p>
      </header>

      <ol className="card-flat divide-y divide-gray-100">
        {roster.map(({ order, monarch, person, reigns }) => {
          const name = person?.name_en ?? monarch.en;
          const avatar = (
            <span
              className={`block h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200 ${person ? '' : 'opacity-50 grayscale'}`}
            >
              {person?.thumbnail ? (
                <Image
                  src={person.thumbnail}
                  alt={`Portrait of ${name}, ${ordinal(order)} ${role}`}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <PersonAvatar name={monarch.ko} fieldTag="king" size="sm" />
              )}
            </span>
          );
          return (
            <li key={order} className="flex gap-3 px-4 py-3 sm:gap-4">
              <span className="w-10 shrink-0 pt-3 text-right text-sm font-semibold text-brand-600">
                {ordinal(order)}
              </span>
              {person ? (
                <Link href={`/persons/${person.slug}`} className="shrink-0">
                  {avatar}
                </Link>
              ) : (
                avatar
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  {person ? (
                    <Link href={`/persons/${person.slug}`} className="font-semibold text-gray-900 hover:text-brand-700 hover:underline">
                      {name}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-500">{name}</span>
                  )}
                  {person?.name_hanja && <span className="text-xs text-gray-400">{person.name_hanja}</span>}
                </div>
                <p className="text-xs text-gray-500">
                  {reigns.length > 0 ? `Reigned ${formatReigns(reigns)}` : person ? null : 'No page yet'}
                  {person && (person.birth_year || person.death_year) && (
                    <span>
                      {reigns.length > 0 && ' · '}
                      {person.birth_year ? formatEraYear(person.birth_year) : '?'}–
                      {person.death_year ? formatEraYear(person.death_year) : '?'}
                    </span>
                  )}
                </p>
                {person?.summary && (
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{truncateText(person.summary, 180)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <nav className="card-flat p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Other dynasties</h2>
        <ul className="flex flex-wrap gap-2">
          {DYNASTIES.filter((d) => d.id !== dynasty.id).map((d) => (
            <li key={d.id}>
              <Link href={dynastyPath(d)} className="badge-gray hover:bg-gray-200">
                {d.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
