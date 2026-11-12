/**
 * Generate missing thumbnails for every image in Storage (lib/thumbnails.ts).
 * Run it after any script that uploads images — browser uploads and memes
 * generate their own.
 *
 *   npm run thumbs                 # only images without up-to-date thumbnails
 *   npm run thumbs -- --dry-run    # count, write nothing
 *   npm run thumbs -- --force      # regenerate everything (after changing widths/quality)
 *   npm run thumbs -- persons      # one bucket
 */
import { readFileSync } from 'fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { generateThumbnails } from '../lib/thumbnails';
import { THUMB_BUCKET, THUMB_SOURCE_BUCKETS, THUMB_WIDTHS, hasThumbnails, thumbObjectPath } from '../lib/thumbnail-paths';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const i = line.indexOf('=');
  if (i > 0 && !line.startsWith('#') && !process.env[line.slice(0, i)]) process.env[line.slice(0, i)] = line.slice(i + 1).trim();
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
const CONCURRENCY = 4;

const db: SupabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Every file in a bucket (optionally under a prefix): path → last modified */
async function listAll(bucket: string, prefix = ''): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const folders = [prefix];
  while (folders.length) {
    const folder = folders.pop()!;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.storage.from(bucket).list(folder, { limit: 1000, offset });
      if (error) throw new Error(`list ${bucket}/${folder}: ${error.message}`);
      for (const o of data) {
        const path = folder ? `${folder}/${o.name}` : o.name;
        if (o.id === null) folders.push(path);
        else files.set(path, o.updated_at ?? o.created_at ?? '');
      }
      if (data.length < 1000) break;
    }
  }
  return files;
}

async function main() {
  const { data: buckets } = await db.storage.listBuckets();
  if (!buckets?.some((b) => b.name === THUMB_BUCKET)) {
    if (dryRun) console.log(`(would create the "${THUMB_BUCKET}" bucket)`);
    else {
      const { error } = await db.storage.createBucket(THUMB_BUCKET, { public: true, allowedMimeTypes: ['image/webp'] });
      if (error) throw new Error(`create bucket: ${error.message}`);
      console.log(`Created the "${THUMB_BUCKET}" bucket`);
    }
  }

  let made = 0;
  let failed = 0;
  for (const bucket of THUMB_SOURCE_BUCKETS) {
    if (only.length && !only.includes(bucket)) continue;
    const originals = await listAll(bucket);
    const thumbs = buckets?.some((b) => b.name === THUMB_BUCKET) ? await listAll(THUMB_BUCKET, bucket) : new Map<string, string>();

    const todo = [...originals].filter(([path, modified]) => {
      if (!hasThumbnails(bucket, path)) return false;
      if (force) return true;
      // Missing a width, or the original was replaced after its thumbnails were made
      return THUMB_WIDTHS.some((w) => {
        const thumbModified = thumbs.get(thumbObjectPath(bucket, path, w));
        return !thumbModified || thumbModified < modified;
      });
    });
    console.log(`${bucket}: ${originals.size} files, ${todo.length} need thumbnails`);
    if (dryRun) continue;

    let next = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (next < todo.length) {
          const [path] = todo[next++];
          try {
            await generateThumbnails(db, bucket, path);
            made++;
            if (made % 25 === 0) console.log(`  ${made} done`);
          } catch (e) {
            failed++;
            console.error(`  ✗ ${bucket}/${path}: ${(e as Error).message}`);
          }
        }
      })
    );
  }
  console.log(dryRun ? 'Dry run — nothing written.' : `Done: ${made} images, ${failed} failed.`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
