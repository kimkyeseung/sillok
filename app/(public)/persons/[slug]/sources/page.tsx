import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SectionHeader from '@/components/person/SectionHeader';
import AiDraftBadge from '@/components/person/AiDraftBadge';
import { getPersonBySlug, getPersonSources, getTabCounts } from '@/lib/person-page';
import { personTabMetadata } from '@/lib/person-metadata';
import { isTabVisible } from '@/lib/person-sections';
import PersonBreadcrumbJsonLd from '@/components/person/PersonBreadcrumbJsonLd';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return personTabMetadata(params.slug, {
    segment: 'sources',
    label: 'Sources',
    description: (_p, fullName) =>
      `Primary records, encyclopedias and references about ${fullName}, including the Veritable Records of the Joseon Dynasty.`,
  });
}

const KIND_ORDER = ['PRIMARY', 'ENCYCLOPEDIA', 'BOOK', 'ARTICLE', 'WEB'] as const;
const KIND_TITLES: Record<(typeof KIND_ORDER)[number], string> = {
  PRIMARY: 'Primary Records',
  ENCYCLOPEDIA: 'Encyclopedias',
  BOOK: 'Books',
  ARTICLE: 'Articles & Papers',
  WEB: 'Web',
};

export default async function PersonSourcesPage({ params }: Props) {
  const person = await getPersonBySlug(params.slug);
  if (!person) notFound();
  const counts = await getTabCounts(person);
  if (!isTabVisible('sources', counts)) notFound();

  const sources = await getPersonSources(person.id);

  return (
    <>
      <PersonBreadcrumbJsonLd person={person} tab={{ label: 'Sources', segment: 'sources' }} />
      {KIND_ORDER.map((kind) => {
        const items = sources.filter((s) => s.kind === kind);
        if (!items.length) return null;
        return (
          <section key={kind}>
            <SectionHeader title={KIND_TITLES[kind]} />
            <ul className="card-flat divide-y divide-gray-100">
              {items.map((s) => (
                <li key={s.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-brand-700 hover:underline"
                      >
                        {s.title} ↗
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{s.title}</span>
                    )}
                    {s.is_ai_generated && <AiDraftBadge />}
                  </div>
                  {s.citation && <p className="mt-0.5 text-xs text-gray-500">{s.citation}</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
