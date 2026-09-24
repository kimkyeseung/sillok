/**
 * Phase 3 seed
 * 1. Portrayals: sets person_node_links.portrayed_by for known castings
 * 2. Polls: one "most important legacy" poll per Joseon king, options = its achievements
 *    (skipped for controversial figures and kings with fewer than 2 achievements)
 *
 * Usage: node scripts/seed-phase3.mjs [--dry-run]
 * Requires db/migrations/20260926_community_and_portrayals.sql to be applied. Idempotent.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PORTRAYALS } from './data/portrayals.mjs';
import { JOSEON_KINGS } from './data/joseon-kings-content.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

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

async function ids(table, slugs) {
  const { data, error } = await db.from(table).select('id, slug').in('slug', slugs);
  if (error) throw new Error(error.message);
  return new Map(data.map((r) => [r.slug, r.id]));
}

async function seedPortrayals() {
  const nodeIds = await ids('nodes', [...new Set(PORTRAYALS.map((p) => p[0]))]);
  const personIds = await ids('persons', [...new Set(PORTRAYALS.map((p) => p[1]))]);
  let updated = 0;
  for (const [nodeSlug, personSlug, actor] of PORTRAYALS) {
    const nodeId = nodeIds.get(nodeSlug);
    const personId = personIds.get(personSlug);
    if (!nodeId || !personId) {
      console.warn(`  ⚠ missing ${!nodeId ? nodeSlug : personSlug}`);
      continue;
    }
    if (DRY_RUN) {
      updated++;
      continue;
    }
    const { data, error } = await db
      .from('person_node_links')
      .update({ portrayed_by: actor })
      .eq('node_id', nodeId)
      .eq('person_id', personId)
      .select('id');
    if (error) throw new Error(`${nodeSlug}/${personSlug}: ${error.message} — apply the migration first`);
    if (!data.length) console.warn(`  ⚠ no link between ${nodeSlug} and ${personSlug}`);
    else updated++;
  }
  console.log(`Portrayals: ${updated}/${PORTRAYALS.length} ${DRY_RUN ? 'ready' : 'updated'}`);
}

async function seedPolls() {
  const { data: persons, error } = await db
    .from('persons')
    .select('id, slug, name_en, is_controversial')
    .in('slug', JOSEON_KINGS.map((k) => k.slug));
  if (error) throw new Error(error.message);

  let created = 0;
  for (const person of persons) {
    if (person.is_controversial) continue;
    const { data: existing, error: pollError } = await db
      .from('person_polls')
      .select('id')
      .eq('person_id', person.id)
      .eq('is_deleted', false)
      .limit(1);
    if (pollError) throw new Error(`${pollError.message} — apply the migration first`);
    if (existing.length) continue;

    const { data: achievements } = await db
      .from('person_highlights')
      .select('title')
      .eq('person_id', person.id)
      .eq('kind', 'ACHIEVEMENT')
      .eq('is_deleted', false)
      .order('sort_order');
    if (!achievements || achievements.length < 2) continue;

    if (DRY_RUN) {
      created++;
      continue;
    }
    const { data: poll, error: insertError } = await db
      .from('person_polls')
      .insert({ person_id: person.id, question: `Which of ${person.name_en}'s legacies matters most today?` })
      .select('id')
      .single();
    if (insertError) throw new Error(insertError.message);
    const { error: optionError } = await db
      .from('person_poll_options')
      .insert(achievements.map((a, i) => ({ poll_id: poll.id, label: a.title, sort_order: i })));
    if (optionError) throw new Error(optionError.message);
    created++;
  }
  console.log(`Polls: ${created} ${DRY_RUN ? 'to create' : 'created'}`);
}

seedPortrayals()
  .then(seedPolls)
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
