/**
 * Community feature constants shared by client and server:
 * thread categories, personal statuses, suggestion kinds.
 */

export const THREAD_CATEGORIES = [
  { value: 'DISCUSSION', label: 'Discussion', badge: 'bg-gray-100 text-gray-700' },
  { value: 'TRIVIA', label: 'Trivia', badge: 'bg-amber-50 text-amber-700' },
  { value: 'QNA', label: 'Q&A', badge: 'bg-sky-50 text-sky-700' },
  { value: 'SOURCES', label: 'Sources', badge: 'bg-emerald-50 text-emerald-700' },
  { value: 'MEDIA', label: 'Film & TV', badge: 'bg-rose-50 text-rose-700' },
] as const;

export type ThreadCategory = (typeof THREAD_CATEGORIES)[number]['value'];
export const THREAD_CATEGORY_VALUES = THREAD_CATEGORIES.map((c) => c.value) as [
  ThreadCategory,
  ...ThreadCategory[],
];

export const threadCategory = (value: string | null | undefined) =>
  THREAD_CATEGORIES.find((c) => c.value === value) ?? THREAD_CATEGORIES[0];

export const PERSON_STATUSES = [
  { value: 'STUDIED', label: 'Studied', icon: '📖' },
  { value: 'VISITED', label: 'Visited', icon: '📍' },
  { value: 'WANT_TO_LEARN', label: 'Want to learn', icon: '🔖' },
] as const;

export type PersonStatus = (typeof PERSON_STATUSES)[number]['value'];
export const PERSON_STATUS_VALUES = PERSON_STATUSES.map((s) => s.value) as [PersonStatus, ...PersonStatus[]];

export const SUGGESTION_KINDS = [
  { value: 'FACT', label: 'Fact (e.g. tomb, consort, title)' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'TRIVIA', label: 'Did-you-know trivia' },
  { value: 'SOURCE', label: 'Source or reference' },
  { value: 'CORRECTION', label: 'Correction' },
] as const;

export type SuggestionKind = (typeof SUGGESTION_KINDS)[number]['value'];
export const SUGGESTION_KIND_VALUES = SUGGESTION_KINDS.map((k) => k.value) as [
  SuggestionKind,
  ...SuggestionKind[],
];
