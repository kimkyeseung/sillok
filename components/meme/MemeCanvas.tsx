/* eslint-disable @next/next/no-img-element */
import type { ReactElement } from 'react';
import {
  FORMAT_DEFS,
  fitFontSize,
  harmonizeFontSizes,
  translatedSize,
  type FaceVariant,
  type HatType,
  type TemplateContent,
  type TemplateFormat,
  type TextBox,
} from '@/lib/meme';
import { wojakDataUri } from './Wojak';

// ─── Meme layouts for next/og (satori) ───
// Server-only (wojakDataUri uses Buffer). Every multi-child div needs display:flex.

export interface MemeFigure {
  id: string;
  name: string;
  hat: HatType;
}

export const TEMPLATE_SIZE = { width: 1080, height: 1080 };

const INK = '#111111';
/** Classic meme outline (satori renders WebkitTextStroke too thin to read) */
const OUTLINE =
  '-3px -3px 0 #000000, 3px -3px 0 #000000, -3px 3px 0 #000000, 3px 3px 0 #000000, 0 0 6px #000000';

function Face({ variant, hat, flip, size }: { variant: FaceVariant; hat: HatType; flip?: boolean; size: number }) {
  return <img src={wojakDataUri({ variant, hat, flip })} width={size} height={size} alt="" />;
}

function Caption({ text, w, h, max = 56, align = 'center' }: { text: string; w: number; h: number; max?: number; align?: 'center' | 'left' }) {
  return (
    <div
      style={{
        display: 'flex',
        width: w,
        height: h,
        alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        textAlign: align,
        fontSize: fitFontSize(text, w - 24, h - 16, max, 18),
        lineHeight: 1.15,
        color: INK,
        padding: '8px 12px',
      }}
    >
      {text}
    </div>
  );
}

function Watermark() {
  return (
    <div style={{ display: 'flex', position: 'absolute', right: 20, bottom: 12, fontSize: 22, color: '#9ca3af' }}>
      sillok
    </div>
  );
}

function NameTag({ name }: { name: string }) {
  return (
    <div style={{ display: 'flex', fontSize: 26, color: '#4b5563', marginTop: 4 }}>{name}</div>
  );
}

const faceOf = (format: TemplateFormat, content: { faces?: FaceVariant[] }, slot: number) =>
  content.faces?.[slot] ?? FORMAT_DEFS[format].faces[slot] ?? 'feels';
const hatOf = (content: { hats?: (HatType | 'auto')[] }, figure: MemeFigure | undefined, slot: number): HatType => {
  const override = content.hats?.[slot];
  return override && override !== 'auto' ? override : figure?.hat ?? 'none';
};

export function renderTemplateMeme(
  format: TemplateFormat,
  content: TemplateContent,
  figures: MemeFigure[],
): ReactElement {
  const shell = (children: ReactElement | ReactElement[]) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#ffffff',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {children}
      <Watermark />
    </div>
  );

  switch (format) {
    case 'feels-bro': {
      const c = content as TemplateContent<'feels-bro'>;
      const [a, b] = figures;
      return shell([
        <div key="captions" style={{ display: 'flex', height: 250 }}>
          <Caption text={c.left} w={540} h={250} />
          <Caption text={c.right} w={540} h={250} />
        </div>,
        <div key="faces" style={{ display: 'flex', height: 560, justifyContent: 'center', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 540 }}>
            <Face variant={faceOf(format, c, 0)} hat={hatOf(c, a, 0)} size={500} />
            {a && <NameTag name={a.name} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 540 }}>
            <Face variant={faceOf(format, c, 1)} hat={hatOf(c, b, 1)} flip size={500} />
            {b && <NameTag name={b.name} />}
          </div>
        </div>,
        <div key="bottom" style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Caption text={c.bottom} w={1000} h={200} max={64} />
        </div>,
      ]);
    }

    case 'drake': {
      const c = content as TemplateContent<'drake'>;
      const [p] = figures;
      const row = (key: string, text: string, slot: number, tint: string) => (
        <div key={key} style={{ display: 'flex', height: 540, borderBottom: key === 'reject' ? `6px solid ${INK}` : 'none' }}>
          <div style={{ display: 'flex', width: 480, background: tint, alignItems: 'center', justifyContent: 'center', borderRight: `6px solid ${INK}` }}>
            <Face variant={faceOf(format, c, slot)} hat={hatOf(c, p, 0)} size={440} />
          </div>
          <Caption text={text} w={600} h={534} max={60} />
        </div>
      );
      return shell([
        row('reject', c.reject, 0, '#fde68a'),
        row('prefer', c.prefer, 1, '#fde68a'),
        ...(p
          ? [
              <div key="name" style={{ display: 'flex', position: 'absolute', left: 20, bottom: 12, fontSize: 24, color: '#4b5563' }}>
                {p.name}
              </div>,
            ]
          : []),
      ]);
    }

    case 'virgin-chad': {
      const c = content as TemplateContent<'virgin-chad'>;
      // One size for every trait in both columns, and a fixed-height title,
      // so the two columns line up
      const traitSize = Math.min(...[...c.virgin, ...c.chad].map((t) => fitFontSize(`• ${t}`, 480, 96, 38, 18)));
      const title = (label: string, fig: MemeFigure | undefined) => `The ${label}${fig ? ` ${fig.name}` : ''}`;
      const titleSize = Math.min(
        fitFontSize(title('Virgin', figures[0]), 490, 110, 44, 24),
        fitFontSize(title('Chad', figures[1]), 490, 110, 44, 24),
      );
      const col = (key: string, label: string, traits: string[], slot: number, fig: MemeFigure | undefined, tint: string) => (
        <div
          key={key}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 540, height: '100%', background: tint, padding: '24px 24px' }}
        >
          <div
            style={{ display: 'flex', height: 110, alignItems: 'center', justifyContent: 'center', fontSize: titleSize, lineHeight: 1.15, color: INK, textAlign: 'center' }}
          >
            {title(label, fig)}
          </div>
          <Face variant={faceOf(format, c, slot)} hat={hatOf(c, fig, slot)} flip={slot === 1} size={440} />
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 8 }}>
            {traits.map((t, i) => (
              <div key={i} style={{ display: 'flex', fontSize: traitSize, lineHeight: 1.2, color: INK, marginTop: 14 }}>
                {`• ${t}`}
              </div>
            ))}
          </div>
        </div>
      );
      return shell(
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          {col('virgin', 'Virgin', c.virgin, 0, figures[0], '#f3f4f6')}
          {col('chad', 'Chad', c.chad, 1, figures[1], '#ffffff')}
        </div>,
      );
    }

    case 'its-over': {
      const c = content as TemplateContent<'its-over'>;
      const [p] = figures;
      return shell([
        <div key="top" style={{ display: 'flex', justifyContent: 'center' }}>
          <Caption text={c.top} w={1040} h={230} max={60} />
        </div>,
        <div key="face" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Face variant={faceOf(format, c, 0)} hat={hatOf(c, p, 0)} size={600} />
          {p && <NameTag name={p.name} />}
        </div>,
        <div key="bottom" style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Caption text={c.bottom} w={1040} h={180} max={72} />
        </div>,
      ]);
    }
  }
}

export function renderTranslatedMeme(
  imageUrl: string,
  srcW: number,
  srcH: number,
  boxes: TextBox[],
): { element: ReactElement; width: number; height: number } {
  const { width, height } = translatedSize(srcW, srcH);
  const visible = boxes.filter((b) => b.text.trim());
  const sizes = harmonizeFontSizes(
    visible.map((b) => fitFontSize(b.text, Math.round(b.w * width) - 8, Math.round(b.h * height) - 8, 72, 12)),
    visible.map((b) => b.h * height),
  );
  const element = (
    <div style={{ display: 'flex', position: 'relative', width, height, background: '#000000', fontFamily: 'sans-serif' }}>
      <img src={imageUrl} width={width} height={height} alt="" style={{ position: 'absolute', left: 0, top: 0, objectFit: 'fill' }} />
      {visible.map((b, i) => {
          const w = Math.round(b.w * width);
          const h = Math.round(b.h * height);
          const outlined = b.background === null;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                position: 'absolute',
                left: Math.round(b.x * width),
                top: Math.round(b.y * height),
                width: w,
                height: h,
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 4,
                background: b.background ?? 'transparent',
                color: b.color,
                fontSize: sizes[i],
                lineHeight: 1.15,
                ...(outlined && { textShadow: OUTLINE }),
              }}
            >
              {b.text}
            </div>
          );
        })}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          right: 12,
          bottom: 8,
          fontSize: 20,
          color: 'rgba(255,255,255,0.9)',
          textShadow: '0 0 3px #000000, 0 0 3px #000000',
        }}
      >
        Translated by sillok
      </div>
    </div>
  );
  return { element, width, height };
}
