import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FigureGrid from '@/components/person/FigureGrid';
import HubLinks from '@/components/person/HubLinks';
import { getPersonDirectory } from '@/lib/person-directory-data';
import {
  findHub,
  hubCounts,
  hubDescription,
  hubFigures,
  hubPath,
  isHubIndexable,
  type HubKind,
} from '@/lib/person-directory';
import { breadcrumbJsonLd, figureHubJsonLd } from '@/lib/jsonld';
import { findBoard } from '@/lib/feed';
import { DEFAULT_OG_IMAGE, truncateDescription } from '@/lib/seo';

/** Shared by /persons/era/[era] and /persons/field/[field] */
export async function figureHubMetadata(kind: HubKind, slug: string): Promise<Metadata> {
  const hub = findHub(kind, slug);
  if (!hub) return {};
  const figures = hubFigures(await getPersonDirectory(), hub);
  const description = truncateDescription(hubDescription(hub, figures));
  const path = hubPath(hub);
  return {
    title: hub.heading,
    description,
    alternates: { canonical: path },
    // A hub with only a few figures is a thin page — keep it out of the index
    ...(!isHubIndexable(figures.length) && { robots: { index: false, follow: true } }),
    openGraph: { title: `${hub.heading} | Sillok`, description, url: path, images: [DEFAULT_OG_IMAGE] },
    twitter: { card: 'summary', title: `${hub.heading} | Sillok`, description, images: [DEFAULT_OG_IMAGE] },
  };
}

export default async function FigureHubPage({ kind, slug }: { kind: HubKind; slug: string }) {
  const hub = findHub(kind, slug);
  if (!hub) notFound();

  const directory = await getPersonDirectory();
  const figures = hubFigures(directory, hub);
  const path = hubPath(hub);
  const board = kind === 'era' ? findBoard(slug) : null;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            figureHubJsonLd({
              name: hub.heading,
              description: hubDescription(hub, figures),
              path,
              figures,
            }),
            breadcrumbJsonLd([
              { name: 'Home', path: '' },
              { name: 'Figures', path: '/persons' },
              { name: hub.label, path },
            ]),
          ]).replace(/</g, '\\u003c'),
        }}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-gray-500">
        <Link href="/persons" className="hover:text-brand-600">
          Figures
        </Link>
        <span className="mx-1.5">›</span>
        <span className="text-gray-700">{hub.label}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{hub.heading}</h1>
        <p className="mt-1 text-sm text-gray-600">{hub.intro}</p>
        <p className="mt-1 text-xs text-gray-500">
          {figures.length} {figures.length === 1 ? 'figure' : 'figures'}, oldest first
          {board && (
            <>
              {' · '}
              <Link href={`/b/${board.slug}`} className="font-medium text-brand-600 hover:underline">
                {board.label} discussions
              </Link>
            </>
          )}
        </p>
      </header>

      <div className="mb-6">
        <HubLinks counts={hubCounts(directory)} current={path} />
      </div>

      {figures.length > 0 ? (
        <FigureGrid figures={figures.map((p) => ({ ...p, fieldTag: p.fields[0] ?? null }))} />
      ) : (
        <div className="card-flat py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No figures here yet</p>
          <Link href="/persons" className="mt-1 inline-block text-xs text-brand-600 hover:underline">
            Browse all figures
          </Link>
        </div>
      )}
    </div>
  );
}
