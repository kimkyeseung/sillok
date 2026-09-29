'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { clampBox, type TextBox } from '@/lib/meme';

// Drag to move, drag the corner handle to resize. Boxes are 0..1 fractions of the image.

interface Props {
  imageUrl: string;
  boxes: TextBox[];
  selected: number | null;
  onSelect: (index: number | null) => void;
  onChange: (boxes: TextBox[]) => void;
}

type DragMode = 'move' | 'resize';

export default function MemeBoxEditor({ imageUrl, boxes, selected, onSelect, onChange }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ index: number; mode: DragMode; startX: number; startY: number; box: TextBox } | null>(null);

  const startDrag = (e: React.PointerEvent, index: number, mode: DragMode) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { index, mode, startX: e.clientX, startY: e.clientY, box: boxes[index] };
    onSelect(index);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const frame = frameRef.current;
    if (!d || !frame) return;
    const rect = frame.getBoundingClientRect();
    const dx = (e.clientX - d.startX) / rect.width;
    const dy = (e.clientY - d.startY) / rect.height;
    const next =
      d.mode === 'move'
        ? { ...d.box, x: d.box.x + dx, y: d.box.y + dy }
        : { ...d.box, w: Math.min(d.box.w + dx, 1 - d.box.x), h: Math.min(d.box.h + dy, 1 - d.box.y) };
    onChange(boxes.map((b, i) => (i === d.index ? clampBox(next) : b)));
  };

  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div
      ref={frameRef}
      className="relative w-full touch-none select-none overflow-hidden rounded-lg border border-gray-200"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerDown={() => onSelect(null)}
    >
      <img src={imageUrl} alt="Original meme" className="block w-full" draggable={false} />
      {boxes.map((b, i) => (
        <div
          key={i}
          role="button"
          tabIndex={0}
          aria-label={`Text box ${i + 1}`}
          onPointerDown={(e) => startDrag(e, i, 'move')}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(i)}
          className={`absolute flex cursor-move items-center justify-center overflow-hidden border-2 text-center text-[10px] leading-tight ${
            selected === i ? 'border-brand-600 bg-brand-500/20' : 'border-dashed border-amber-500 bg-amber-300/20'
          }`}
          style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}
        >
          <span className="pointer-events-none rounded bg-white/80 px-1 text-gray-900">{i + 1}</span>
          <span
            onPointerDown={(e) => startDrag(e, i, 'resize')}
            className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize bg-brand-600"
            aria-hidden
          />
        </div>
      ))}
    </div>
  );
}
