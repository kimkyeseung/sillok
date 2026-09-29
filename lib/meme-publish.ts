import { randomUUID } from 'crypto';
import { ImageResponse } from 'next/og';
import { supabaseAdmin } from './supabase-admin';
import { notifyFollowers } from './notifications';
import { memeAltText, memeThreadBody, memeTranscript } from './meme';
import { loadFiguresByIds } from './meme-data';
import { buildMemeElement } from './meme-render';
import type { MemeRow } from './meme-server';

// ─── Publish a meme as a regular thread (server only) ───
// PNG → 'threads' bucket → thread + thread_persons + thread_images
// (stories: text-only thread, no image).
// Re-running on an already-published meme updates the same thread in place.

export class MemePublishError extends Error {}

const THREADS_PUBLIC = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/threads/`;

/** Create or update the meme's thread. Returns the thread id. */
export async function syncMemeThread(meme: MemeRow, adminId: string): Promise<string> {
  const title = meme.title?.trim();
  if (!title) throw new MemePublishError('Add a thread title before publishing.');
  const figureIds = Array.from(new Set(meme.person_ids ?? []));
  if (figureIds.length === 0) throw new MemePublishError('Add at least one figure before publishing — threads belong to a figure.');

  // Stories are text-only threads; memes carry one rendered image
  let png: Buffer | null = null;
  let alt: string | null = null;
  if (meme.kind !== 'story') {
    const rendered = await buildMemeElement(meme);
    if (!rendered.ok) throw new MemePublishError(`Could not render the meme: ${rendered.error}`);
    png = Buffer.from(
      await new ImageResponse(rendered.element, { width: rendered.width, height: rendered.height }).arrayBuffer(),
    );
    const names = (await loadFiguresByIds(figureIds)).map((f) => f.name);
    alt = memeAltText(memeTranscript(meme.kind, meme.format, meme.content, names));
  }

  // Existing thread keeps its author and id
  let threadId = meme.thread_id;
  let authorId = adminId;
  let existing = false;
  if (threadId) {
    const { data } = await supabaseAdmin.from('threads').select('id, author_id').eq('id', threadId).maybeSingle();
    if (data) {
      existing = true;
      authorId = data.author_id ?? adminId;
    } else {
      threadId = null;
    }
  }
  threadId ??= randomUUID();

  // New file name per render so CDN/browser caches never show a stale image
  let path: string | null = null;
  if (png) {
    path = `${authorId}/${threadId}/meme-${Date.now()}.png`;
    const upload = await supabaseAdmin.storage.from('threads').upload(path, png, { contentType: 'image/png' });
    if (upload.error) throw new Error(`[meme] image upload failed: ${upload.error.message}`);
  }

  const threadFields = {
    title,
    content: memeThreadBody(meme),
    person_id: figureIds[0],
    category: 'DISCUSSION',
    is_deleted: false,
  };

  let oldImages: string[] = [];
  if (existing) {
    const { data: imgs } = await supabaseAdmin.from('thread_images').select('url').eq('thread_id', threadId);
    oldImages = (imgs ?? []).map((i) => i.url);
    const { error } = await supabaseAdmin.from('threads').update(threadFields).eq('id', threadId);
    if (error) throw new Error(`[meme] thread update failed: ${error.message}`);
    await supabaseAdmin.from('thread_images').delete().eq('thread_id', threadId);
    await supabaseAdmin.from('thread_persons').delete().eq('thread_id', threadId);
  } else {
    const { error } = await supabaseAdmin.from('threads').insert({ id: threadId, author_id: authorId, ...threadFields });
    if (error) {
      if (path) await supabaseAdmin.storage.from('threads').remove([path]);
      throw new Error(`[meme] thread insert failed: ${error.message}`);
    }
  }

  await Promise.all([
    // alt = the words in the image, so the meme's text is searchable
    path && supabaseAdmin.from('thread_images').insert({ thread_id: threadId, url: `${THREADS_PUBLIC()}${path}`, alt, sort_order: 0 }),
    supabaseAdmin.from('thread_persons').insert(
      figureIds.map((pid, i) => ({ thread_id: threadId, person_id: pid, is_primary: i === 0, sort_order: i })),
    ),
  ]);

  // Best-effort cleanup of the previous render
  const stale = oldImages.filter((u) => u.startsWith(THREADS_PUBLIC())).map((u) => u.slice(THREADS_PUBLIC().length));
  if (stale.length) await supabaseAdmin.storage.from('threads').remove(stale);

  if (!existing) {
    const { data: primary } = await supabaseAdmin.from('persons').select('slug').eq('id', figureIds[0]).maybeSingle();
    if (primary) {
      await notifyFollowers({ personId: figureIds[0], threadAuthorId: authorId, threadTitle: title, personSlug: primary.slug, threadId });
    }
  }

  return threadId;
}

/** Unpublish/delete: soft-delete the thread (the meme keeps the link for re-publishing) */
export async function hideMemeThread(threadId: string | null): Promise<void> {
  if (!threadId) return;
  await supabaseAdmin.from('threads').update({ is_deleted: true }).eq('id', threadId);
}
