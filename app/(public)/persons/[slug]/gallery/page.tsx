import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SectionHeader from '@/components/person/SectionHeader';
import { getGallery, getPersonBySlug, getTabCounts } from '@/lib/person-page';
import { personTabMetadata } from '@/lib/person-metadata';
import { isTabVisible } from '@/lib/person-sections';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return personTabMetadata(params.slug, {
    segment: 'gallery',
    label: 'Gallery',
    description: (_p, fullName) =>
      `Images related to ${fullName}: portraits, artifacts, historical sites and community photos.`,
  });
}

export default async function PersonGalleryPage({ params }: Props) {
  const person = await getPersonBySlug(params.slug);
  if (!person) notFound();
  const counts = await getTabCounts(person);
  if (!isTabVisible('gallery', counts)) notFound();

  const images = await getGallery(person);

  return (
    <section>
      <SectionHeader title={`Gallery (${images.length})`} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img) => {
          const body = (
            <>
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={img.url}
                  alt={img.caption}
                  width={320}
                  height={320}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs text-gray-600">{img.caption}</p>
            </>
          );
          return img.href ? (
            <Link key={img.id} href={img.href} className="group block">
              {body}
            </Link>
          ) : (
            <div key={img.id} className="group">
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
