import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import FamilyTree from '@/components/person/FamilyTree';
import RelationGraph from '@/components/person/RelationGraph';
import RelationSuggestForm from '@/components/person/RelationSuggestForm';
import PersonMiniCard from '@/components/person/PersonMiniCard';
import SectionHeader from '@/components/person/SectionHeader';
import {
  getFamilyTree,
  getPersonBySlug,
  getPersonRelations,
  getRelationGraph,
  getTabCounts,
} from '@/lib/person-page';
import { personTabMetadata } from '@/lib/person-metadata';
import { isTabVisible } from '@/lib/person-sections';
import PersonBreadcrumbJsonLd from '@/components/person/PersonBreadcrumbJsonLd';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const relations = await getPersonBySlug(params.slug).then((p) => (p ? getPersonRelations(p.id) : []));
  const names = relations.slice(0, 4).map((r) => r.other.name_en).join(', ');
  return personTabMetadata(params.slug, {
    segment: 'relations',
    label: 'Relations & Family Tree',
    description: (_p, fullName) =>
      `Family tree and relation network of ${fullName}${names ? ` — including ${names}` : ''}.`,
  });
}

const GROUP_ORDER = ['FAMILY', 'TEACHER', 'LORD_VASSAL', 'ALLY', 'RIVAL', 'INFLUENCE', 'AFFILIATED', 'MEMBER_OF', 'FOUNDED'];
const GROUP_LABELS: Record<string, string> = {
  FAMILY: 'Family',
  TEACHER: 'Teachers & Students',
  LORD_VASSAL: 'Lord & Vassals',
  ALLY: 'Allies',
  RIVAL: 'Rivals',
  INFLUENCE: 'Influence',
  AFFILIATED: 'Affiliated',
  MEMBER_OF: 'Membership',
  FOUNDED: 'Founded',
};

export default async function PersonRelationsPage({ params }: Props) {
  const person = await getPersonBySlug(params.slug);
  if (!person) notFound();
  const counts = await getTabCounts(person);
  if (!isTabVisible('relations', counts)) notFound();

  const [relations, familyTree, network] = await Promise.all([
    getPersonRelations(person.id),
    getFamilyTree(person.id),
    getRelationGraph(person.id),
  ]);
  const groups = GROUP_ORDER.map((type) => ({
    type,
    items: relations.filter((r) => r.type === type),
  })).filter((g) => g.items.length);

  return (
    <>
      <PersonBreadcrumbJsonLd person={person} tab={{ label: 'Relations', segment: 'relations' }} />
      {network && network.graph.nodes.length > 2 && (
        <section>
          <SectionHeader title="Relation Network" />
          <div className="card-flat p-4">
            <RelationGraph graph={network.graph} persons={network.persons} />
          </div>
        </section>
      )}

      {familyTree && (
        <section>
          <SectionHeader title="Family Tree" />
          <div className="card-flat">
            <FamilyTree tree={familyTree.tree} persons={familyTree.persons} />
          </div>
        </section>
      )}

      <section>
        <SectionHeader
          title={`All Relations (${relations.length})`}
          action={<RelationSuggestForm personId={person.id} personName={person.name_en} />}
        />
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.type} className="card-flat p-2">
              <h3 className="px-3 pb-1 pt-2 text-xs font-semibold text-gray-500">
                {GROUP_LABELS[g.type] ?? g.type} · {g.items.length}
              </h3>
              <div className="grid gap-1 sm:grid-cols-2">
                {g.items.map((r) => (
                  <PersonMiniCard key={r.id} person={r.other} label={r.label} description={r.description} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
