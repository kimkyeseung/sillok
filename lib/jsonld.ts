const BASE_URL = 'https://sillok.kr';

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sillok',
    url: BASE_URL,
    description:
      'Join discussions about Korean history — threads, polls and trivia on historical figures from Dangun to today, with family trees, timelines and an archive.',
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

interface PersonRef {
  name: string;
  slug: string;
}

const personRef = (p: PersonRef) => ({
  '@type': 'Person',
  name: p.name,
  url: `${BASE_URL}/persons/${p.slug}`,
});

export function personJsonLd(
  person: {
    name_en: string;
    name_ko?: string | null;
    name_hanja?: string | null;
    summary?: string | null;
    thumbnail?: string | null;
    birth_year?: number | null;
    death_year?: number | null;
    birth_place?: string | null;
    slug: string;
  },
  extra: {
    /** Authoritative pages about the same person (e.g. Wikipedia) */
    sameAs?: string[];
    parents?: PersonRef[];
    children?: PersonRef[];
    spouses?: PersonRef[];
    siblings?: PersonRef[];
  } = {}
) {
  // Korean + Hanja names help Korean-language search (not shown in the English UI)
  const alternateNames = [person.name_ko, person.name_hanja].filter(
    (v): v is string => !!v
  );
  const refs = (list?: PersonRef[]) => (list?.length ? list.map(personRef) : undefined);
  const family = {
    parent: refs(extra.parents),
    children: refs(extra.children),
    spouse: refs(extra.spouses),
    sibling: refs(extra.siblings),
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name_en,
    ...(alternateNames.length > 0 && { alternateName: alternateNames }),
    ...(person.summary && { description: person.summary.slice(0, 300) }),
    ...(person.thumbnail && { image: person.thumbnail }),
    ...(person.birth_year && { birthDate: String(person.birth_year) }),
    ...(person.death_year && { deathDate: String(person.death_year) }),
    ...(person.birth_place && { birthPlace: { '@type': 'Place', name: person.birth_place } }),
    ...(extra.sameAs?.length && { sameAs: extra.sameAs }),
    ...Object.fromEntries(Object.entries(family).filter(([, v]) => v)),
    url: `${BASE_URL}/persons/${person.slug}`,
  };
}

/** Home › Figures › Person (› Tab) */
export function personBreadcrumbJsonLd(
  person: { name_en: string; slug: string },
  tab?: { label: string; segment: string }
) {
  const crumbs = [
    { name: 'Home', url: BASE_URL },
    { name: 'Figures', url: `${BASE_URL}/persons` },
    { name: person.name_en, url: `${BASE_URL}/persons/${person.slug}` },
    ...(tab ? [{ name: tab.label, url: `${BASE_URL}/persons/${person.slug}/${tab.segment}` }] : []),
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
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
  const yearRange = event.start_year
    ? event.end_year && event.end_year !== event.start_year
      ? `${event.start_year}–${event.end_year}`
      : String(event.start_year)
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: event.title,
    ...(event.title_ko && { alternateName: event.title_ko }),
    ...(event.description && { description: event.description.slice(0, 300) }),
    image: event.thumbnail || `${BASE_URL}/og-default.png`,
    ...(yearRange && { temporalCoverage: yearRange }),
    url: `${BASE_URL}/nodes/${event.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'Sillok',
      url: BASE_URL,
    },
    ...(event.persons && event.persons.length > 0 && {
      about: event.persons.map((p) => ({
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

/** Generic Home › … breadcrumb; urls are site-relative paths */
export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${BASE_URL}${c.path}`,
    })),
  };
}

/** Board / topic listing page: a CollectionPage whose main entity is the thread list shown */
export function communityPageJsonLd(page: {
  name: string;
  description: string;
  path: string;
  threads: { id: string; title: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.name,
    description: page.description,
    url: `${BASE_URL}${page.path}`,
    isPartOf: { '@type': 'WebSite', name: 'Sillok', url: BASE_URL },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: page.threads.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE_URL}/threads/${t.id}`,
        name: t.title,
      })),
    },
  };
}

interface ForumReply {
  id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  like_count: number;
  author: string | null;
}

const likeStat = (count: number) => ({
  '@type': 'InteractionCounter',
  interactionType: 'https://schema.org/LikeAction',
  userInteractionCount: count,
});

const authorRef = (name: string | null) => ({ '@type': 'Person', name: name ?? 'Anonymous' });

/**
 * Thread page as a DiscussionForumPosting (Google "Discussion forum" rich results).
 * Replies are nested under their parents as `comment`; orphans attach to the post.
 */
export function discussionJsonLd(
  thread: {
    id: string;
    title: string;
    content: string | null;
    created_at: string;
    updated_at?: string | null;
    author: string | null;
    like_count: number;
    reply_count: number;
    image?: string | null;
    figures?: { name: string; slug: string }[];
  },
  replies: ForumReply[] = []
) {
  const url = `${BASE_URL}/threads/${thread.id}`;
  const ids = new Set(replies.map((r) => r.id));
  const children = new Map<string | null, ForumReply[]>();
  replies.forEach((r) => {
    const parent = r.parent_id && ids.has(r.parent_id) ? r.parent_id : null;
    children.set(parent, [...(children.get(parent) ?? []), r]);
  });
  const toComment = (r: ForumReply): Record<string, unknown> => {
    const nested = (children.get(r.id) ?? []).map(toComment);
    return {
      '@type': 'Comment',
      text: r.content,
      datePublished: r.created_at,
      author: authorRef(r.author),
      url: `${url}#reply-${r.id}`,
      interactionStatistic: likeStat(r.like_count),
      ...(nested.length && { comment: nested }),
    };
  };
  const comments = (children.get(null) ?? []).map(toComment);

  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: thread.title,
    ...(thread.content && { text: thread.content }),
    url,
    datePublished: thread.created_at,
    ...(thread.updated_at && thread.updated_at !== thread.created_at && { dateModified: thread.updated_at }),
    author: authorRef(thread.author),
    ...(thread.image && { image: thread.image }),
    ...(thread.figures?.length && { about: thread.figures.map(personRef) }),
    interactionStatistic: [
      likeStat(thread.like_count),
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: thread.reply_count,
      },
    ],
    ...(comments.length && { comment: comments }),
  };
}
