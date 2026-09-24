import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import FamilyTree from '@/components/person/FamilyTree';
import PersonMiniCard from '@/components/person/PersonMiniCard';
import SectionHeader from '@/components/person/SectionHeader';
import LinkedNodeGrid from '@/components/person/LinkedNodeGrid';
import PersonThreadList, { WriteThreadLink } from '@/components/person/PersonThreadList';
import {
  getContemporaries,
  getFamilyTree,
  getGallery,
  getLifeEvents,
  getLinkedNodes,
  getPersonBySlug,
  getPersonRelations,
  getPersonThreads,
  getTabCounts,
} from '@/lib/person-page';
import { personTabMetadata } from '@/lib/person-metadata';
import { isTabVisible } from '@/lib/person-sections';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return personTabMetadata(params.slug, {
    description: (p, fullName) => (p.summary ? `${fullName} — ${p.summary}` : `About ${fullName}`),
  });
}

export default async function PersonOverviewPage({ params }: Props) {
  const person = await getPersonBySlug(params.slug);
  if (!person) notFound();

  const [counts, familyTree, relations, lifeEvents, contemporaries, gallery, nodes, threads] =
    await Promise.all([
      getTabCounts(person),
      getFamilyTree(person.id),
      getPersonRelations(person.id),
      getLifeEvents(person),
      getContemporaries(person, 8),
      getGallery(person),
      getLinkedNodes(person.id),
      getPersonThreads(person.id),
    ]);
  const base = `/persons/${params.slug}`;
  // Summary view: own milestones first; skip linked events in a year the person's own
  // timeline already covers (e.g. "Enthronement" vs "Accession of Sejong")
  const personalYears = new Set(lifeEvents.filter((e) => e.kind === 'personal').map((e) => e.year));
  const keyMoments = lifeEvents
    .filter((e) => e.kind === 'personal' || (e.kind === 'event' && !personalYears.has(e.year)))
    .slice(0, 6);

  return (
    <>
      {person.summary && (
        <section className="card-flat p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">About</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{person.summary}</p>
        </section>
      )}

      {keyMoments.length > 0 && (
        <section>
          <SectionHeader
            title="Key Moments"
            href={isTabVisible('timeline', counts) ? `${base}/timeline` : undefined}
            linkLabel="Full timeline"
          />
          <ol className="card-flat divide-y divide-gray-100">
            {keyMoments.map((e, i) => (
              <li key={`${e.year}-${i}`} className="flex gap-4 px-4 py-3">
                <span className="w-12 shrink-0 text-sm font-semibold text-brand-600">{e.year}</span>
                <div className="min-w-0">
                  {e.href ? (
                    <Link href={e.href} className="text-sm font-medium text-gray-900 hover:text-brand-700">
                      {e.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{e.title}</p>
                  )}
                  {e.description && <p className="mt-0.5 text-xs text-gray-500">{e.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {familyTree && (
        <section>
          <SectionHeader title="Family Tree" href={`${base}/relations`} linkLabel="All relations" />
          <div className="card-flat">
            <FamilyTree tree={familyTree.tree} persons={familyTree.persons} />
          </div>
        </section>
      )}

      {relations.length > 0 && (
        <section>
          <SectionHeader
            title={`Relations (${relations.length})`}
            href={relations.length > 6 || !familyTree ? `${base}/relations` : undefined}
          />
          <div className="card-flat grid gap-1 p-2 sm:grid-cols-2">
            {relations.slice(0, 6).map((r) => (
              <PersonMiniCard key={r.id} person={r.other} label={r.label} />
            ))}
          </div>
        </section>
      )}

      {contemporaries.length > 0 && (
        <section>
          <SectionHeader title="Contemporaries" />
          <p className="-mt-2 mb-3 text-xs text-gray-500">
            Figures who lived at the same time as {person.name_en}
          </p>
          <div className="card-flat grid gap-1 p-2 sm:grid-cols-2">
            {contemporaries.map((c) => (
              <PersonMiniCard key={c.id} person={c} label={`${c.overlap} years overlapping`} />
            ))}
          </div>
        </section>
      )}

      {gallery.length > 1 && (
        <section>
          <SectionHeader
            title={`Gallery (${gallery.length})`}
            href={isTabVisible('gallery', counts) ? `${base}/gallery` : undefined}
          />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {gallery.slice(0, 6).map((img) => (
              <Link
                key={img.id}
                href={isTabVisible('gallery', counts) ? `${base}/gallery` : img.href ?? base}
                className="aspect-square overflow-hidden rounded-lg bg-gray-100"
              >
                <Image
                  src={img.url}
                  alt={img.caption}
                  width={160}
                  height={160}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {nodes.length > 0 && (
        <section>
          <SectionHeader
            title="Artifacts · Media · Events"
            href={nodes.length > 4 ? `${base}/related` : undefined}
          />
          <LinkedNodeGrid nodes={nodes.slice(0, 4)} />
        </section>
      )}

      <section>
        <SectionHeader
          title="Threads"
          href={threads.length > 3 ? `${base}/threads` : undefined}
          action={<WriteThreadLink personId={person.id} personName={person.name_en || person.name_ko} />}
        />
        <PersonThreadList threads={threads.slice(0, 3)} />
      </section>
    </>
  );
}
