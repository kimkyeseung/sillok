import type { ReactElement } from 'react';
import { isTemplateFormat, parseMemeContent, type TemplateContent, type TranslatedContent } from './meme';
import { loadFiguresByIds } from './meme-data';
import type { MemeRow } from './meme-server';
import { TEMPLATE_SIZE, renderTemplateMeme, renderTranslatedMeme } from '@/components/meme/MemeCanvas';

// ─── Meme → next/og element (shared by the preview route and thread publishing) ───

export type MemeRenderResult =
  | { ok: true; element: ReactElement; width: number; height: number }
  | { ok: false; error: string };

export async function buildMemeElement(
  meme: Pick<MemeRow, 'kind' | 'format' | 'content' | 'person_ids' | 'source_image_url' | 'source_width' | 'source_height'>,
  contentOverride?: unknown,
): Promise<MemeRenderResult> {
  if (meme.kind === 'story') return { ok: false, error: 'Stories have no image' };
  const content = parseMemeContent(meme.kind, meme.format, contentOverride ?? meme.content);
  if (!content) return { ok: false, error: 'Invalid content' };

  if (meme.kind === 'translated') {
    if (!meme.source_image_url || !meme.source_width || !meme.source_height)
      return { ok: false, error: 'Missing source image' };
    const r = renderTranslatedMeme(
      meme.source_image_url,
      meme.source_width,
      meme.source_height,
      (content as TranslatedContent).boxes,
    );
    return { ok: true, ...r };
  }

  if (!isTemplateFormat(meme.format)) return { ok: false, error: 'Unknown format' };
  const figures = await loadFiguresByIds(meme.person_ids ?? []);
  return {
    ok: true,
    element: renderTemplateMeme(
      meme.format,
      content as TemplateContent,
      figures.map((f) => ({ id: f.id, name: f.name, hat: f.hat })),
    ),
    ...TEMPLATE_SIZE,
  };
}
