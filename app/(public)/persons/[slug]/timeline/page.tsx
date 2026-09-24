import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLifeEvents, getPersonBySlug, getTabCounts } from '@/lib/person-page';
import { personTabMetadata } from '@/lib/person-metadata';
import { isTabVisible, type LifeEvent } from '@/lib/person-sections';
import PersonBreadcrumbJsonLd from '@/components/person/PersonBreadcrumbJsonLd';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return personTabMetadata(params.slug, {
    segment: 'timeline',
    label: 'Timeline',
    description: (p, fullName) =>
      `Life timeline of ${fullName}${p.birth_year ? ` (${p.birth_year}–${p.death_year ?? ''})` : ''}: key moments, related lives and historical events.`,
  });
}

const KIND_STYLES: Record<LifeEvent['kind'], { dot: string; badge: string; label: string }> = {
  personal: { dot: 'border-brand-500 bg-white', badge: '', label: '' },
  event: { dot: 'border-purple-400 bg-purple-50', badge: 'bg-purple-50 text-purple-700', label: 'Event' },
  related: { dot: 'border-gray-300 bg-gray-50', badge: 'bg-gray-100 text-gray-600', label: 'Related' },
};

export default async function PersonTimelinePage({ params }: Props) {
  const person = await getPersonBySlug(params.slug);
  if (!person) notFound();
  const counts = await getTabCounts(person);
  if (!isTabVisible('timeline', counts)) notFound();

  const events = await getLifeEvents(person);

  return (
    <>
      <PersonBreadcrumbJsonLd person={person} tab={{ label: 'Timeline', segment: 'timeline' }} />
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Life Timeline</h2>
          {person.birth_year != null && (
            <Link
              href={`/age-flow?year=${person.birth_year}`}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View in Age Flow →
            </Link>
          )}
        </div>
        <div className="card-flat p-5">
          <ol className="relative space-y-5 pl-6 before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-8px)] before:w-0.5 before:bg-gray-100">
            {events.map((e, i) => {
              const s = KIND_STYLES[e.kind];
              return (
                <li key={`${e.year}-${i}`} className="relative">
                  <span className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 ${s.dot}`} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-brand-600">{e.year}</span>
                    {s.label && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${s.badge}`}>{s.label}</span>
                    )}
                    {person.birth_year != null && (
                      <span className="text-[10px] text-gray-400">age {e.year - person.birth_year}</span>
                    )}
                  </div>
                  {e.href ? (
                    <Link
                      href={e.href}
                      className={`mt-0.5 block text-sm hover:text-brand-700 ${e.kind === 'related' ? 'text-gray-600' : 'font-medium text-gray-900'}`}
                    >
                      {e.title}
                    </Link>
                  ) : (
                    <p className="mt-0.5 text-sm font-medium text-gray-900">{e.title}</p>
                  )}
                  {e.description && <p className="mt-0.5 text-xs text-gray-500">{e.description}</p>}
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
}
