import { ImageResponse } from 'next/og';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { buildMemeElement } from '@/lib/meme-render';
import { MEME_COLUMNS, type MemeRow } from '@/lib/meme-server';

// ─── GET /api/og/meme/:id — Meme preview image (PNG) [ADMIN] ───
// Admin preview only: published memes live on as thread images in storage.
// ?content=<json> previews unsaved edits in the editor.

const IdSchema = z.string().uuid();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!IdSchema.safeParse(params.id).success) return new Response('Not found', { status: 404 });
  if (!(await requireAdmin(request))) return new Response('Not found', { status: 404 });

  const { data } = await supabaseAdmin
    .from('ai_drafts')
    .select(MEME_COLUMNS)
    .eq('id', params.id)
    .eq('is_deleted', false)
    .maybeSingle();
  if (!data) return new Response('Not found', { status: 404 });

  let override: unknown;
  const draft = new URL(request.url).searchParams.get('content');
  if (draft) {
    try {
      override = JSON.parse(draft);
    } catch {
      return new Response('Invalid content', { status: 422 });
    }
  }

  const r = await buildMemeElement(data as unknown as MemeRow, override);
  if (!r.ok) return new Response(r.error, { status: 422 });
  return new ImageResponse(r.element, {
    width: r.width,
    height: r.height,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
