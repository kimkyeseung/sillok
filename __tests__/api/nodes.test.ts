import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Test the validation schemas used in node API routes

const UpdateNodeSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(10000).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  is_published: z.boolean().optional(),
  person_ids: z.array(z.string().uuid()).optional(),
});

const CreateNodeSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  node_type: z.enum(['ARTIFACT', 'MEDIA', 'EVENT', 'GROUP']),
  title: z.string().min(1).max(300),
  description: z.string().max(10000).optional(),
  thumbnail: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
  is_published: z.boolean().default(false),
  person_ids: z.array(z.string().uuid()).optional(),
});

describe('UpdateNodeSchema', () => {
  it('should accept valid update payload', () => {
    const result = UpdateNodeSchema.safeParse({
      title: 'Imjin War',
      is_published: true,
      metadata: { start_year: 1592, event_type: 'war' },
    });
    expect(result.success).toBe(true);
  });

  it('should accept person_ids', () => {
    const result = UpdateNodeSchema.safeParse({
      person_ids: ['550e8400-e29b-41d4-a716-446655440000'],
    });
    expect(result.success).toBe(true);
  });

  it('should reject slug with uppercase', () => {
    const result = UpdateNodeSchema.safeParse({
      slug: 'Imjin-War',
    });
    expect(result.success).toBe(false);
  });

  it('should reject slug with special characters', () => {
    const result = UpdateNodeSchema.safeParse({
      slug: 'imjin_war!',
    });
    expect(result.success).toBe(false);
  });

  it('should accept slug with lowercase and hyphens', () => {
    const result = UpdateNodeSchema.safeParse({
      slug: 'imjin-war-1592',
    });
    expect(result.success).toBe(true);
  });

  it('should accept null metadata', () => {
    const result = UpdateNodeSchema.safeParse({
      metadata: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty payload (all optional)', () => {
    const result = UpdateNodeSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject invalid person_ids', () => {
    const result = UpdateNodeSchema.safeParse({
      person_ids: ['not-a-uuid'],
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateNodeSchema', () => {
  it('should accept valid create payload', () => {
    const result = CreateNodeSchema.safeParse({
      slug: 'imjin-war',
      node_type: 'EVENT',
      title: 'Imjin War',
      metadata: { start_year: 1592, event_type: 'war', title_ko: '임진왜란' },
      is_published: true,
    });
    expect(result.success).toBe(true);
  });

  it('should require slug, node_type, title', () => {
    const result = CreateNodeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid node_type', () => {
    const result = CreateNodeSchema.safeParse({
      slug: 'test',
      node_type: 'INVALID',
      title: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('should default is_published to false', () => {
    const result = CreateNodeSchema.safeParse({
      slug: 'test',
      node_type: 'EVENT',
      title: 'Test',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_published).toBe(false);
    }
  });

  it('should accept metadata with title_ko', () => {
    const result = CreateNodeSchema.safeParse({
      slug: 'test',
      node_type: 'EVENT',
      title: 'Test',
      metadata: { title_ko: '테스트', start_year: 1500 },
    });
    expect(result.success).toBe(true);
  });
});
