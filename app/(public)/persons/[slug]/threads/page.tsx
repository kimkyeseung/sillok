import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SectionHeader from '@/components/person/SectionHeader';
import PersonThreadList, { WriteThreadLink } from '@/components/person/PersonThreadList';
import { getPersonBySlug, getPersonThreads, getTabCounts } from '@/lib/person-page';
import { personTabMetadata } from '@/lib/person-metadata';
import { isTabVisible } from '@/lib/person-sections';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return personTabMetadata(params.slug, {
    segment: 'threads',
    label: 'Threads',
    description: (_p, fullName) =>
      `Community discussions, stories and debates about ${fullName} on Sillok.`,
  });
}

export default async function PersonThreadsPage({ params }: Props) {
  const person = await getPersonBySlug(params.slug);
  if (!person) notFound();
  const counts = await getTabCounts(person);
  if (!isTabVisible('threads', counts)) notFound();

  const threads = await getPersonThreads(person.id);

  return (
    <section>
      <SectionHeader
        title={`Threads (${threads.length})`}
        action={<WriteThreadLink personId={person.id} personName={person.name_en || person.name_ko} />}
      />
      <PersonThreadList threads={threads} />
    </section>
  );
}
