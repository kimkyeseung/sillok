import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import LinkedNodeGrid, { NODE_TYPE_LABELS } from '@/components/person/LinkedNodeGrid';
import SectionHeader from '@/components/person/SectionHeader';
import { getLinkedNodes, getPersonBySlug, getTabCounts } from '@/lib/person-page';
import { personTabMetadata } from '@/lib/person-metadata';
import { isTabVisible } from '@/lib/person-sections';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const nodes = await getPersonBySlug(params.slug).then((p) => (p ? getLinkedNodes(p.id) : []));
  const titles = nodes.slice(0, 4).map((n) => n.title).join(', ');
  return personTabMetadata(params.slug, {
    segment: 'related',
    label: 'Artifacts, Media & Events',
    description: (_p, fullName) =>
      `Artifacts, events, films and media connected to ${fullName}${titles ? `: ${titles}` : ''}.`,
  });
}

const GROUP_ORDER = ['EVENT', 'ARTIFACT', 'MEDIA', 'GROUP', 'TOPIC'];
const GROUP_TITLES: Record<string, string> = {
  EVENT: 'Events',
  ARTIFACT: 'Artifacts',
  MEDIA: 'Films, Dramas & Books',
  GROUP: 'Groups',
  TOPIC: 'Topics',
};

export default async function PersonRelatedPage({ params }: Props) {
  const person = await getPersonBySlug(params.slug);
  if (!person) notFound();
  const counts = await getTabCounts(person);
  if (!isTabVisible('related', counts)) notFound();

  const nodes = await getLinkedNodes(person.id);
  const types = [...GROUP_ORDER, ...nodes.map((n) => n.node_type)].filter(
    (t, i, all) => all.indexOf(t) === i && nodes.some((n) => n.node_type === t)
  );

  return (
    <>
      {types.map((type) => {
        const items = nodes.filter((n) => n.node_type === type);
        return (
          <section key={type}>
            <SectionHeader title={`${GROUP_TITLES[type] ?? NODE_TYPE_LABELS[type] ?? type} (${items.length})`} />
            <LinkedNodeGrid nodes={items} />
          </section>
        );
      })}
    </>
  );
}
