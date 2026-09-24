import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SectionHeader from '@/components/person/SectionHeader';
import GalleryStrip from '@/components/person/GalleryStrip';
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
      <GalleryStrip images={images} size="lg" slug={params.slug} />
    </section>
  );
}
