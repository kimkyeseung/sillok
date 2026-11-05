import { describe, it, expect } from 'vitest';
import { planTakedown, threadFolder, threadsBucketPath, threadsBucketPrefix } from '@/lib/thread-takedown';

const SB = 'https://abc.supabase.co';
const P = `${SB}/storage/v1/object/public/threads/`;

describe('threadsBucketPrefix', () => {
  it('builds the public prefix and tolerates a trailing slash', () => {
    expect(threadsBucketPrefix(SB)).toBe(P);
    expect(threadsBucketPrefix(`${SB}/`)).toBe(P);
  });
});

describe('threadsBucketPath', () => {
  it('extracts the storage path of our bucket URLs', () => {
    expect(threadsBucketPath(`${P}user-1/thread-1/file.png`, SB)).toBe('user-1/thread-1/file.png');
  });

  it('drops query strings and hashes', () => {
    expect(threadsBucketPath(`${P}u/t/a.jpg?v=2`, SB)).toBe('u/t/a.jpg');
    expect(threadsBucketPath(`${P}u/t/a.jpg#x`, SB)).toBe('u/t/a.jpg');
  });

  it('decodes percent-encoding', () => {
    expect(threadsBucketPath(`${P}u/t/my%20file.png`, SB)).toBe('u/t/my file.png');
  });

  it('rejects other hosts, buckets and missing config', () => {
    expect(threadsBucketPath('https://upload.wikimedia.org/a.png', SB)).toBeNull();
    expect(threadsBucketPath(`${SB}/storage/v1/object/public/memes/sources/a.png`, SB)).toBeNull();
    expect(threadsBucketPath(`https://evil.co/storage/v1/object/public/threads/u/t/a.png`, SB)).toBeNull();
    expect(threadsBucketPath(`${P}u/t/a.png`, undefined)).toBeNull();
    expect(threadsBucketPath('', SB)).toBeNull();
  });

  it('does not treat a lookalike bucket name as ours', () => {
    expect(threadsBucketPath(`${SB}/storage/v1/object/public/threads-old/u/a.png`, SB)).toBeNull();
  });

  it('rejects empty paths, folders and traversal', () => {
    expect(threadsBucketPath(P, SB)).toBeNull();
    expect(threadsBucketPath(`${P}u/t/`, SB)).toBeNull();
    expect(threadsBucketPath(`${P}u/../other/a.png`, SB)).toBeNull();
    expect(threadsBucketPath(`${P}u/%2E%2E/a.png`, SB)).toBeNull();
    expect(threadsBucketPath(`${P}u//a.png`, SB)).toBeNull();
    expect(threadsBucketPath(`${P}u/%E0%A4%A.png`, SB)).toBeNull();
  });
});

describe('planTakedown', () => {
  it('splits removable paths from external URLs and dedupes', () => {
    const plan = planTakedown(
      [`${P}u/t/a.png`, `${P}u/t/a.png?v=1`, 'https://img.example.com/b.jpg', `${P}u/t/c.webp`],
      SB,
    );
    expect(plan.paths).toEqual(['u/t/a.png', 'u/t/c.webp']);
    expect(plan.external).toEqual(['https://img.example.com/b.jpg']);
  });

  it('handles no images', () => {
    expect(planTakedown([], SB)).toEqual({ paths: [], external: [] });
  });
});

describe('threadFolder', () => {
  it('is {author}/{thread}, or null without an author', () => {
    expect(threadFolder('u', 't')).toBe('u/t');
    expect(threadFolder(null, 't')).toBeNull();
  });
});
