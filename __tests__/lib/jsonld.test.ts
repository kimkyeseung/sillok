import { describe, it, expect } from 'vitest';
import { eventJsonLd, personJsonLd } from '@/lib/jsonld';

describe('eventJsonLd', () => {
  it('should generate valid Event schema', () => {
    const result = eventJsonLd({
      title: 'Imjin War',
      slug: 'imjin-war',
      start_year: 1592,
      description: 'Japan invades Korea.',
    });

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Event');
    expect(result.name).toBe('Imjin War');
    expect(result.startDate).toBe('1592');
    expect(result.url).toContain('/nodes/imjin-war');
    expect(result.description).toBe('Japan invades Korea.');
  });

  it('should include alternateName when title_ko is provided', () => {
    const result = eventJsonLd({
      title: 'Imjin War',
      title_ko: '임진왜란',
      slug: 'imjin-war',
    });

    expect(result.alternateName).toBe('임진왜란');
  });

  it('should omit alternateName when title_ko is not provided', () => {
    const result = eventJsonLd({
      title: 'Imjin War',
      slug: 'imjin-war',
    });

    expect(result).not.toHaveProperty('alternateName');
  });

  it('should include performers when persons are provided', () => {
    const result = eventJsonLd({
      title: 'Imjin War',
      slug: 'imjin-war',
      persons: [
        { name_en: 'Yi Sun-sin', slug: 'yi-sun-sin' },
        { name_en: 'Toyotomi Hideyoshi', slug: 'toyotomi' },
      ],
    });

    expect(result.performer).toHaveLength(2);
    expect(result.performer![0].name).toBe('Yi Sun-sin');
    expect(result.performer![0]['@type']).toBe('Person');
    expect(result.performer![0].url).toContain('/persons/yi-sun-sin');
  });

  it('should omit performer when persons is empty', () => {
    const result = eventJsonLd({
      title: 'Test',
      slug: 'test',
      persons: [],
    });

    expect(result).not.toHaveProperty('performer');
  });

  it('should truncate description to 300 chars', () => {
    const longDesc = 'A'.repeat(500);
    const result = eventJsonLd({
      title: 'Test',
      slug: 'test',
      description: longDesc,
    });

    expect(result.description).toHaveLength(300);
  });
});

describe('personJsonLd', () => {
  it('should generate valid Person schema', () => {
    const result = personJsonLd({
      name_en: 'Sejong the Great',
      slug: 'sejong-daewang',
      birth_year: 1397,
      death_year: 1450,
    });

    expect(result['@type']).toBe('Person');
    expect(result.name).toBe('Sejong the Great');
    expect(result.birthDate).toBe('1397');
    expect(result.deathDate).toBe('1450');
    expect(result.url).toContain('/persons/sejong-daewang');
  });

  it('should omit optional fields when null', () => {
    const result = personJsonLd({
      name_en: 'Test',
      slug: 'test',
    });

    expect(result).not.toHaveProperty('alternateName');
    expect(result).not.toHaveProperty('image');
    expect(result).not.toHaveProperty('birthDate');
    expect(result).not.toHaveProperty('deathDate');
  });
});
