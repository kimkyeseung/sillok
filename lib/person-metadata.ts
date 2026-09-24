import type { Metadata } from 'next';
import { getPersonBySlug, type PersonDetail } from '@/lib/person-page';
import { DEFAULT_OG_IMAGE, nameWithKorean, truncateDescription } from '@/lib/seo';

interface TabMetaOptions {
  /** URL segment after /persons/[slug] — omit for the overview */
  segment?: string;
  /** Title suffix, e.g. "Timeline" → "Sejong the Great — Timeline" */
  label?: string;
  description: (person: PersonDetail, fullName: string) => string;
  noindex?: boolean;
}

/** Metadata for a person tab page: own title, description and canonical URL */
export async function personTabMetadata(
  slug: string,
  { segment, label, description, noindex }: TabMetaOptions
): Promise<Metadata> {
  const person = await getPersonBySlug(slug);
  if (!person) return {};

  // "Sejong the Great (세종대왕, 世宗大王)" so Korean-name searches can match
  const fullName = nameWithKorean(person.name_en, person.name_ko, person.name_hanja);
  const desc = truncateDescription(description(person, fullName));
  const title = label ? `${person.name_en} — ${label}` : person.name_en;
  const ogImage = person.thumbnail ?? DEFAULT_OG_IMAGE;
  const path = `/persons/${slug}${segment ? `/${segment}` : ''}`;

  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { title: `${title} - Sillok`, description: desc, type: 'profile', images: [ogImage] },
    twitter: {
      card: person.thumbnail ? 'summary_large_image' : 'summary',
      title: `${title} - Sillok`,
      description: desc,
      images: [ogImage],
    },
    keywords: [person.name_en, person.name_ko, person.name_hanja].filter((k): k is string => !!k),
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}
