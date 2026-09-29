/**
 * AI Drafts from the command line — used by the /write-meme command.
 * Claude (or you) writes the captions; this validates them against the format
 * catalog, renders a preview, and creates/posts the draft the same way the
 * admin page does. No ANTHROPIC_API_KEY needed.
 *
 *   npx tsx scripts/meme-draft.ts formats                    # catalog: structure, humor, fields
 *   npx tsx scripts/meme-draft.ts preview <spec.json> <out.png>   # validate + render (writes nothing)
 *   npx tsx scripts/meme-draft.ts create <spec.json> [--post] [--at <ISO time>]
 *
 * spec.json:
 *   { "kind": "template" | "story",            // default "template"
 *     "format": "review",                      // catalog key (template only)
 *     "slugs": ["hendrick-hamel"],             // figures, subject first
 *     "event_slug": "imjin-war",               // optional
 *     "title": "Thread title",
 *     "content": { ...fields },                // story: { "body": "..." }
 *     "fact": "What is historically true" }
 *
 * --post  publishes it as a regular admin thread (same as "Save & post as thread").
 * --at    backdates the thread/publish time (must not be in the future).
 */
import React from 'react';
import { readFileSync, writeFileSync } from 'fs';

(globalThis as unknown as { React: typeof React }).React = React; // JSX in MemeCanvas under tsx
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const i = line.indexOf('=');
  if (i > 0 && !line.startsWith('#') && !process.env[line.slice(0, i)]) process.env[line.slice(0, i)] = line.slice(i + 1).trim();
}

const ADMIN_ID = 'e9517e9f-511d-4b0d-a8e9-ff22a3346758'; // 김계승 — author of admin threads

interface Spec {
  kind?: 'template' | 'story';
  format?: string;
  slugs: string[];
  event_slug?: string;
  title?: string;
  content: Record<string, unknown>;
  fact?: string;
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function loadSpec(path: string | undefined) {
  if (!path) fail('spec.json path required');
  const spec = JSON.parse(readFileSync(path, 'utf8')) as Spec;
  const kind = spec.kind ?? 'template';
  const format = kind === 'story' ? 'story' : spec.format ?? '';

  const { isTemplateFormat, formatEntry, parseMemeContent } = await import('../lib/meme');
  const { loadFiguresBySlugs, loadEventBySlug } = await import('../lib/meme-data');

  if (kind === 'template' && !isTemplateFormat(format)) fail(`unknown format "${format}" — run: formats`);
  const content = parseMemeContent(kind, format, spec.content);
  if (!content) fail('content does not match the format fields (see: formats)');

  if (!spec.slugs?.length) fail('slugs: at least one figure (threads belong to a figure)');
  const found = await loadFiguresBySlugs(spec.slugs);
  const missing = spec.slugs.filter((_, i) => !found[i]);
  if (missing.length) fail(`figure not found: ${missing.join(', ')}`);
  const figures = found.filter((f) => !!f);
  const ineligible = figures.filter((f) => !f.eligible).map((f) => f.name);
  if (ineligible.length) fail(`only published, pre-modern figures: ${ineligible.join(', ')}`);
  if (kind === 'template' && isTemplateFormat(format)) {
    const { min, max } = formatEntry(format).figures;
    if (figures.length < min || figures.length > max) fail(`"${format}" takes ${min}–${max} figure(s)`);
  }
  const event = spec.event_slug ? await loadEventBySlug(spec.event_slug) : null;
  if (spec.event_slug && !event) fail(`event not found: ${spec.event_slug}`);

  return { spec, kind, format, content, figures, event };
}

async function formats() {
  const { TEMPLATE_FORMATS, formatGuide, formatEntry } = await import('../lib/meme-formats');
  for (const f of TEMPLATE_FORMATS) {
    const e = formatEntry(f);
    console.log(`\n### ${f}  (${e.figures.min === e.figures.max ? e.figures.min : `${e.figures.min}–${e.figures.max}`} figure(s))`);
    console.log(formatGuide(f));
  }
  console.log('\n### story  (1–2 figures)\nText-only twist-ending short fiction. Fields:\n- "body": the story (max 1500 chars; twist in the last line)');
}

async function preview(specPath?: string, out?: string) {
  if (!out) fail('output .png path required');
  const { kind, format, content, figures, spec } = await loadSpec(specPath);
  if (kind === 'story') {
    const { memeThreadBody } = await import('../lib/meme');
    console.log(`${spec.title ?? '(no title)'}\n\n${memeThreadBody({ kind, content, fact: spec.fact ?? null, source_credit: null, source_url: null })}`);
    return;
  }
  const { ImageResponse } = await import('next/og');
  const { buildMemeElement } = await import('../lib/meme-render');
  const r = await buildMemeElement({
    kind,
    format,
    content,
    person_ids: figures.map((f) => f.id),
    source_image_url: null,
    source_width: null,
    source_height: null,
  });
  if (!r.ok) fail(r.error);
  writeFileSync(out, Buffer.from(await new ImageResponse(r.element, { width: r.width, height: r.height }).arrayBuffer()));
  console.log(`✓ preview → ${out}`);
}

async function create(specPath: string | undefined, flags: string[]) {
  const post = flags.includes('--post');
  const atIdx = flags.indexOf('--at');
  const at = atIdx >= 0 ? flags[atIdx + 1] : undefined;
  if (at && (Number.isNaN(Date.parse(at)) || new Date(at) > new Date())) fail('--at must be a past ISO time');

  const { spec, kind, format, content, figures, event } = await loadSpec(specPath);
  if (post && !spec.title?.trim()) fail('title is required to post');

  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const { MEME_COLUMNS } = await import('../lib/meme-server');
  const { data: draft, error } = await supabaseAdmin
    .from('ai_drafts')
    .insert({
      kind,
      format,
      title: spec.title?.trim() || null,
      person_ids: figures.map((f) => f.id),
      event_node_id: event?.id ?? null,
      content,
      fact: spec.fact?.trim() || null,
      is_ai_generated: true,
      status: 'draft',
      created_by: ADMIN_ID,
    })
    .select(MEME_COLUMNS)
    .single();
  if (error) fail(`insert failed: ${error.message}`);
  console.log(`✓ draft ${draft.id} (edit in /admin/memes)`);
  if (!post) return;

  const { syncMemeThread } = await import('../lib/meme-publish');
  const threadId = await syncMemeThread(draft as never, ADMIN_ID);
  const publishedAt = at ?? new Date().toISOString();
  await supabaseAdmin.from('ai_drafts').update({ status: 'published', thread_id: threadId, published_at: publishedAt }).eq('id', draft.id);
  if (at) await supabaseAdmin.from('threads').update({ created_at: at }).eq('id', threadId);
  console.log(`✓ posted → /threads/${threadId}`);
}

const [cmd, ...args] = process.argv.slice(2);
const run =
  cmd === 'formats' ? formats() : cmd === 'preview' ? preview(args[0], args[1]) : cmd === 'create' ? create(args[0], args.slice(1)) : null;
if (!run) fail('usage: formats | preview <spec.json> <out.png> | create <spec.json> [--post] [--at <ISO>]');
run.catch((e) => fail(e instanceof Error ? e.message : String(e)));
