/* eslint-disable @next/next/no-img-element */
import type { ReactElement } from 'react';
import {
  FORMAT_DEFS,
  countLines,
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

const faceOf = (format: TemplateFormat, content: { faces?: FaceVariant[] }, slot: number): FaceVariant =>
  content.faces?.[slot] ?? (FORMAT_DEFS[format].faces as readonly FaceVariant[])[slot] ?? 'feels';
const hatOf = (content: { hats?: (HatType | 'auto')[] }, figure: MemeFigure | undefined, slot: number): HatType => {
  const override = content.hats?.[slot];
  return override && override !== 'auto' ? override : figure?.hat ?? 'none';
};

/** Star icon as an image — the bundled font has no ★ glyph */
function Star({ filled, size }: { filled: boolean; size: number }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="${filled ? '#f59e0b' : '#d1d5db'}"/></svg>`;
  return <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`} width={size} height={size} alt="" />;
}

/** Tiermaker-style row colors, best to worst */
const TIER_COLORS = ['#ff7f7f', '#ffbf7f', '#ffdf7f', '#ffff7f', '#bfff7f', '#7fbfff'];

// Content shapes per format (validated by the catalog schema before rendering)
type C = Record<string, any>;

export function renderTemplateMeme(
  format: TemplateFormat,
  content: TemplateContent,
  figures: MemeFigure[],
): ReactElement {
  const c = content as C & TemplateContent;
  const [p, q] = figures;
  const shell = (children: ReactElement | ReactElement[], background = '#ffffff') => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background,
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {children}
      <Watermark />
    </div>
  );

  /** Two labeled panels side by side (expectation/reality, how it started/going) */
  const twoPanels = (labels: [string, string], texts: [string, string]) =>
    shell(
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 540,
              height: '100%',
              padding: '28px 20px',
              background: i === 0 ? '#ffffff' : '#f3f4f6',
              borderLeft: i === 1 ? `4px solid ${INK}` : 'none',
            }}
          >
            <div style={{ display: 'flex', fontSize: 50, fontWeight: 700, color: INK }}>{labels[i]}</div>
            <Face variant={faceOf(format, c, i)} hat={hatOf(c, p, 0)} flip={i === 1} size={430} />
            <Caption text={texts[i]} w={500} h={360} max={48} />
          </div>
        ))}
      </div>,
    );

  switch (format) {
    case 'feels-bro':
      return shell([
        <div key="captions" style={{ display: 'flex', height: 250 }}>
          <Caption text={c.left} w={540} h={250} />
          <Caption text={c.right} w={540} h={250} />
        </div>,
        <div key="faces" style={{ display: 'flex', height: 560, justifyContent: 'center', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 540 }}>
            <Face variant={faceOf(format, c, 0)} hat={hatOf(c, p, 0)} size={500} />
            {p && <NameTag name={p.name} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 540 }}>
            <Face variant={faceOf(format, c, 1)} hat={hatOf(c, q, 1)} flip size={500} />
            {q && <NameTag name={q.name} />}
          </div>
        </div>,
        <div key="bottom" style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Caption text={c.bottom} w={1000} h={200} max={64} />
        </div>,
      ]);

    case 'drake': {
      const row = (key: string, text: string, slot: number) => (
        <div key={key} style={{ display: 'flex', height: 540, borderBottom: key === 'reject' ? `6px solid ${INK}` : 'none' }}>
          <div style={{ display: 'flex', width: 480, background: '#fde68a', alignItems: 'center', justifyContent: 'center', borderRight: `6px solid ${INK}` }}>
            <Face variant={faceOf(format, c, slot)} hat={hatOf(c, p, 0)} size={440} />
          </div>
          <Caption text={text} w={600} h={534} max={60} />
        </div>
      );
      return shell([
        row('reject', c.reject, 0),
        row('prefer', c.prefer, 1),
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
      // One size for every trait in both columns, and a fixed-height title, so the columns line up
      const traits = [...(c.virgin as string[]), ...(c.chad as string[])];
      const traitSize = Math.min(...traits.map((t) => fitFontSize(`• ${t}`, 480, 96, 38, 18)));
      const title = (label: string, fig: MemeFigure | undefined) => `The ${label}${fig ? ` ${fig.name}` : ''}`;
      const titleSize = Math.min(
        fitFontSize(title('Virgin', p), 490, 110, 44, 24),
        fitFontSize(title('Chad', q), 490, 110, 44, 24),
      );
      const col = (key: string, label: string, list: string[], slot: number, fig: MemeFigure | undefined, tint: string) => (
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
            {list.map((t, i) => (
              <div key={i} style={{ display: 'flex', fontSize: traitSize, lineHeight: 1.2, color: INK, marginTop: 14 }}>
                {`• ${t}`}
              </div>
            ))}
          </div>
        </div>
      );
      return shell(
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          {col('virgin', 'Virgin', c.virgin, 0, p, '#f3f4f6')}
          {col('chad', 'Chad', c.chad, 1, q, '#ffffff')}
        </div>,
      );
    }

    case 'its-over':
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

    case 'review': {
      const stars = Math.max(1, Math.min(5, Number(c.stars) || 1));
      return shell(
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '56px 64px' }}>
          <div style={{ display: 'flex', fontSize: fitFontSize(c.place, 950, 90, 64, 32), fontWeight: 700, color: INK }}>{c.place}</div>
          <div style={{ display: 'flex', fontSize: 28, color: '#6b7280', marginTop: 4 }}>Reviews</div>
          <div style={{ display: 'flex', height: 2, background: '#e5e7eb', margin: '28px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', width: 140, height: 140, borderRadius: 70, overflow: 'hidden', background: '#e5e7eb' }}>
              <Face variant={faceOf(format, c, 0)} hat={hatOf(c, p, 0)} size={140} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 28 }}>
              <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: INK }}>{p?.name ?? 'Anonymous'}</div>
              <div style={{ display: 'flex', fontSize: 26, color: '#6b7280' }}>{`Local Guide${c.when ? ` · ${c.when}` : ''}`}</div>
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: 28 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} filled={i <= stars} size={64} />
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              height: 400,
              fontSize: fitFontSize(c.body, 950, 380, 56, 24),
              lineHeight: 1.25,
              color: '#1f2937',
            }}
          >
            {c.body}
          </div>
          <div style={{ display: 'flex', marginTop: 'auto', fontSize: 26, color: '#9ca3af' }}>Helpful · Share</div>
        </div>,
      );
    }

    case 'starter-pack': {
      // 3×2 grid: the figure's face in the first tile, then the items
      const items: string[] = c.items;
      const itemSize = Math.min(...items.map((t) => fitFontSize(t, 300, 330, 44, 20)));
      const tiles = [null, ...items];
      return shell(
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', height: 130 }}>
            <Caption text={c.title} w={1030} h={130} max={64} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', width: 1032, height: 870 }}>
            {tiles.slice(0, 6).map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  width: 336,
                  height: 425,
                  margin: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #e5e7eb',
                  borderRadius: 12,
                  background: item === null ? '#f9fafb' : '#ffffff',
                }}
              >
                {item === null ? (
                  <Face variant={faceOf(format, c, 0)} hat={hatOf(c, p, 0)} size={320} />
                ) : (
                  <div style={{ display: 'flex', padding: 18, fontSize: itemSize, lineHeight: 1.2, textAlign: 'center', color: INK }}>{item}</div>
                )}
              </div>
            ))}
          </div>
        </div>,
      );
    }

    case 'tier-list': {
      const rows: { tier: string; items: string[] }[] = c.rows;
      const rowH = Math.floor((1080 - 150 - 40) / rows.length);
      const chipSize = Math.min(
        ...rows.flatMap((r) => r.items.map((t) => fitFontSize(t, 190, rowH - 40, 34, 16))),
      );
      return shell(
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#1f2937', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 130 }}>
            <div
              style={{ display: 'flex', flex: 1, fontSize: fitFontSize(c.title, 860, 110, 56, 28), fontWeight: 700, color: '#ffffff' }}
            >
              {c.title}
            </div>
            <div style={{ display: 'flex', width: 120, height: 120, borderRadius: 60, overflow: 'hidden', background: '#ffffff' }}>
              <Face variant={faceOf(format, c, 0)} hat={hatOf(c, p, 0)} size={120} />
            </div>
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', height: rowH, marginTop: 4, background: '#374151' }}>
              <div
                style={{
                  display: 'flex',
                  width: 140,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: TIER_COLORS[i] ?? TIER_COLORS[TIER_COLORS.length - 1],
                  fontSize: Math.min(72, rowH - 30),
                  fontWeight: 700,
                  color: INK,
                }}
              >
                {r.tier}
              </div>
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', flexWrap: 'wrap', padding: '0 12px' }}>
                {r.items.map((t, j) => (
                  <div
                    key={j}
                    style={{
                      display: 'flex',
                      width: 206,
                      height: rowH - 24,
                      margin: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: 8,
                      background: '#f9fafb',
                      borderRadius: 8,
                      fontSize: chipSize,
                      lineHeight: 1.15,
                      color: INK,
                    }}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>,
        '#1f2937',
      );
    }

    case 'expectation-reality':
      return twoPanels(['Expectation', 'Reality'], [c.expectation, c.reality]);

    case 'how-it-started':
      return twoPanels(['How it started', "How it's going"], [c.started, c.going]);

    case 'texting': {
      const messages: { from: number; text: string }[] = c.messages;
      const contact = q ?? p;
      // Largest size at which every bubble (max 700px wide) fits in the chat area
      const area = 1080 - 140 - 60;
      let size = 44;
      for (; size > 18; size -= 2) {
        const total = messages.reduce((h, m) => h + countLines(m.text, 660, size) * size * 1.25 + 36 + 18, 0);
        if (total <= area) break;
      }
      return shell(
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 140, padding: '0 32px', background: '#ffffff', borderBottom: '2px solid #e5e7eb' }}>
            <div style={{ display: 'flex', width: 96, height: 96, borderRadius: 48, overflow: 'hidden', background: '#e5e7eb' }}>
              <Face variant={faceOf(format, c, 1)} hat={hatOf(c, contact, 1)} size={96} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20 }}>
              <div style={{ display: 'flex', fontSize: 38, fontWeight: 700, color: INK }}>{contact?.name ?? 'Unknown'}</div>
              <div style={{ display: 'flex', fontSize: 24, color: '#6b7280' }}>online</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '30px 32px', background: '#f3f4f6' }}>
            {messages.map((m, i) => {
              const mine = m.from === 1;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 18 }}>
                  <div
                    style={{
                      display: 'flex',
                      maxWidth: 700,
                      padding: '18px 24px',
                      borderRadius: 28,
                      background: mine ? '#3b82f6' : '#ffffff',
                      color: mine ? '#ffffff' : INK,
                      fontSize: size,
                      lineHeight: 1.25,
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        '#f3f4f6',
      );
    }

    case 'nobody-me':
      return shell([
        <div key="text" style={{ display: 'flex', flexDirection: 'column', height: 400, padding: '48px 64px 0' }}>
          <div style={{ display: 'flex', fontSize: 52, color: INK }}>Nobody:</div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: fitFontSize(`${p?.name ?? 'Me'}: ${c.reaction}`, 950, 230, 52, 26),
              lineHeight: 1.2,
              color: INK,
            }}
          >
            {`${p?.name ?? 'Me'}: ${c.reaction}`}
          </div>
        </div>,
        <div key="face" style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'flex-end' }}>
          <Face variant={faceOf(format, c, 0)} hat={hatOf(c, p, 0)} size={640} />
        </div>,
      ]);

    case 'pov':
      return shell([
        <div key="top" style={{ display: 'flex', justifyContent: 'center' }}>
          <Caption text={`POV: ${c.pov}`} w={1040} h={280} max={60} />
        </div>,
        <div key="face" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Face variant={faceOf(format, c, 0)} hat={hatOf(c, p, 0)} size={c.bottom ? 560 : 640} />
        </div>,
        ...(c.bottom
          ? [
              <div key="bottom" style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Caption text={c.bottom} w={1040} h={180} max={64} />
              </div>,
            ]
          : []),
      ]);

    case 'tell-me': {
      const prompt = `Tell me you're ${c.identity} without telling me you're ${c.identity}`;
      return shell([
        <div key="top" style={{ display: 'flex', justifyContent: 'center' }}>
          <Caption text={prompt} w={1040} h={280} max={58} />
        </div>,
        <div key="reply" style={{ display: 'flex', flex: 1, alignItems: 'center', padding: '0 40px 60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 420 }}>
            <Face variant={faceOf(format, c, 0)} hat={hatOf(c, p, 0)} size={400} />
            {p && <NameTag name={p.name} />}
          </div>
          <div
            style={{
              display: 'flex',
              flex: 1,
              marginLeft: 24,
              padding: '28px 32px',
              borderRadius: 28,
              background: '#f3f4f6',
              fontSize: fitFontSize(c.answer, 520, 560, 52, 24),
              lineHeight: 1.25,
              color: INK,
            }}
          >
            {c.answer}
          </div>
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
