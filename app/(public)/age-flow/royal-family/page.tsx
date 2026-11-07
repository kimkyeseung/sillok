import type { Metadata } from 'next';
import AgeFlowTabs from '@/components/age-flow/AgeFlowTabs';
import RoyalFamilyJump from '@/components/age-flow/RoyalFamilyJump';
import RoyalFamilyTree from '@/components/age-flow/RoyalFamilyTree';
import { ROYAL_FAMILY } from '@/lib/joseon-royal-family';
import { getRoyalRecords } from '@/lib/royal-family-data';
import { royalFamilyJsonLd } from '@/lib/jsonld';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';

// Dynamic like the timeline; the portraits are cached (lib/royal-family-data.ts)
export const dynamic = 'force-dynamic';

const TITLE = 'Joseon Royal Family Tree — Kings, Queens, Princes and Princesses';
const DESCRIPTION =
  'The family tree of the Joseon dynasty: all 27 monarchs from Taejo to Sunjong with their queens, consorts, princes and princesses.';

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

export default async function RoyalFamilyPage() {
  const records = await getRoyalRecords();
  const kings = ROYAL_FAMILY.filter((p) => p.role === 'king')
    .map((p) => ({ id: p.id, name: p.name, birth: p.birth ?? 0 }))
    .sort((a, b) => a.birth - b.birth);

  return (
    <div className="-mx-4 -mt-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(royalFamilyJsonLd(TITLE, records)) }}
      />

      <div className="sticky top-14 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2">
          <AgeFlowTabs active="royal-family" />
          <RoyalFamilyJump kings={kings} />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        <h1 className="text-2xl font-bold text-gray-900">Joseon Royal Family Tree</h1>
        <p className="mt-1 text-sm text-gray-500">
          {ROYAL_FAMILY.length} members of the royal family. Monarchs are highlighted. Scroll sideways to explore, or jump to a monarch.
        </p>
      </div>

      <RoyalFamilyTree records={records} />
    </div>
  );
}
