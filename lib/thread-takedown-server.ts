import { supabaseAdmin } from './supabase-admin';
import { planTakedown, threadFolder, THREADS_BUCKET } from './thread-takedown';

// ─── Copyright takedown (server only) ───
// Removes the files from the public threads bucket so their URLs 404,
// then deletes the thread_images rows. Restore can't bring the files back.

export class TakedownError extends Error {
  constructor(message: string, public status = 500, public code = 'SERVER_ERROR') {
    super(message);
  }
}

export interface TakedownResult {
  thread_deleted: boolean;
  removed_files: string[];
  /** Image URLs outside our bucket — unlinked from the thread, but the file itself can't be removed */
  external_urls: string[];
}

const SUPABASE_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL;

async function loadThread(threadId: string) {
  const { data, error } = await supabaseAdmin
    .from('threads')
    .select('id, author_id')
    .eq('id', threadId)
    .maybeSingle();
  if (error) throw new TakedownError('스레드를 불러오지 못했습니다.');
  if (!data) throw new TakedownError('스레드를 찾을 수 없습니다.', 404, 'THREAD_NOT_FOUND');
  return data as { id: string; author_id: string | null };
}

/** Files in the thread's upload folder (includes uploads no longer linked from thread_images) */
async function listFolderFiles(folder: string | null): Promise<string[]> {
  if (!folder) return [];
  const { data, error } = await supabaseAdmin.storage.from(THREADS_BUCKET).list(folder, { limit: 1000 });
  if (error) throw new TakedownError(`스토리지 목록을 불러오지 못했습니다: ${error.message}`);
  // Folders come back with id = null
  return (data ?? []).filter((f) => f.id).map((f) => `${folder}/${f.name}`);
}

async function removeFiles(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabaseAdmin.storage.from(THREADS_BUCKET).remove(paths);
  if (error) throw new TakedownError(`파일을 삭제하지 못했습니다: ${error.message}`);
  return (data ?? []).map((f) => f.name);
}

/** Take down a whole thread: remove its files, delete its image rows, soft-delete the thread */
export async function takedownThread(threadId: string): Promise<TakedownResult> {
  const thread = await loadThread(threadId);

  const { data: images, error: imgError } = await supabaseAdmin
    .from('thread_images')
    .select('id, url')
    .eq('thread_id', threadId);
  if (imgError) throw new TakedownError('이미지 목록을 불러오지 못했습니다.');

  const plan = planTakedown((images ?? []).map((i) => i.url as string), SUPABASE_URL());
  const folderFiles = await listFolderFiles(threadFolder(thread.author_id, thread.id));
  const paths = Array.from(new Set([...plan.paths, ...folderFiles]));

  // Files first: if removal fails, the rows stay so the takedown can be retried
  const removed = await removeFiles(paths);

  const { error: delError } = await supabaseAdmin.from('thread_images').delete().eq('thread_id', threadId);
  if (delError) throw new TakedownError('이미지 기록을 삭제하지 못했습니다.');

  const { error: threadError } = await supabaseAdmin.from('threads').update({ is_deleted: true }).eq('id', threadId);
  if (threadError) throw new TakedownError('스레드를 삭제하지 못했습니다.');

  return { thread_deleted: true, removed_files: removed, external_urls: plan.external };
}

/** Take down one image: remove its file and row, keep the thread */
export async function takedownThreadImage(threadId: string, imageId: string): Promise<TakedownResult> {
  await loadThread(threadId);

  const { data: image, error } = await supabaseAdmin
    .from('thread_images')
    .select('id, url')
    .eq('id', imageId)
    .eq('thread_id', threadId)
    .maybeSingle();
  if (error) throw new TakedownError('이미지를 불러오지 못했습니다.');
  if (!image) throw new TakedownError('이미지를 찾을 수 없습니다.', 404, 'IMAGE_NOT_FOUND');

  const plan = planTakedown([image.url as string], SUPABASE_URL());

  const removed = await removeFiles(plan.paths);
  // Rows sharing the same URL would render a broken image — unlink them too
  const { error: delError } = await supabaseAdmin
    .from('thread_images')
    .delete()
    .eq('thread_id', threadId)
    .eq('url', image.url as string);
  if (delError) throw new TakedownError('이미지 기록을 삭제하지 못했습니다.');

  return { thread_deleted: false, removed_files: removed, external_urls: plan.external };
}
