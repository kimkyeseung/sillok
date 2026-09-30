/**
 * Seed Joseon-era films & dramas as MEDIA nodes and link them to the historical figures they depict.
 * Idempotent: existing node slugs are left untouched; missing links are added; portrayed_by is filled when empty.
 * Posters are fetched separately: scripts/fetch-joseon-media-posters.mjs
 *
 * Usage: node scripts/seed-joseon-media.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JOSEON_MEDIA } from './data/joseon-media.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

const env = {};
readFileSync(resolve(__dirname, '../.env.local'), 'utf-8').split('\n').forEach((line) => {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) return;
  const i = t.indexOf('=');
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
});
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const must = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

const personSlugs = [...new Set(JOSEON_MEDIA.flatMap((m) => m.links.map((l) => l[0])))];
const persons = new Map(must(await db.from('persons').select('id, slug').in('slug', personSlugs)).map((p) => [p.slug, p.id]));
const existing = new Map(
  must(await db.from('nodes').select('id, slug').in('slug', JOSEON_MEDIA.map((m) => m.slug))).map((n) => [n.slug, n.id])
);

let created = 0, linked = 0, credited = 0;
for (const m of JOSEON_MEDIA) {
  let nodeId = existing.get(m.slug);
  if (!nodeId) {
    const { slug, title, description, links, ...meta } = m;
    if (DRY_RUN) {
      created++;
    } else {
      const row = must(
        await db.from('nodes').insert({ slug, node_type: 'MEDIA', title, description, metadata: meta, is_published: true }).select('id').single()
      );
      nodeId = row.id;
      created++;
    }
  }
  for (const [personSlug, actor] of m.links) {
    const personId = persons.get(personSlug);
    if (!personId) { console.warn(`  ⚠ person not found: ${personSlug} (${m.slug})`); continue; }
    if (DRY_RUN || !nodeId) { linked++; continue; }
    const found = must(await db.from('person_node_links').select('id, portrayed_by').eq('node_id', nodeId).eq('person_id', personId));
    if (!found.length) {
      must(await db.from('person_node_links').insert({ node_id: nodeId, person_id: personId, portrayed_by: actor }).select('id'));
      linked++;
    } else if (actor && !found[0].portrayed_by) {
      must(await db.from('person_node_links').update({ portrayed_by: actor }).eq('id', found[0].id).select('id'));
      credited++;
    }
  }
}
console.log(`${DRY_RUN ? '[dry-run] ' : ''}nodes created: ${created}, links added: ${linked}, credits filled: ${credited}`);
