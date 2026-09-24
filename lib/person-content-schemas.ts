import { z } from 'zod';

/** Admin editing schemas for person editorial content (facts, highlights, sources) */

export const CONTENT_TABLES = {
  fact: 'person_facts',
  highlight: 'person_highlights',
  source: 'person_sources',
} as const;

export type ContentKind = keyof typeof CONTENT_TABLES;

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null));

export const FactSchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.string().trim().max(300).default(''),
  // Admins pick linked people by slug; the API resolves it to an id
  linked_person_slug: z.string().trim().max(200).nullable().optional(),
  sort_order: z.number().int().min(0).max(1000).optional(),
  is_ai_generated: z.boolean().optional(),
});

export const HighlightSchema = z.object({
  kind: z.enum(['ACHIEVEMENT', 'QUOTE', 'TRIVIA']),
  title: z.string().trim().min(1).max(200),
  body: nullableText(2000),
  year: z.number().int().min(-3000).max(2100).nullable().optional(),
  sort_order: z.number().int().min(0).max(1000).optional(),
  is_ai_generated: z.boolean().optional(),
});

export const SourceSchema = z.object({
  kind: z.enum(['PRIMARY', 'ENCYCLOPEDIA', 'BOOK', 'ARTICLE', 'WEB']),
  title: z.string().trim().min(1).max(300),
  url: z
    .string()
    .trim()
    .url()
    .refine((u) => /^https?:\/\//.test(u), 'Only http(s) URLs are allowed.')
    .nullable()
    .optional(),
  citation: nullableText(500),
  sort_order: z.number().int().min(0).max(1000).optional(),
  is_ai_generated: z.boolean().optional(),
});

export const CONTENT_SCHEMAS = {
  fact: FactSchema,
  highlight: HighlightSchema,
  source: SourceSchema,
} as const;
