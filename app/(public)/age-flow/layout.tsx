import type { Metadata } from 'next';
import { ageFlowJsonLd } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'Age Flow — Interactive Timeline of Korean Historical Figures',
  description:
    'Scroll through centuries of Korean history. Watch historical figures appear, live, and pass away in an interactive age-flow timeline from the Joseon dynasty to modern Korea.',
  alternates: { canonical: '/age-flow' },
  openGraph: {
    title: 'Age Flow — Interactive Timeline of Korean Historical Figures | Sillok',
    description:
      'Scroll through centuries of Korean history. Watch historical figures appear, live, and pass away in an interactive age-flow timeline.',
    url: 'https://sillok.kr/age-flow',
    type: 'website',
  },
  twitter: {
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
