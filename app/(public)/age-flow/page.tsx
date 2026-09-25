import { getAgeFlowData } from '@/lib/age-flow-data';
import { parseInitialYear, parseFocusSlug } from '@/lib/age-flow';
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

export default async function AgeFlowPage({
  searchParams,
}: {
  searchParams: { year?: string | string[]; focus?: string | string[] };
}) {
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
      <h1 className="sr-only">Age Flow — Interactive Timeline of Korean Historical Figures</h1>
      <AgeFlowClient
        initialData={hasPersons ? initialData : undefined}
        initialYear={initialYear}
        initialFocus={initialFocus}
      />
    </>
  );
}
