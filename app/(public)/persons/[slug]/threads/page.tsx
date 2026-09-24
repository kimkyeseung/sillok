import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SectionHeader from '@/components/person/SectionHeader';
import PersonThreadList, { WriteThreadLink } from '@/components/person/PersonThreadList';
import { getPersonBySlug, getPersonThreads, getTabCounts } from '@/lib/person-page';
import { personTabMetadata } from '@/lib/person-metadata';
import { isTabVisible } from '@/lib/person-sections';
import Link from 'next/link';
import { THREAD_CATEGORIES } from '@/lib/community';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { slug: string };
  searchParams: { category?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return personTabMetadata(params.slug, {
    segment: 'threads',
    label: 'Threads',
    description: (_p, fullName) =>
      `Community discussions, stories and debates about ${fullName} on Sillok.`,
  });
}

export default async function PersonThreadsPage({ params, searchParams }: Props) {
  const person = await getPersonBySlug(params.slug);
  if (!person) notFound();
  const counts = await getTabCounts(person);
  if (!isTabVisible('threads', counts)) notFound();

  const threads = await getPersonThreads(person.id);
  const active = THREAD_CATEGORIES.find((c) => c.value === searchParams.category)?.value ?? null;
  const used = THREAD_CATEGORIES.filter((c) => threads.some((t) => t.category === c.value));
  const shown = active ? threads.filter((t) => t.category === active) : threads;
  const base = `/persons/${params.slug}/threads`;

  return (
    <section>
      <SectionHeader
        title={`Threads (${threads.length})`}
        action={<WriteThreadLink personId={person.id} personName={person.name_en || person.name_ko} />}
      />
      {used.length > 1 && (
        <nav aria-label="Thread categories" className="mb-3 flex flex-wrap gap-1.5">
          {[{ value: null, label: 'All' }, ...used].map((c) => (
            <Link
              key={c.value ?? 'all'}
              href={c.value ? `${base}?category=${c.value}` : base}
              scroll={false}
              aria-current={active === c.value ? 'page' : undefined}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                active === c.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.label}
              {c.value && ` · ${threads.filter((t) => t.category === c.value).length}`}
            </Link>
          ))}
        </nav>
      )}
      <PersonThreadList threads={shown} />
    </section>
  );
}
