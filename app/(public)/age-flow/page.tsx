import type { Metadata } from 'next';
import { getAgeFlowData } from '@/lib/age-flow-data';
import { parseInitialYear, parseFocusSlug, parseYearSegment } from '@/lib/age-flow';
import { ageFlowJsonLd } from '@/lib/jsonld';
import AgeFlowClient from './AgeFlowClient';

// Dynamic: initial year comes from ?year=. Data itself is cached (lib/age-flow-data.ts).
export const dynamic = 'force-dynamic';

async function fetchAgeFlowData() {
  try {
    return await getAgeFlowData();
  } catch (err) {
    console.error('[age-flow] SSR fetch failed:', err);
    // Return null to let client-side fetch take over
    return null;
  }
}

interface Props {
  searchParams: { year?: string | string[]; focus?: string | string[] };
}

// Shared ?year= links get that year's share card (canonical stays /age-flow)
export function generateMetadata({ searchParams }: Props): Metadata {
  const raw = Array.isArray(searchParams.year) ? searchParams.year[0] : searchParams.year;
  const year = raw ? parseYearSegment(raw) : null;
  if (year === null) return {};

  const title = `${year} — Age Flow | Sillok`;
  const description = `Who was alive in Korea in ${year}? Scroll through the interactive timeline of Korean historical figures.`;
  const image = `/api/og/age-flow/${year}`;
  return {
    openGraph: { title, description, url: `https://sillok.kr/age-flow?year=${year}`, type: 'website', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function AgeFlowPage({ searchParams }: Props) {
  const initialData = await fetchAgeFlowData();
  const initialFocus = parseFocusSlug(searchParams.focus);
  // ?focus= without ?year= starts at the focused figure's birth
  const focusBirth = initialFocus
    ? initialData?.persons.find((p) => p.slug === initialFocus)?.birth_year
    : undefined;
  const initialYear = parseInitialYear(
    searchParams.year ?? (focusBirth !== undefined ? String(focusBirth) : undefined)
  );
  // If SSR returned no persons, pass undefined so client fetches its own data
  const hasPersons = initialData && initialData.persons.length > 0;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ageFlowJsonLd()) }}
      />
      <h1 className="sr-only">Age Flow — Interactive Timeline of Korean Historical Figures</h1>
      <AgeFlowClient
        initialData={hasPersons ? initialData : undefined}
        initialYear={initialYear}
        initialFocus={initialFocus}
      />
    </>
  );
}
