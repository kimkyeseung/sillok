import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAgeFlowData } from '@/lib/age-flow-data';
import {
  describeYear,
  getYearSnapshot,
  parseYearSegment,
  JOSEON_START,
  JOSEON_END,
  type YearSnapshot,
} from '@/lib/age-flow';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { truncateDescription } from '@/lib/seo';
import PersonAvatar from '@/components/common/PersonAvatar';
import { getPrimaryFieldTag } from '@/lib/person-utils';
import type { AgeFlowPerson } from '@/components/age-flow/useAgeFlow';

// Data is cached in getAgeFlowData (5 min); errors throw so nothing empty is cached
export const dynamic = 'force-dynamic';

interface Props {
  params: { year: string };
}

const MAX_FIGURES = 120;

async function getSnapshot(segment: string): Promise<YearSnapshot | null> {
  const year = parseYearSegment(segment);
  if (year === null) return null;
  return getYearSnapshot(await getAgeFlowData(), year);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const snapshot = await getSnapshot(params.year);
  if (!snapshot) return {};

  const { year } = snapshot;
  const title = `Korea in ${year} — Who Was Alive`;
  const description = truncateDescription(describeYear(snapshot));
  const image = `/api/og/age-flow/${year}`;

  return {
    title,
    description,
    alternates: { canonical: `/age-flow/${year}` },
    // Thin years (few figures) stay out of the index — same rule as empty boards
    ...(!snapshot.indexable && { robots: { index: false, follow: true } }),
    openGraph: {
      title: `${title} | Sillok`,
      description,
      url: `https://sillok.kr/age-flow/${year}`,
      type: 'website',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Sillok`,
      description,
      images: [image],
    },
  };
}

function age(p: AgeFlowPerson, year: number) {
  return Math.max(1, year - p.birth_year);
}

function Avatar({ person, size }: { person: AgeFlowPerson; size: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-gray-100"
      style={{ width: size, height: size }}
    >
      {person.thumbnail ? (
        <Image src={person.thumbnail} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <PersonAvatar name={person.name_ko} fieldTag={getPrimaryFieldTag(person.tags)} size="sm" />
      )}
    </div>
  );
}

function PersonRow({ person, year, note }: { person: AgeFlowPerson; year: number; note?: string }) {
  return (
    <Link
      href={`/persons/${person.slug}`}
      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors hover:border-brand-300"
    >
      <Avatar person={person} size={36} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{person.name_en || person.name_ko}</p>
        <p className="text-xs text-gray-500">
          {note ?? `Age ${age(person, year)}`} · {person.birth_year}–{person.is_alive ? '' : person.death_year}
        </p>
      </div>
    </Link>
  );
}

export default async function AgeFlowYearPage({ params }: Props) {
  const snapshot = await getSnapshot(params.year);
  if (!snapshot) notFound();

  const { year, era, alive, king, wars, events, born, died } = snapshot;
  const figures = alive.filter((p) => p.id !== king?.id);

  return (
    <article className="mx-auto max-w-4xl py-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Age Flow', path: '/age-flow' },
              { name: String(year), path: `/age-flow/${year}` },
            ])
          ),
        }}
      />

      <nav className="mb-3 text-xs text-gray-500">
        <Link href="/age-flow" className="hover:text-brand-600">Age Flow</Link>
        <span className="mx-1.5">›</span>
        <span className="text-gray-700">{year}</span>
      </nav>

      <header className="mb-6">
        <p className="text-sm font-medium text-brand-600">{era} era</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Korea in {year}</h1>
        <p className="mt-3 text-gray-600">{describeYear(snapshot)}</p>
        <Link
          href={`/age-flow?year=${year}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Explore {year} in Age Flow →
        </Link>
      </header>

      {(king || wars.length > 0) && (
        <section className="mb-8 grid gap-3 sm:grid-cols-2">
          {king && (
            <Link
              href={`/persons/${king.slug}`}
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 hover:border-amber-300"
            >
              <Avatar person={king} size={48} />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Reigning</p>
                <p className="truncate font-semibold text-gray-900">{king.name_en || king.name_ko}</p>
                <p className="text-xs text-gray-500">Age {age(king, year)}</p>
              </div>
            </Link>
          )}
          {wars.map((w) => (
            <Link
              key={w.slug}
              href={`/nodes/${w.slug}`}
              className="rounded-xl border border-red-200 bg-red-50/60 p-4 hover:border-red-300"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">⚔ At war</p>
              <p className="font-semibold text-gray-900">{w.name}</p>
              <p className="text-xs text-gray-500">
                {w.startYear === w.endYear ? w.startYear : `${w.startYear}–${w.endYear}`}
              </p>
            </Link>
          ))}
        </section>
      )}

      {events.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Events in {year}</h2>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/nodes/${e.slug}`} className="text-sm font-medium text-brand-700 hover:underline">
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(born.length > 0 || died.length > 0) && (
        <section className="mb-8 grid gap-6 sm:grid-cols-2">
          {born.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Born in {year}</h2>
              <div className="space-y-2">
                {born.map((p) => <PersonRow key={p.id} person={p} year={year} note="Born" />)}
              </div>
            </div>
          )}
          {died.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Died in {year}</h2>
              <div className="space-y-2">
                {died.map((p) => (
                  <PersonRow key={p.id} person={p} year={year} note={`Died at ${age(p, year)}`} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Figures alive in {year} <span className="font-normal text-gray-400">({alive.length})</span>
        </h2>
        {figures.length === 0 ? (
          <p className="text-sm text-gray-500">No figures recorded for this year yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {figures.slice(0, MAX_FIGURES).map((p) => <PersonRow key={p.id} person={p} year={year} />)}
          </div>
        )}
        {figures.length > MAX_FIGURES && (
          <p className="mt-3 text-sm text-gray-500">
            And {figures.length - MAX_FIGURES} more —{' '}
            <Link href={`/age-flow?year=${year}`} className="text-brand-600 hover:underline">
              see everyone in Age Flow
            </Link>
          </p>
        )}
      </section>

      <nav className="flex items-center justify-between border-t border-gray-200 pt-4 text-sm">
        {year > JOSEON_START ? (
          <Link href={`/age-flow/${year - 1}`} className="text-brand-600 hover:underline">← {year - 1}</Link>
        ) : <span />}
        <div className="flex gap-3 text-gray-500">
          {year - 10 >= JOSEON_START && <Link href={`/age-flow/${year - 10}`} className="hover:text-brand-600">−10</Link>}
          {year + 10 <= JOSEON_END && <Link href={`/age-flow/${year + 10}`} className="hover:text-brand-600">+10</Link>}
        </div>
        {year < JOSEON_END ? (
          <Link href={`/age-flow/${year + 1}`} className="text-brand-600 hover:underline">{year + 1} →</Link>
        ) : <span />}
      </nav>
    </article>
  );
}
