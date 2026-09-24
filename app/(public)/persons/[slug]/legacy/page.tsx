import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SectionHeader from '@/components/person/SectionHeader';
import { AchievementList, QuoteList, TriviaList } from '@/components/person/HighlightList';
import { getPersonBySlug, getPersonHighlights, getTabCounts } from '@/lib/person-page';
import { personTabMetadata } from '@/lib/person-metadata';
import { isTabVisible } from '@/lib/person-sections';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const highlights = await getPersonBySlug(params.slug).then((p) => (p ? getPersonHighlights(p.id) : []));
  const titles = highlights
    .filter((h) => h.kind === 'ACHIEVEMENT')
    .slice(0, 3)
    .map((h) => h.title)
    .join('; ');
  return personTabMetadata(params.slug, {
    segment: 'legacy',
    label: 'Achievements & Legacy',
    description: (_p, fullName) =>
      `Achievements and legacy of ${fullName}${titles ? `: ${titles}` : ''}.`,
  });
}

export default async function PersonLegacyPage({ params }: Props) {
  const person = await getPersonBySlug(params.slug);
  if (!person) notFound();
  const counts = await getTabCounts(person);
  if (!isTabVisible('legacy', counts)) notFound();

  const highlights = await getPersonHighlights(person.id);
  const achievements = highlights.filter((h) => h.kind === 'ACHIEVEMENT');
  const quotes = highlights.filter((h) => h.kind === 'QUOTE');
  const trivia = highlights.filter((h) => h.kind === 'TRIVIA');

  return (
    <>
      {achievements.length > 0 && (
        <section>
          <SectionHeader title={`Achievements (${achievements.length})`} />
          <AchievementList items={achievements} slug={params.slug} />
        </section>
      )}
      {quotes.length > 0 && (
        <section>
          <SectionHeader title="In Their Words" />
          <QuoteList items={quotes} speaker={person.name_en} slug={params.slug} />
        </section>
      )}
      {trivia.length > 0 && (
        <section>
          <SectionHeader title="Did You Know?" />
          <TriviaList items={trivia} slug={params.slug} />
        </section>
      )}
    </>
  );
}
