import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SectionHeader from '@/components/person/SectionHeader';
import { getPersonBySlug, getPersonStats } from '@/lib/person-page';
import { personTabMetadata } from '@/lib/person-metadata';
import PersonBreadcrumbJsonLd from '@/components/person/PersonBreadcrumbJsonLd';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return personTabMetadata(params.slug, {
    segment: 'stats',
    label: 'Stats',
    description: (_p, fullName) => `Community stats for ${fullName} on Sillok.`,
    // Numbers only — low value for search results
    noindex: true,
  });
}

export default async function PersonStatsPage({ params }: Props) {
  const person = await getPersonBySlug(params.slug);
  if (!person) notFound();
  const s = await getPersonStats(person);

  const groups: { title: string; items: { label: string; value: number; hint?: string }[] }[] = [
    {
      title: 'Community',
      items: [
        { label: 'Total views', value: s.views },
        { label: 'Views (30 days)', value: s.views30 },
        { label: 'Followers', value: s.followers },
        { label: 'Threads', value: s.threads },
        { label: 'In collections', value: s.collections },
        { label: 'Person of the Day votes', value: s.votes, hint: s.voteDays ? `on ${s.voteDays} days` : undefined },
      ],
    },
    {
      title: 'Archive',
      items: [
        { label: 'Timeline entries', value: s.timeline },
        { label: 'Relations', value: s.relations },
        { label: 'Artifacts · Media · Events', value: s.related },
        { label: 'Images', value: s.gallery },
        { label: 'Contemporaries on Sillok', value: s.contemporaries },
      ],
    },
  ];

  return (
    <>
      <PersonBreadcrumbJsonLd person={person} tab={{ label: 'Stats', segment: 'stats' }} />
      {groups.map((g) => (
        <section key={g.title}>
          <SectionHeader title={g.title} />
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {g.items.map((item) => (
              <div key={item.label} className="card-flat p-4">
                <dt className="text-xs text-gray-500">{item.label}</dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">{item.value.toLocaleString()}</dd>
                {item.hint && <p className="text-[11px] text-gray-400">{item.hint}</p>}
              </div>
            ))}
          </dl>
        </section>
      ))}
    </>
  );
}
