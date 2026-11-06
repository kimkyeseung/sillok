import { describe, it, expect } from 'vitest';
import { getYearSnapshot, selectTimelineData, transformPerson } from '@/lib/age-flow';
import type { AgeFlowInitialData, AgeFlowPerson } from '@/components/age-flow/useAgeFlow';

const person = (slug: string, show?: boolean): AgeFlowPerson => ({
  id: slug,
  slug,
  name_en: slug,
  name_ko: slug,
  birth_year: 1500,
  death_year: 1600,
  is_alive: false,
  thumbnail: null,
  view_count: 0,
  follow_count: 0,
  show_in_age_flow: show,
  tags: [],
});

const data = (persons: AgeFlowPerson[]): AgeFlowInitialData => ({
  persons,
  events: [],
  artifacts: [],
  reigns: [],
});

const slugs = (d: AgeFlowInitialData) => d.persons.map((p) => p.slug);

describe('transformPerson show_in_age_flow', () => {
  const raw = { id: 'a', slug: 'a', name_ko: 'a', birth_year: 1500, death_year: 1600, is_alive: false };

  it('keeps an explicit false', () => {
    expect(transformPerson({ ...raw, show_in_age_flow: false })!.show_in_age_flow).toBe(false);
  });

  it('defaults to shown when the column does not exist yet', () => {
    expect(transformPerson(raw)!.show_in_age_flow).toBe(true);
  });
});

describe('selectTimelineData', () => {
  const all = data([person('shown', true), person('hidden', false), person('cached-before-migration')]);

  it('drops hidden figures and keeps ones without the field', () => {
    expect(slugs(selectTimelineData(all))).toEqual(['shown', 'cached-before-migration']);
  });

  it('keeps a hidden figure when it is the focus', () => {
    expect(slugs(selectTimelineData(all, 'hidden'))).toContain('hidden');
  });

  it('leaves the full data intact for year pages', () => {
    selectTimelineData(all);
    expect(getYearSnapshot(all, 1550).alive.map((p) => p.slug)).toContain('hidden');
  });
});
