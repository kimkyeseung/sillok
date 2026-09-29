import { apiError } from './api-helpers';
import type { MemeKind } from './meme';
import { MemeAiError } from './meme-ai';
import { supabaseAdmin } from './supabase-admin';
import { loadFiguresByIds } from './meme-data';

// ─── Shared helpers for the meme API routes (server only) ───

export const MEME_COLUMNS =
  'id, kind, format, title, person_ids, event_node_id, content, fact, source_image_url, source_width, source_height, source_url, source_credit, is_ai_generated, status, thread_id, published_at, created_at, updated_at';

export interface MemeRow {
  id: string;
  kind: MemeKind;
  format: string;
  title: string | null;
  person_ids: string[];
  event_node_id: string | null;
  content: unknown;
  fact: string | null;
  source_image_url: string | null;
  source_width: number | null;
  source_height: number | null;
  source_url: string | null;
  source_credit: string | null;
  is_ai_generated: boolean;
  status: 'draft' | 'published' | 'rejected';
  thread_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Attach figure names/slugs for the admin list and public page */
export async function withFigures<T extends Pick<MemeRow, 'person_ids'>>(memes: T[]) {
  const ids = Array.from(new Set(memes.flatMap((m) => m.person_ids ?? [])));
  const figures = new Map((await loadFiguresByIds(ids)).map((f) => [f.id, { id: f.id, slug: f.slug, name: f.name }]));
  return memes.map((m) => ({
    ...m,
    figures: (m.person_ids ?? [])
      .map((id) => figures.get(id))
      .filter((f): f is { id: string; slug: string; name: string } => !!f),
  }));
}

export async function insertMeme(row: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin.from('ai_drafts').insert(row).select(MEME_COLUMNS).single();
  if (error) throw new Error(`[meme] insert failed: ${error.message}`);
  return data as unknown as MemeRow;
}

/** Map AI failures to API errors */
export function memeAiErrorResponse(err: unknown) {
  if (err instanceof MemeAiError) {
    switch (err.code) {
      case 'NOT_CONFIGURED':
        return apiError('AI_NOT_CONFIGURED', 'ANTHROPIC_API_KEY is not configured on the server.', 503);
      case 'SKIPPED':
        return apiError('MEME_SKIPPED', 'The AI found no fact-based joke for this input. Try other figures or an event.', 422);
      case 'REFUSED':
        return apiError('MEME_REFUSED', 'The AI declined this request.', 422);
      default:
        return apiError('AI_ERROR', err.message, 502);
    }
  }
  console.error('[meme] unexpected error:', err);
  return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
}
