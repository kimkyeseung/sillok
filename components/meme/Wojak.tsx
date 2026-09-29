/* eslint-disable @next/next/no-img-element */
import type { FaceVariant, HatType } from '@/lib/meme';

// ─── Wojak line-art face (original drawing in the MS-Paint wojak style) ───
// Built as an SVG string and shown through a data-URI <img>, which renders the
// same in the browser and inside next/og (satori can't expand components in <svg>).
// 400×400 viewBox, head faces right; `flip` mirrors it to face left.

const INK = '#111111';
const line = (d: string, width = 7) =>
  `<path d="${d}" stroke="${INK}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const shape = (d: string, fill: string, width = 6) =>
  `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${width}" stroke-linejoin="round"/>`;

const HEAD =
  'M 128 322 C 92 282 76 214 96 150 C 118 82 196 44 262 56 C 324 68 356 118 350 180 ' +
  'C 348 206 356 232 346 258 C 332 298 300 336 252 348 C 216 356 186 346 166 326';

function brows(v: FaceVariant): string {
  switch (v) {
    case 'angry':
      return line('M 196 150 C 214 156 232 166 246 178 M 276 176 C 290 164 306 156 322 152');
    case 'happy':
    case 'smug':
      return line('M 194 160 C 208 146 232 144 248 154 M 276 154 C 290 144 310 146 320 158');
    case 'npc':
      return line('M 200 160 L 244 160 M 278 160 L 318 160');
    default: // feels / crying: sad, raised inner ends
      return line('M 192 166 C 210 156 230 150 246 150 M 278 150 C 292 150 308 156 320 168');
  }
}

function eyes(v: FaceVariant): string {
  if (v === 'npc') {
    return `<circle cx="222" cy="190" r="7" fill="${INK}"/><circle cx="298" cy="190" r="7" fill="${INK}"/>`;
  }
  if (v === 'happy') return line('M 204 192 C 214 180 232 180 242 192 M 282 192 C 292 180 310 180 318 192');
  if (v === 'smug') return line('M 202 188 C 214 196 232 196 244 188 M 280 188 C 292 196 308 196 318 188');
  const shift = v === 'angry' ? 4 : 0;
  return (
    line('M 200 188 C 210 176 234 174 246 190 C 234 198 212 198 200 188 Z') +
    line('M 278 190 C 288 178 310 178 320 192 C 310 200 290 200 278 190 Z') +
    `<circle cx="${222 + shift}" cy="188" r="8" fill="${INK}"/>` +
    `<circle cx="${298 + shift}" cy="190" r="8" fill="${INK}"/>`
  );
}

function mouth(v: FaceVariant): string {
  switch (v) {
    case 'crying':
      return line('M 226 300 C 244 284 272 282 296 298');
    case 'angry':
      return line(
        'M 226 292 C 246 282 276 282 298 292 L 294 306 C 272 298 248 298 230 306 Z M 244 288 L 242 302 M 262 285 L 262 300 M 280 287 L 281 302',
        6,
      );
    case 'happy':
      return line('M 222 282 C 240 306 280 308 302 282');
    case 'smug':
      return line('M 228 294 C 250 298 276 294 300 278');
    case 'npc':
      return line('M 236 292 L 290 292');
    default: // feels: flat, slightly downturned
      return line('M 224 292 C 246 297 276 297 300 290');
  }
}

function extras(v: FaceVariant): string {
  if (v === 'crying') {
    return '<path d="M 212 200 C 210 226 206 250 202 274 M 300 202 C 302 224 306 246 310 266" stroke="#3b82f6" stroke-width="9" stroke-linecap="round" fill="none"/>';
  }
  if (v === 'angry') {
    return '<path d="M 330 120 L 346 104 M 340 132 L 360 124 M 326 108 L 330 88" stroke="#dc2626" stroke-width="6" stroke-linecap="round" fill="none"/>';
  }
  return '';
}

function hat(type: HatType): string {
  switch (type) {
    case 'ikseongwan':
      // King's winged cap (익선관): dark crown on the skull + two upright wings at the back
      return (
        shape('M 100 146 C 104 84 168 44 240 48 C 300 52 344 88 350 146 C 290 128 170 124 100 146 Z', '#1f2937') +
        shape('M 110 92 C 84 66 86 38 112 40 C 128 42 134 62 128 86 Z', '#1f2937', 5) +
        shape('M 150 66 C 138 34 156 14 178 24 C 190 32 188 52 176 66 Z', '#1f2937', 5) +
        '<path d="M 104 142 C 170 122 290 124 348 142" stroke="#b45309" stroke-width="6" fill="none"/>'
      );
    case 'gat':
      // Scholar's horsehair hat (갓): translucent brim + tall crown + beaded chin strap
      return (
        shape('M 190 24 L 294 24 L 300 112 L 184 112 Z', 'rgba(17,17,17,0.82)', 5) +
        `<ellipse cx="228" cy="118" rx="164" ry="22" fill="rgba(17,17,17,0.55)" stroke="${INK}" stroke-width="5"/>` +
        `<path d="M 340 136 C 350 200 330 280 290 346" stroke="${INK}" stroke-width="4" fill="none" stroke-dasharray="2 9" stroke-linecap="round"/>`
      );
    case 'helmet':
      // General's helmet (투구): domed bowl, spike, neck guard, red band
      return (
        shape('M 96 150 C 98 80 166 40 236 42 C 306 44 352 92 352 150 Z', '#6b7280') +
        shape('M 228 44 L 236 2 L 246 44', '#9ca3af', 5) +
        shape('M 96 150 C 90 196 92 236 110 268 L 136 262 C 124 226 122 190 128 152 Z', '#6b7280', 5) +
        '<path d="M 98 146 L 354 146" stroke="#b91c1c" stroke-width="10" stroke-linecap="round"/>'
      );
    case 'topknot':
      // Topknot (상투) with headband (망건)
      return (
        shape('M 204 50 C 196 18 226 4 246 14 C 264 24 262 48 250 56', INK, 5) +
        '<path d="M 104 128 C 170 104 290 102 346 124" stroke="#111111" stroke-width="12" fill="none" stroke-linecap="round"/>'
      );
    default:
      return '';
  }
}

/** Standalone SVG markup for one wojak */
export function wojakSvg({
  variant = 'feels',
  hat: hatType = 'none',
  flip = false,
}: {
  variant?: FaceVariant;
  hat?: HatType;
  flip?: boolean;
}): string {
  const skin = variant === 'npc' ? '#d1d5db' : '#ffffff';
  const body = [
    // Shoulders + neck + collarbone
    line('M 20 398 C 64 382 116 380 150 372 M 262 378 C 304 384 346 386 388 398'),
    line('M 146 330 L 150 374 M 254 348 L 262 380'),
    line('M 186 386 C 196 394 206 394 214 386', 5),
    // Head
    `<path d="${HEAD} Z" fill="${skin}"/>`,
    line(HEAD),
    variant === 'npc' ? '' : line('M 182 108 C 214 100 256 100 294 110 M 170 126 C 206 118 252 120 300 132', 5),
    // Ear
    line('M 128 190 C 104 184 100 226 132 236'),
    brows(variant),
    eyes(variant),
    // Nose
    line('M 268 196 C 264 220 272 238 288 248 C 282 256 270 256 262 250 M 242 246 C 236 252 242 258 250 256'),
    mouth(variant),
    extras(variant),
    hat(hatType),
  ].join('');
  const g = flip ? `<g transform="translate(400 0) scale(-1 1)">${body}</g>` : body;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${g}</svg>`;
}

export function wojakDataUri(opts: Parameters<typeof wojakSvg>[0]): string {
  return `data:image/svg+xml;base64,${Buffer.from(wojakSvg(opts)).toString('base64')}`;
}

export default function Wojak({
  variant,
  hat: hatType,
  flip,
  size = 400,
}: {
  variant?: FaceVariant;
  hat?: HatType;
  flip?: boolean;
  size?: number;
}) {
  return <img src={wojakDataUri({ variant, hat: hatType, flip })} width={size} height={size} alt="" />;
}
