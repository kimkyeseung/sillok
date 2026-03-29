'use client';

import { useRef, useEffect, useCallback } from 'react';

interface DensityBarProps {
  densityMap: number[];
  currentYear: number;
  minYear: number;
  totalYears: number;
  onYearClick: (year: number) => void;
}

export default function DensityBar({
  densityMap,
  currentYear,
  minYear,
  totalYears,
  onYearClick,
}: DensityBarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barHeight = 300; // px, visual height of density bar

  // Draw density visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || densityMap.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 8;
    canvas.width = width * dpr;
    canvas.height = barHeight * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${barHeight}px`;
    ctx.scale(dpr, dpr);

    const maxDensity = Math.max(...densityMap, 1);

    // Draw density gradient
    for (let i = 0; i < barHeight; i++) {
      const yearIndex = Math.floor((i / barHeight) * densityMap.length);
      const density = densityMap[yearIndex] ?? 0;
      const intensity = density / maxDensity;

      // Map intensity to color: dark → bright amber
      const r = Math.round(30 + intensity * 175); // 30→205
      const g = Math.round(30 + intensity * 130); // 30→160
      const b = Math.round(40 + intensity * 30);  // 40→70

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(0, i, width, 1);
    }

    // Draw current position marker
    if (totalYears > 0) {
      const markerY = ((currentYear - minYear) / totalYears) * barHeight;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, Math.max(0, markerY - 1), width, 2);
    }
  }, [densityMap, currentYear, minYear, totalYears]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (totalYears === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const ratio = y / barHeight;
      const targetYear = minYear + Math.floor(ratio * totalYears);
      onYearClick(targetYear);
    },
    [minYear, totalYears, onYearClick]
  );

  if (densityMap.length === 0) return null;

  return (
    <div className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 md:right-6 md:block">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="cursor-pointer rounded-full"
        title="Click to jump to year"
      />
    </div>
  );
}
