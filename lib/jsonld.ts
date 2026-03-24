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
