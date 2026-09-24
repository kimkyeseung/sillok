import type { Metadata } from 'next';
import { ageFlowJsonLd } from '@/lib/jsonld';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Age Flow — Interactive Timeline of Korean Historical Figures',
  description:
    'Scroll through centuries of Korean history and watch historical figures appear, live, and pass away in an interactive timeline from Joseon to modern Korea.',
  alternates: { canonical: '/age-flow' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Age Flow — Interactive Timeline of Korean Historical Figures | Sillok',
    description:
      'Scroll through centuries of Korean history. Watch historical figures appear, live, and pass away in an interactive age-flow timeline.',
    url: 'https://sillok.kr/age-flow',
    type: 'website',
  },
  twitter: {
    images: [DEFAULT_OG_IMAGE],
    card: 'summary_large_image',
    title: 'Age Flow — Interactive Timeline | Sillok',
    description:
      'Scroll through centuries of Korean history in an interactive age-flow timeline.',
  },
  keywords: [
    'Korean history',
    'historical figures',
    'interactive timeline',
    'Joseon dynasty',
    'age flow',
    'Korean historical timeline',
    'Sillok',
  ],
};

export default function AgeFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ageFlowJsonLd()) }}
      />
      {children}
    </>
  );
}
