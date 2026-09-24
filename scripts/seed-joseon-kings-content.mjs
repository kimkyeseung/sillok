/**
 * Seed AI-drafted editorial content (facts, highlights, sources) for the 27 Joseon kings.
 * Rows are inserted with is_ai_generated = true (shown with an "AI draft" label).
 *
 * Usage:
 *   node scripts/seed-joseon-kings-content.mjs --dry-run   # print counts only
 *   node scripts/seed-joseon-kings-content.mjs             # insert for kings with no content yet
 *   node scripts/seed-joseon-kings-content.mjs --force     # replace existing AI-drafted rows
 *                                                          # (admin-reviewed rows are kept)
 * Requires db/migrations/20260925_person_content.sql to be applied.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JOSEON_KINGS, buildRows } from './data/joseon-kings-content.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

const env = {};
readFileSync(resolve(__dirname, '../.env.local'), 'utf-8')
  .split('\n')
  .forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) return;
    const i = t.indexOf('=');
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
  });
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TABLES = ['person_facts', 'person_highlights', 'person_sources'];

async function main() {
  const { data: persons, error } = await db
    .from('persons')
    .select('id, slug')
    .in('slug', JOSEON_KINGS.map((k) => k.slug));
  if (error) throw new Error(error.message);
  const idBySlug = new Map(persons.map((p) => [p.slug, p.id]));
  const missing = JOSEON_KINGS.filter((k) => !idBySlug.has(k.slug)).map((k) => k.slug);
  if (missing.length) throw new Error(`Persons not found: ${missing.join(', ')}`);

  let inserted = 0;
  let skipped = 0;
  for (const [index, king] of JOSEON_KINGS.entries()) {
    const personId = idBySlug.get(king.slug);
    const { facts, highlights, sources } = buildRows(king, index);

    // Existing content check (only AI-drafted rows may be replaced).
    // Plain select, not head:true — HEAD requests hide "table does not exist" errors.
    const existing = await Promise.all(
      TABLES.map((t) => db.from(t).select('id').eq('person_id', personId).eq('is_deleted', false).limit(1))
    );
    const tableError = existing.find((r) => r.error)?.error;
    if (tableError) throw new Error(`${tableError.message} — apply 20260925_person_content.sql first`);
    const hasContent = existing.some((r) => (r.data?.length ?? 0) > 0);

    if (hasContent && !FORCE) {
      console.log(`- ${king.slug}: already has content, skipped`);
      skipped++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`· ${king.slug}: ${facts.length} facts, ${highlights.length} highlights, ${sources.length} sources`);
      continue;
    }
    if (hasContent) {
      for (const t of TABLES)
        await db.from(t).delete().eq('person_id', personId).eq('is_ai_generated', true);
    }

    const rows = {
      person_facts: facts.map((f, i) => ({
        person_id: personId,
        label: f.label,
        value: f.value ?? '',
        linked_person_id: f.linkedSlug ? idBySlug.get(f.linkedSlug) : null,
        sort_order: i,
        is_ai_generated: true,
      })),
      person_highlights: highlights.map((h, i) => ({
        person_id: personId,
        kind: h.kind,
        title: h.title,
        body: h.body ?? null,
        year: h.year ?? null,
        sort_order: i,
        is_ai_generated: true,
      })),
      person_sources: sources.map((s, i) => ({
        person_id: personId,
        kind: s.kind,
        title: s.title,
        url: s.url ?? null,
        citation: s.citation ?? null,
        sort_order: i,
        is_ai_generated: true,
      })),
    };
    for (const t of TABLES) {
      const { error: insertError } = await db.from(t).insert(rows[t]);
      if (insertError) throw new Error(`${king.slug} ${t}: ${insertError.message}`);
    }
    console.log(`✓ ${king.slug}`);
    inserted++;
  }
  console.log(`\n${DRY_RUN ? 'Dry run' : 'Done'}: ${inserted} seeded, ${skipped} skipped\n`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
