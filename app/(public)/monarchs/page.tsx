import Link from 'next/link';
import type { Metadata } from 'next';
import { DYNASTIES, dynastyPath, formatEraYear } from '@/lib/monarchs';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';

const title = 'Korean Monarchs: Every King and Emperor by Dynasty';
const description =
  'Complete lists of Korean rulers in order of succession — Goguryeo, Baekje, Silla, Balhae, Goryeo, Joseon and the Korean Empire — with reign years and biographies.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/monarchs' },
  keywords: ['Korean kings', 'Korean monarchs', 'Joseon kings', 'Goryeo kings', '한국 역대 왕', '조선 역대 왕'],
  openGraph: { title: `${title} | Sillok`, description, url: '/monarchs', images: [DEFAULT_OG_IMAGE] },
  twitter: { card: 'summary', title: `${title} | Sillok`, description, images: [DEFAULT_OG_IMAGE] },
};

// Static: built from lib/monarchs.ts alone, no DB at build or request time
export default function MonarchsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', path: '' },
              { name: 'Korean Monarchs', path: '/monarchs' },
            ])
          ),
        }}
      />
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Korean Monarchs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Every king, queen and emperor of Korea&apos;s historical dynasties, in order of succession.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {DYNASTIES.map((d) => (
          <li key={d.id}>
            <Link href={dynastyPath(d)} className="card group block h-full p-5">
              <h2 className="font-semibold text-gray-900 group-hover:text-brand-700">{d.title}</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {formatEraYear(d.start)}–{formatEraYear(d.end)} · {d.monarchs.length} rulers
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">{d.intro}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
