import { describe, it, expect } from 'vitest';

// Gravity decay formula used in ranking
// score = (1 + reply_count * 0.5 + like_count) / (age_days + 2) ^ GRAVITY

const GRAVITY = 1.5;

function threadScore(replyCount: number, likeCount: number, ageDays: number): number {
  const points = 1 + replyCount * 0.5 + likeCount;
  const decay = Math.pow(ageDays + 2, GRAVITY);
  return points / decay;
}

describe('gravity decay ranking', () => {
  it('newer thread should score higher than older with same engagement', () => {
    const today = threadScore(5, 3, 0);    // age = 0 days
    const weekOld = threadScore(5, 3, 7);  // age = 7 days
    expect(today).toBeGreaterThan(weekOld);
  });

  it('thread with more replies should score higher at same age', () => {
    const moreReplies = threadScore(20, 0, 1);
    const fewerReplies = threadScore(2, 0, 1);
    expect(moreReplies).toBeGreaterThan(fewerReplies);
  });

  it('thread with more likes should score higher at same age', () => {
    const moreLikes = threadScore(0, 10, 1);
    const fewerLikes = threadScore(0, 1, 1);
    expect(moreLikes).toBeGreaterThan(fewerLikes);
  });

  it('a brand new thread with no engagement should still have a score', () => {
    const score = threadScore(0, 0, 0);
    // points = 1, decay = 2^1.5 ≈ 2.83
    expect(score).toBeGreaterThan(0);
    expect(score).toBeCloseTo(1 / Math.pow(2, 1.5), 5);
  });

  it('30-day old thread should score near zero', () => {
    const score = threadScore(0, 0, 30);
    // decay = 32^1.5 = 181.02
    expect(score).toBeLessThan(0.01);
  });

  it('popular old thread can still beat unpopular new thread', () => {
    const oldButPopular = threadScore(50, 30, 5);   // 46 points, 5 days old
    const newButEmpty = threadScore(0, 0, 0);        // 1 point, just created
    expect(oldButPopular).toBeGreaterThan(newButEmpty);
  });

  it('very popular old thread eventually loses to fresh thread', () => {
    const veryOld = threadScore(50, 30, 25);  // 46 points, 25 days old
    const fresh = threadScore(1, 1, 0);        // 2.5 points, just created
    expect(fresh).toBeGreaterThan(veryOld);
  });

  it('person score is sum of thread scores', () => {
    const thread1 = threadScore(5, 2, 0);
    const thread2 = threadScore(3, 1, 3);
    const personScore = thread1 + thread2;
    expect(personScore).toBeGreaterThan(thread1);
    expect(personScore).toBeGreaterThan(thread2);
  });

  it('gravity 1.5 provides moderate decay curve', () => {
    // Same thread at different ages — verify decay progression
    const day0 = threadScore(5, 5, 0);
    const day1 = threadScore(5, 5, 1);
    const day3 = threadScore(5, 5, 3);
    const day7 = threadScore(5, 5, 7);
    const day14 = threadScore(5, 5, 14);

    expect(day0).toBeGreaterThan(day1);
    expect(day1).toBeGreaterThan(day3);
    expect(day3).toBeGreaterThan(day7);
    expect(day7).toBeGreaterThan(day14);

    // After 7 days, score should be roughly 10% of day 0
    expect(day7 / day0).toBeLessThan(0.12);
  });
});
