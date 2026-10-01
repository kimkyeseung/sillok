import { personBreadcrumbJsonLd } from '@/lib/jsonld';
import { dynastiesOf, dynastyPath } from '@/lib/monarchs';

/** BreadcrumbList structured data for a person page (overview or a tab) */
export default function PersonBreadcrumbJsonLd({
  person,
  tab,
}: {
  person: { name_en: string; slug: string };
  tab?: { label: string; segment: string };
}) {
  const dynasty = dynastiesOf(person.slug)[0];
  const parent = dynasty ? { title: dynasty.title, path: dynastyPath(dynasty) } : undefined;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(personBreadcrumbJsonLd(person, tab, parent)) }}
    />
  );
}
