import { personBreadcrumbJsonLd } from '@/lib/jsonld';

/** BreadcrumbList structured data for a person page (overview or a tab) */
export default function PersonBreadcrumbJsonLd({
  person,
  tab,
}: {
  person: { name_en: string; slug: string };
  tab?: { label: string; segment: string };
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(personBreadcrumbJsonLd(person, tab)) }}
    />
  );
}
