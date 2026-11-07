import type { Metadata } from 'next';
import Link from 'next/link';
import RoyalFamilyFlow from '@/components/age-flow/RoyalFamilyFlow';
import { getAgeFlowData } from '@/lib/age-flow-data';
import { parseInitialYear } from '@/lib/age-flow';
import { ROYAL_FAMILY } from '@/lib/joseon-royal-family';
import { royalFamilyJsonLd } from '@/lib/jsonld';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';

// Dynamic: initial year comes from ?year=. Data itself is cached (lib/age-flow-data.ts).
export const dynamic = 'force-dynamic';

const TITLE = 'Joseon Royal Family Tree — Kings, Queens, Princes and Princesses';
const DESCRIPTION =
  'Scroll through the Joseon dynasty year by year and watch the royal family change: 27 monarchs from Taejo to Sunjong with their queens, consorts, princes and princesses.';

/** The founding of Joseon: the first year with a full court on screen */
const DEFAULT_YEAR = '1392';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/age-flow/royal-family' },
  openGraph: {
    title: `${TITLE} | Sillok`,
    description: DESCRIPTION,
    url: 'https://sillok.kr/age-flow/royal-family',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [DEFAULT_OG_IMAGE] },
};

interface Props {
  searchParams: { year?: string | string[] };
}

export default async function RoyalFamilyPage({ searchParams }: Props) {
  const full = await getAgeFlowData().catch((err) => {
    console.error('[royal-family] SSR fetch failed:', err);
    return null; // the client fetches its own data
  });

  // Only what this view reads: the family's records, plus reigns and wars for the sidebar
  const slugs = new Set(ROYAL_FAMILY.flatMap((p) => (p.slug ? [p.slug] : [])));
  const persons = full?.persons.filter((p) => slugs.has(p.slug)) ?? [];
  const initialData = full ? { ...full, persons, artifacts: [] } : undefined;
  const pageSlugs = new Map(persons.map((p) => [p.slug, p.name_en || p.name_ko]));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            royalFamilyJsonLd(TITLE, Array.from(pageSlugs, ([slug, name_en]) => ({ slug, name_en })))
          ),
        }}
      />
      <h1 className="sr-only">Joseon Royal Family Tree</h1>
      {/* Only one year is on screen at a time: this keeps the whole family readable without scrolling */}
      <ul className="sr-only">
        {ROYAL_FAMILY.map((person) => (
          <li key={person.id}>
            {person.slug && pageSlugs.has(person.slug) ? (
              <Link href={`/persons/${person.slug}`} prefetch={false}>
                {person.name}
              </Link>
            ) : (
              person.name
            )}
          </li>
        ))}
      </ul>
      <RoyalFamilyFlow
        initialData={initialData}
        initialYear={parseInitialYear(searchParams.year ?? DEFAULT_YEAR)}
      />
    </>
  );
}
