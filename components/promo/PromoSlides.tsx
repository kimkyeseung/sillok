/* eslint-disable @next/next/no-img-element */
import type { ReactElement } from 'react';
import { fitFontSize } from '@/lib/meme';
import { clip, splitThreadContent, type PromoSlide } from '@/lib/promo';
import type { PromoThread } from '@/lib/promo-data';
import { wojakDataUri } from '@/components/meme/Wojak';

// ─── Instagram carousel slides (1080×1350) for next/og — server-only ───
// cover → the thread image (or the story as a text card), history → the facts,
// cta → where to read more. Every multi-child div needs display:flex.

const INK = '#111111';
const MUTED = '#6b7280';
const ACCENT = '#7c3aed';

function Footer({ right }: { right?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 30, color: MUTED }}>
      <div style={{ display: 'flex', fontWeight: 700, color: INK }}>sillok.kr</div>
      {right && <div style={{ display: 'flex' }}>{right}</div>}
    </div>
  );
}

function Frame({ children, background = '#ffffff' }: { children: ReactElement | ReactElement[]; background?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: '72px 80px 64px',
        background,
        fontFamily: 'sans-serif',
      }}
    >
      {children}
    </div>
  );
}

/**
 * @param imageData the thread image as a data URI (pre-fetched and checked by
 *   the route; null when missing or not a PNG/JPEG → text cover)
 */
export function renderPromoSlide(slide: PromoSlide, t: PromoThread, imageData: string | null, total = 3): ReactElement {
  const { main, real } = splitThreadContent(t.content);
  const names = t.figures.map((f) => f.name);
  const page = `${slide === 'cover' ? 1 : slide === 'history' ? 2 : 3} / ${total}`;

  if (slide === 'cover') {
    if (imageData) {
      // Image first (memes/photos), title underneath
      return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#ffffff', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', width: 1080, height: 1080, alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
            <img src={imageData} width={1080} height={1080} alt="" style={{ objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', padding: '24px 60px 28px' }}>
            <div style={{ display: 'flex', fontSize: fitFontSize(t.title, 960, 150, 52, 26), fontWeight: 700, lineHeight: 1.15, color: INK }}>
              {t.title}
            </div>
            <Footer right={page} />
          </div>
        </div>
      );
    }
    // Text thread (e.g. short story): the post itself as a card
    const body = clip(main, 900);
    return (
      <Frame background="#fffbeb">
        <div style={{ display: 'flex', fontSize: fitFontSize(t.title, 920, 200, 64, 32), fontWeight: 700, lineHeight: 1.15, color: INK }}>
          {t.title}
        </div>
        <div
          style={{
            display: 'flex',
            flex: 1,
            marginTop: 40,
            fontSize: fitFontSize(body.replace(/\n/g, ' '), 920, 820, 44, 22),
            lineHeight: 1.35,
            color: '#1f2937',
            whiteSpace: 'pre-wrap',
          }}
        >
          {body}
        </div>
        <Footer right={page} />
      </Frame>
    );
  }

  if (slide === 'history') {
    const text = clip(real ?? main, 700);
    return (
      <Frame>
        <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: 2, color: ACCENT }}>
          {real ? "WHAT'S REAL" : 'THE HISTORY BEHIND IT'}
        </div>
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            fontSize: fitFontSize(text.replace(/\n/g, ' '), 920, 900, 56, 26),
            lineHeight: 1.35,
            color: INK,
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </div>
        <Footer right={names.length ? names.join(' · ') : page} />
      </Frame>
    );
  }

  // cta
  return (
    <Frame background="#111827">
      <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: 2, color: '#a78bfa' }}>READ THE FULL THREAD</div>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <img src={wojakDataUri({ variant: 'smug', hat: 'gat' })} width={360} height={360} alt="" style={{ background: '#ffffff', borderRadius: 180 }} />
        <div style={{ display: 'flex', marginTop: 48, fontSize: 110, fontWeight: 700, color: '#ffffff' }}>sillok.kr</div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 36, color: '#d1d5db', textAlign: 'center' }}>
          Korean history, one figure at a time
        </div>
        {names.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginTop: 48 }}>
            {names.slice(0, 4).map((n) => (
              <div
                key={n}
                style={{ display: 'flex', margin: 8, padding: '10px 26px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', fontSize: 30, color: '#ffffff' }}
              >
                {n}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', fontSize: 30, color: '#9ca3af' }}>Link in bio</div>
    </Frame>
  );
}
