'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MAX_YEAR } from './useAgeFlow';

interface DensityBarProps {
  densityMap: number[];
  currentYear: number;
  minYear: number;
  totalYears: number;
  onYearClick: (year: number) => void;
}

function formatYear(year: number): string {
  if (year < 0) return `BC ${Math.abs(year)}`;
  return String(year);
}

export default function DensityBar({
  densityMap,
  currentYear,
  minYear,
  totalYears,
  onYearClick,
}: DensityBarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const barHeight = 300;

  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState(0);

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

      const r = Math.round(30 + intensity * 175);
      const g = Math.round(30 + intensity * 130);
      const b = Math.round(40 + intensity * 30);

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (totalYears === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const ratio = y / barHeight;
      const year = minYear + Math.floor(ratio * totalYears);
      setHoverYear(Math.max(minYear, Math.min(year, minYear + totalYears)));
      setHoverY(y);
    },
    [minYear, totalYears]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverYear(null);
  }, []);

  if (densityMap.length === 0) return null;

  // Current year marker position
  const currentMarkerY = totalYears > 0
    ? ((currentYear - minYear) / totalYears) * barHeight
    : 0;

  return (
    <div
      ref={containerRef}
      className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 md:right-6 md:flex md:flex-col md:items-end"
    >
      {/* Start year label */}
      <span className="mb-1 text-[10px] font-medium text-gray-400">
        {formatYear(minYear)}
      </span>

      {/* Bar + tooltip wrapper */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-pointer rounded-full"
        />

        {/* Current year tooltip */}
        <div
          className="pointer-events-none absolute right-3 -translate-y-1/2 whitespace-nowrap rounded bg-gray-900/80 px-1.5 py-0.5 text-[10px] font-mono text-amber-400 backdrop-blur-sm"
          style={{ top: currentMarkerY }}
        >
          {formatYear(currentYear)}
        </div>

        {/* Hover tooltip */}
        {hoverYear !== null && Math.abs(hoverY - currentMarkerY) > 16 && (
          <div
            className="pointer-events-none absolute right-3 -translate-y-1/2 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-mono text-gray-700 shadow-sm backdrop-blur-sm"
            style={{ top: hoverY }}
          >
            {formatYear(hoverYear)}
          </div>
        )}
      </div>

      {/* End year label */}
      <span className="mt-1 text-[10px] font-medium text-gray-400">
        {MAX_YEAR}
      </span>
    </div>
  );
}
