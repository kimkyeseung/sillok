import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import FollowButton from '@/components/person/FollowButton';
import VoteTodayButton from '@/components/person/VoteTodayButton';
import PersonRequestButton from '@/components/person/PersonRequestButton';
import PersonTabs from '@/components/person/PersonTabs';
import ViewTracker from '@/components/person/ViewTracker';
import PersonAvatar from '@/components/common/PersonAvatar';
import { personJsonLd } from '@/lib/jsonld';
import { getPrimaryFieldTag } from '@/lib/person-utils';
import { getPersonBySlug, getTabCounts } from '@/lib/person-page';
import { personTabs } from '@/lib/person-sections';
import { tagLabel } from '@/lib/tags';

// Supabase calls go through fetch — without this, Next 14 caches them indefinitely
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function PersonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const person = await getPersonBySlug(params.slug);
  if (!person) notFound();

  const counts = await getTabCounts(person);
  const tabs = personTabs(params.slug, counts);
  const lifespan =
    person.birth_year && person.death_year ? person.death_year - person.birth_year : null;

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(person)) }}
      />
      <ViewTracker targetType="PERSON" targetId={person.id} />

      {/* Profile header */}
      <div className="card-flat overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-500 to-brand-700" />
        <div className="px-6 pb-2">
          <div className="-mt-12 flex flex-wrap items-end gap-5">
            {person.thumbnail ? (
              <Image
                src={person.thumbnail}
                alt={person.name_en}
                width={96}
                height={96}
                priority
                className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md"
              />
            ) : (
              <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-md">
                <PersonAvatar
                  name={person.name_ko || person.name_en}
                  fieldTag={getPrimaryFieldTag(person.tags)}
                  size="lg"
                />
              </div>
            )}
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-2xl font-bold text-gray-900">{person.name_en}</h1>
              {person.name_hanja && <p className="text-sm text-gray-500">{person.name_hanja}</p>}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {(person.birth_year || person.death_year) && (
              <span className="badge-gray">
                {person.birth_year ?? '?'} ~ {person.death_year ?? '?'}
              </span>
            )}
            {person.tags.map((tag) => (
              <span key={tag.id} className="badge-brand">
                {tag.name_en ? tagLabel(tag.name_en) : tag.name_ko}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <div>
              <span className="font-semibold text-gray-900">
                {(person.view_count ?? 0).toLocaleString()}
              </span>
              <span className="ml-1 text-gray-500">views</span>
            </div>
            <FollowButton
              targetType="person"
              targetId={person.id}
              initialCount={person.follow_count ?? 0}
            />
            <VoteTodayButton personSlug={params.slug} />
          </div>

          <div className="mt-4">
            <PersonTabs tabs={tabs} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">{children}</div>

        <aside className="space-y-6">
          {/* Quick facts */}
          <div className="card-flat p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Quick Facts</h2>
            <dl className="space-y-2 text-sm">
              {person.birth_year != null && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Born</dt>
                  <dd className="text-right text-gray-900">
                    {person.birth_year}
                    {person.birth_place && (
                      <span className="block text-xs text-gray-500">{person.birth_place}</span>
                    )}
                  </dd>
                </div>
              )}
              {person.death_year != null && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Died</dt>
                  <dd className="text-gray-900">
                    {person.death_year}
                    {lifespan != null && <span className="text-gray-500"> (aged ~{lifespan})</span>}
                  </dd>
                </div>
              )}
              {person.name_hanja && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Hanja</dt>
                  <dd className="text-gray-900">{person.name_hanja}</dd>
                </div>
              )}
            </dl>
            {person.birth_year != null && (
              <Link
                href={`/age-flow?year=${person.birth_year}`}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
              >
                Explore this era in Age Flow →
              </Link>
            )}
          </div>

          <div className="card-flat p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Missing a figure?</h2>
            <p className="mb-3 text-xs text-gray-500">
              If you can&apos;t find someone, request them to be added.
            </p>
            <PersonRequestButton />
          </div>
        </aside>
      </div>
    </div>
  );
}
