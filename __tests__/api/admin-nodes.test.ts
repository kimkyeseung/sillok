import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test the admin nodes list query schema (page-based pagination)

const ListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
  type: z.enum(['ARTIFACT', 'MEDIA', 'EVENT']).optional(),
  q: z.string().optional(),
});

describe('Admin Nodes ListQuerySchema', () => {
  it('should parse valid query with defaults', () => {
    const result = ListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.page).toBe(1);
    }
  });

  it('should parse page and limit as numbers from strings', () => {
    const result = ListQuerySchema.safeParse({ page: '3', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it('should accept valid type filter', () => {
    const result = ListQuerySchema.safeParse({ type: 'EVENT' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid type', () => {
    const result = ListQuerySchema.safeParse({ type: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('should reject page < 1', () => {
    const result = ListQuerySchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('should reject limit > 100', () => {
    const result = ListQuerySchema.safeParse({ limit: '200' });
    expect(result.success).toBe(false);
  });

  it('should calculate correct offset', () => {
    const result = ListQuerySchema.safeParse({ page: '3', limit: '20' });
    if (result.success) {
      const offset = (result.data.page - 1) * result.data.limit;
      expect(offset).toBe(40);
    }
  });

  it('should accept search query', () => {
    const result = ListQuerySchema.safeParse({ q: 'imjin' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe('imjin');
    }
  });
});

describe('pagination calculation', () => {
  it('should calculate total_pages correctly', () => {
    const total = 36;
    const limit = 20;
    const totalPages = Math.ceil(total / limit);
    expect(totalPages).toBe(2);
  });

  it('should handle exact division', () => {
    expect(Math.ceil(40 / 20)).toBe(2);
  });

  it('should handle single page', () => {
    expect(Math.ceil(5 / 20)).toBe(1);
  });

  it('should handle zero items', () => {
    expect(Math.ceil(0 / 20)).toBe(0);
  });
});
