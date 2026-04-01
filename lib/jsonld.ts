const BASE_URL = 'https://sillok.kr';

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sillok',
    url: BASE_URL,
    description:
      'A graph-based archive platform connecting notable Korean figures from Dangun to the present as interconnected nodes',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function personJsonLd(person: {
  name_en: string;
  name_hanja?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  birth_year?: number | null;
  death_year?: number | null;
  slug: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name_en,
    ...(person.name_hanja && { alternateName: person.name_hanja }),
    ...(person.description && { description: person.description.slice(0, 300) }),
    ...(person.thumbnail && { image: person.thumbnail }),
    ...(person.birth_year && { birthDate: String(person.birth_year) }),
    ...(person.death_year && { deathDate: String(person.death_year) }),
    url: `${BASE_URL}/persons/${person.slug}`,
  };
}

export function ageFlowJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Age Flow — Korean Historical Timeline',
    url: `${BASE_URL}/age-flow`,
    description:
      'An interactive scroll-driven timeline visualizing Korean historical figures across centuries — from the Joseon dynasty to modern Korea.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'Sillok',
      url: BASE_URL,
    },
  };
}

export function eventJsonLd(event: {
  title: string;
  title_ko?: string;
  description?: string | null;
  thumbnail?: string | null;
  start_year?: number;
  end_year?: number | null;
  slug: string;
  persons?: Array<{ name_en: string; slug: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    ...(event.title_ko && { alternateName: event.title_ko }),
    ...(event.description && { description: event.description.slice(0, 300) }),
    image: event.thumbnail || `${BASE_URL}/og-default.png`,
    ...(event.start_year && { startDate: String(event.start_year) }),
    endDate: String(event.end_year ?? event.start_year ?? ''),
    url: `${BASE_URL}/nodes/${event.slug}`,
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: 'Korean Peninsula',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'KR',
      },
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/nodes/${event.slug}`,
    },
    ...(event.persons && event.persons.length > 0 && {
      performer: event.persons.map((p) => ({
        '@type': 'Person',
        name: p.name_en,
        url: `${BASE_URL}/persons/${p.slug}`,
      })),
    }),
  };
}

export function articleJsonLd(article: {
  title: string;
  summary?: string | null;
  body?: string | null;
  thumbnail?: string | null;
  created_at: string;
  updated_at?: string | null;
  slug: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    ...(article.summary && { description: article.summary }),
    ...(article.thumbnail && { image: article.thumbnail }),
    datePublished: article.created_at,
    ...(article.updated_at && { dateModified: article.updated_at }),
    url: `${BASE_URL}/articles/${article.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'Sillok',
      url: BASE_URL,
    },
  };
}
